/**
 * Output formatting utilities for extracted workflow data
 *
 * This module provides functions to format extracted ComfyUI workflow data
 * into various output formats including JSON and human-readable formats.
 *
 * @fileoverview Output formatting and data presentation utilities
 */

import { extractWorkflowInfo } from './validation';
import { ExtractedData, OutputFormat, ExtractedWorkflowData } from '../types';

/**
 * Formats extraction results into the specified output format
 *
 * @param results - Array of extracted data from files
 * @param format - Output format ('json' or 'pretty')
 * @returns Formatted string representation of the results
 *
 * @example
 * ```typescript
 * const results = [{ file: 'image.png', workflow: {...} }];
 * const output = formatOutput(results, 'pretty');
 * console.log(output);
 * ```
 */
export function formatOutput(
  file: string,
  result: ExtractedData,
  format: OutputFormat
): string {
  switch (format) {
    case 'json':
      return JSON.stringify(result, null, 2);

    case 'pretty':
      return formatPretty(file, result);

    default:
      return JSON.stringify(result, null, 2);
  }
}

/**
 * Formats results in a human-readable format
 *
 * Creates a detailed, structured output that's easy to read, including
 * workflow statistics, LoRA models, prompts, and generation settings.
 *
 * @param result - Array of extracted data to format
 * @returns Human-readable formatted string
 */
function formatPretty(file: string, result: ExtractedData): string {
  let output = '';

  output += `\n=== ${file} ===\n`;

  if (result.workflow) {
    const workflowData = extractComfyUIWorkflowData(result.workflow);

    output += `ComfyUI Workflow:\n`;

    // Display LoRA models
    if (workflowData.loras.length > 0) {
      output += `\nLoRA Models:\n`;
      workflowData.loras.forEach((lora, index) => {
        output += `  ${index + 1}. ${lora.name} (strength: ${lora.strength})\n`;
      });
    }

    // Display text encoding prompts
    if (workflowData.prompts.length > 0) {
      output += `\nPrompts:\n`;

      // Only show positive/negative labels if we're very confident about the distinction
      // This means we found clear KSampler connections and have both types
      const hasPositive = workflowData.prompts.some(
        (p) => p.positive && p.positive !== ''
      );
      const hasNegative = workflowData.prompts.some((p) => p.negative);
      // Only show positive/negative distinction when:
      // 1. We have both types of prompts
      // 2. We have a small number of prompts (clear pairing)
      // 3. The positive and negative prompts are clearly distinct content
      const hasConfidentDistinction =
        hasPositive &&
        hasNegative &&
        workflowData.prompts.length <= 2 &&
        workflowData.prompts.some(
          (p) => p.positive && p.negative && p.positive !== p.negative
        ); // Ensure they're actually different

      const shouldDistinguish = hasConfidentDistinction;

      workflowData.prompts.forEach((prompt, index) => {
        if (prompt.positive && prompt.positive !== '') {
          if (shouldDistinguish) {
            output += `  Positive ${index + 1}: ${prompt.positive}\n`;
          } else {
            output += `  ${index + 1}: ${prompt.positive}\n`;
          }
        }

        if (prompt.negative) {
          if (shouldDistinguish) {
            output += `\n  Negative ${index + 1}: ${prompt.negative}\n`;
          } else {
            output += `  ${index + 1}: ${prompt.negative}\n`;
          }
        }
      });
    }

    // Sampler settings
    if (workflowData.samplerSettings) {
      const s = workflowData.samplerSettings;
      output += `\nSampler Settings:\n`;
      if (s.steps) output += `  Steps: ${s.steps}\n`;
      if (s.cfg !== undefined) output += `  CFG Scale: ${s.cfg}\n`;
      if (s.cfg_start !== undefined && s.cfg_end !== undefined) {
        output += `  CFG Schedule: ${s.cfg_start} → ${s.cfg_end}\n`;
      }
      if (s.sampler) output += `  Sampler: ${s.sampler}\n`;
      if (s.scheduler) output += `  Scheduler: ${s.scheduler}\n`;
      if (s.seed !== undefined) output += `  Seed: ${s.seed}\n`;
      if (s.denoise !== undefined) output += `  Denoise: ${s.denoise}\n`;
    }

    // Model info
    if (workflowData.models.length > 0) {
      output += `\nModels:\n`;
      workflowData.models.forEach((model, index) => {
        output += `  ${index + 1}. ${model}\n`;
      });
    }

    // Basic stats
    const info = extractWorkflowInfo(result.workflow);
    output += `\nWorkflow Stats:\n`;
    output += `  Total Nodes: ${info.nodeCount}\n`;
    output += `  Node Types: ${info.nodeTypes.slice(0, 5).join(', ')}${info.nodeTypes.length > 5 ? '...' : ''}\n`;
  } else if (result.parameters) {
    // Handle A1111-style parameters
    output += `A1111-style Parameters:\n`;

    if (result.parameters.positive_prompt) {
      output += `\nPrompts:\n`;
      output += `  Positive: ${result.parameters.positive_prompt}\n`;
      if (result.parameters.negative_prompt) {
        output += `\n  Negative: ${result.parameters.negative_prompt}\n`;
      }
    }

    output += `\nGeneration Settings:\n`;
    if (result.parameters.steps)
      output += `  Steps: ${result.parameters.steps}\n`;
    if (result.parameters.cfg)
      output += `  CFG Scale: ${result.parameters.cfg}\n`;
    if (result.parameters.sampler)
      output += `  Sampler: ${result.parameters.sampler}\n`;
    if (result.parameters.seed) output += `  Seed: ${result.parameters.seed}\n`;
    if (result.parameters.model)
      output += `  Model: ${result.parameters.model}\n`;
  } else if (result.metadata) {
    output += `Metadata found:\n`;
    output += `  ${result.metadata.substring(0, 200)}${result.metadata.length > 200 ? '...' : ''}\n`;
  } else {
    output += `No workflow found\n`;
  }

  output += '\n';

  return output;
}

function extractComfyUIWorkflowData(workflow: any): ExtractedWorkflowData {
  const data: ExtractedWorkflowData = {
    loras: [],
    prompts: [],
    samplerSettings: null,
    models: [],
  };


  // Handle different workflow formats
  let workflowNodes = workflow;
  
  // Handle UI format workflow (has nodes array)
  if (workflow.nodes && Array.isArray(workflow.nodes)) {
    // Convert UI format nodes to API format for processing
    workflowNodes = {};
    workflow.nodes.forEach((node: any) => {
      if (node && node.id !== undefined) {
        // Map UI format node to API format
        workflowNodes[node.id.toString()] = {
          class_type: node.type,
          inputs: extractInputsFromUINode(node),
          _meta: node.properties ? { title: node.properties['Node name for S&R'] } : {}
        };
      }
    });
  }
  // Handle API format with nested prompt structure
  else if (workflow.prompt && typeof workflow.prompt === 'string') {
    try {
      workflowNodes = JSON.parse(workflow.prompt);
    } catch (e) {
      // Fallback to original workflow
    }
  }
  // Handle API format with object prompt
  else if (workflow.prompt && typeof workflow.prompt === 'object') {
    workflowNodes = workflow.prompt;
  }

  if (!workflowNodes || typeof workflowNodes !== 'object') {
    return data;
  }

  // First, find sampler nodes to identify positive/negative connections
  const promptConnections = findPromptConnections(workflowNodes, workflow);

  // Extract data from nodes
  for (const [nodeId, node] of Object.entries(workflowNodes)) {
    if (!node || typeof node !== 'object') continue;

    const nodeData = node as any;
    const classType = nodeData.class_type;
    const inputs = nodeData.inputs || {};

    // Extract LoRA information
    if (
      classType === 'WanVideoLoraSelect' ||
      classType?.includes('Lora') ||
      classType === 'Power Lora Loader (rgthree)'
    ) {
      // Handle Power Lora Loader (rgthree) format
      if (classType === 'Power Lora Loader (rgthree)') {
        for (const [inputKey, inputValue] of Object.entries(inputs)) {
          if (
            inputKey.startsWith('lora_') &&
            typeof inputValue === 'object' &&
            inputValue !== null
          ) {
            const loraConfig = inputValue as any;
            // Only include enabled LoRAs
            if (
              loraConfig.on === true &&
              loraConfig.lora &&
              loraConfig.strength !== undefined
            ) {
              const loraName =
                loraConfig.lora.split('\\').pop()?.split('/').pop() ||
                loraConfig.lora;
              data.loras.push({
                name: loraName,
                strength: loraConfig.strength,
              });
            }
          }
        }
      }

      // Handle individual LoRA nodes with lora_name and strength fields
      if (inputs.lora_name && (inputs.strength_model !== undefined || inputs.strength !== undefined)) {
        const loraName =
          inputs.lora_name.split('\\').pop()?.split('/').pop() || inputs.lora_name;
        const strength = inputs.strength_model !== undefined ? inputs.strength_model : inputs.strength;
        data.loras.push({
          name: loraName,
          strength: strength,
        });
      }
      
      // Handle legacy lora field for backwards compatibility
      if (inputs.lora && inputs.strength !== undefined) {
        const loraName =
          inputs.lora.split('\\').pop()?.split('/').pop() || inputs.lora;
        data.loras.push({
          name: loraName,
          strength: inputs.strength,
        });
      }

      // Handle LoraTagLoader with text field containing multiple LoRA tags
      if (inputs.text && typeof inputs.text === 'string') {
        const loraMatches = inputs.text.match(/<lora:([^:>]+):([0-9.]+)>/g);
        if (loraMatches) {
          loraMatches.forEach((match: string) => {
            const [, loraPath, strengthStr] =
              match.match(/<lora:([^:>]+):([0-9.]+)>/) || [];
            if (loraPath && strengthStr) {
              const loraName =
                loraPath.split('\\').pop()?.split('/').pop() || loraPath;
              const strength = parseFloat(strengthStr);
              data.loras.push({
                name: loraName,
                strength: strength,
              });
            }
          });
        }
      }
    }

    // Extract text from various prompt-related nodes
    if (
      classType === 'CLIPTextEncode' ||
      classType === 'WanVideoTextEncode' ||
      classType?.includes('TextEncode') ||
      classType === 'Text Multiline' ||
      classType === 'easy showAnything' ||
      classType === 'Load WanVideo Clip Encoder'
    ) {
      if (inputs.text || inputs.positive_prompt) {
        let text = inputs.text || inputs.positive_prompt;

        // Skip if text is a connection array (like ["224", 0]) - these need to be resolved
        // in a more complex way that we don't handle in this basic extraction
        if (Array.isArray(text)) {
          continue;
        }

        // Only process if we have actual text content
        if (typeof text !== 'string' || !text.trim()) {
          continue;
        }

        const isPositive = promptConnections.positive.includes(nodeId);
        const isNegative = promptConnections.negative.includes(nodeId);


        if (isPositive) {
          data.prompts.push({
            positive: text,
            negative: undefined,
          });
        } else if (isNegative) {
          data.prompts.push({
            positive: '',
            negative: text,
          });
        } else {
          // Fallback: if we can't determine, just add as a generic prompt
          // Don't assume positive or negative - let the display logic handle it
          data.prompts.push({
            positive: text,
            negative: inputs.negative_prompt || inputs.negative,
          });
        }
      }
    }

    // Extract sampler settings
    if (
      classType === 'WanVideoSampler' ||
      classType?.includes('Sampler') ||
      classType === 'KSampler'
    ) {
      data.samplerSettings = {
        steps: inputs.steps,
        cfg: typeof inputs.cfg === 'number' ? inputs.cfg : inputs.shift, // Handle both cfg and shift parameters
        sampler: inputs.sampler_name || inputs.sampler,
        scheduler: inputs.scheduler,
        seed: inputs.seed,
        denoise: inputs.denoise_strength || inputs.denoise,
      };
    }

    // Also check for CFG schedule nodes
    if (classType === 'CreateCFGScheduleFloatList') {
      if (!data.samplerSettings) data.samplerSettings = {};
      data.samplerSettings.cfg_start = inputs.cfg_scale_start;
      data.samplerSettings.cfg_end = inputs.cfg_scale_end;
    }

    // Extract model information
    if (
      classType?.includes('ModelLoader') ||
      classType?.includes('CheckpointLoader') ||
      classType?.includes('VAELoader')
    ) {
      if (inputs.model_name || inputs.ckpt_name || inputs.model) {
        const modelName = inputs.model_name || inputs.ckpt_name || inputs.model;
        if (typeof modelName === 'string') {
          const cleanName = modelName.split('\\').pop()?.split('/').pop();
          if (cleanName) {
            data.models.push(cleanName);
          }
        }
      }
    }
  }

  // Merge positive and negative prompts that should be paired
  data.prompts = mergePromptPairs(data.prompts);

  return data;
}

/**
 * Find positive and negative prompt connections by analyzing sampler nodes and links
 */
function findPromptConnections(workflowNodes: any, workflow?: any): {
  positive: string[];
  negative: string[];
} {
  const connections: { positive: string[]; negative: string[] } = {
    positive: [],
    negative: [],
  };

  // For UI format workflows, we need to trace links
  if (workflow && workflow.links && Array.isArray(workflow.links)) {
    // Find KSampler nodes and trace their connections through links
    for (const [nodeId, node] of Object.entries(workflowNodes)) {
      const nodeData = node as any;
      const classType = nodeData.class_type;
      
      if (
        classType === 'KSampler' ||
        classType === 'WanVideoSampler' ||
        classType?.includes('Sampler')
      ) {
        const inputs = nodeData.inputs || {};
        
        // Trace positive connection through links
        if (inputs.positive && typeof inputs.positive === 'object' && inputs.positive.link) {
          const linkId = inputs.positive.link;
          const link = workflow.links.find((l: any) => l[0] === linkId);
          if (link) {
            const [, outputNodeId] = link;
            connections.positive.push(outputNodeId.toString());
          }
        }
        
        // Trace negative connection through links
        if (inputs.negative && typeof inputs.negative === 'object' && inputs.negative.link) {
          const linkId = inputs.negative.link;
          const link = workflow.links.find((l: any) => l[0] === linkId);
          if (link) {
            const [, outputNodeId] = link;
            connections.negative.push(outputNodeId.toString());
          }
        }
      }
    }
  } else {
    // Original API format handling
    for (const [_nodeId, node] of Object.entries(workflowNodes)) {
      if (!node || typeof node !== 'object') continue;

      const nodeData = node as any;
      const classType = nodeData.class_type;
      const inputs = nodeData.inputs || {};

      if (
        classType === 'KSampler' ||
        classType === 'WanVideoSampler' ||
        classType?.includes('Sampler')
      ) {
        // Check for positive connection
        if (inputs.positive && Array.isArray(inputs.positive)) {
          // API format: [nodeId, slotIndex]
          const [connectedNodeId] = inputs.positive;
          connections.positive.push(connectedNodeId.toString());
        }

        // Check for negative connection  
        if (inputs.negative && Array.isArray(inputs.negative)) {
          // API format: [nodeId, slotIndex]
          const [connectedNodeId] = inputs.negative;
          connections.negative.push(connectedNodeId.toString());
        }
      }
    }
  }

  return connections;
}

/**
 * Merge separate positive and negative prompt entries into paired entries
 */
function mergePromptPairs(
  prompts: Array<{ positive: string; negative?: string }>
): Array<{ positive: string; negative?: string }> {
  // Group prompts
  const positivePrompts = prompts.filter(
    (p) => p.positive && p.positive !== ''
  );
  const negativePrompts = prompts.filter((p) => p.negative);

  const result = [];

  // If we have both positive and negative prompts, try to pair them
  if (positivePrompts.length > 0 && negativePrompts.length > 0) {
    for (
      let i = 0;
      i < Math.max(positivePrompts.length, negativePrompts.length);
      i++
    ) {
      const positive = positivePrompts[i]?.positive || '';
      const negative = negativePrompts[i]?.negative || undefined;

      if (positive || negative) {
        result.push({ positive, negative });
      }
    }
  } else {
    // Just add all prompts as-is
    result.push(...prompts.filter((p) => p.positive || p.negative));
  }

  return result;
}

/**
 * Extract inputs from UI format node and convert to API format
 */
function extractInputsFromUINode(node: any): Record<string, any> {
  const inputs: Record<string, any> = {};
  const classType = node.type;
  const widgetValues = node.widgets_values || [];

  // Map common node types and their widget values to input names
  switch (classType) {
    case 'CheckpointLoaderSimple':
      if (widgetValues[0]) inputs.ckpt_name = widgetValues[0];
      break;
    case 'LoraLoader':
      if (widgetValues[0]) inputs.lora_name = widgetValues[0];
      if (widgetValues[1] !== undefined) inputs.strength_model = widgetValues[1];
      if (widgetValues[2] !== undefined) inputs.strength_clip = widgetValues[2];
      break;
    case 'CLIPTextEncode':
      if (widgetValues[0]) inputs.text = widgetValues[0];
      break;
    case 'WanVideoTextEncode':
      if (widgetValues[0]) inputs.text = widgetValues[0];
      if (widgetValues[1]) inputs.negative_prompt = widgetValues[1];
      break;
    case 'KSampler':
      if (widgetValues[0] !== undefined) inputs.seed = widgetValues[0];
      if (widgetValues[2] !== undefined) inputs.steps = widgetValues[2];
      if (widgetValues[3] !== undefined) inputs.cfg = widgetValues[3];
      if (widgetValues[4]) inputs.sampler_name = widgetValues[4];
      if (widgetValues[5]) inputs.scheduler = widgetValues[5];
      if (widgetValues[6] !== undefined) inputs.denoise = widgetValues[6];
      break;
    case 'WanVideoSampler':
      if (widgetValues[0] !== undefined) inputs.steps = widgetValues[0];
      if (widgetValues[1] !== undefined) inputs.cfg = widgetValues[1];
      if (widgetValues[3] !== undefined) inputs.seed = widgetValues[3];
      if (widgetValues[6]) inputs.sampler_name = widgetValues[6];
      if (widgetValues[10]) inputs.scheduler = widgetValues[10];
      break;
    case 'EmptyLatentImage':
      if (widgetValues[0] !== undefined) inputs.width = widgetValues[0];
      if (widgetValues[1] !== undefined) inputs.height = widgetValues[1];
      if (widgetValues[2] !== undefined) inputs.batch_size = widgetValues[2];
      break;
    case 'SaveImage':
      if (widgetValues[0]) inputs.filename_prefix = widgetValues[0];
      break;
    case 'UpscaleModelLoader':
      if (widgetValues[0]) inputs.model_name = widgetValues[0];
      break;
    case 'CreateCFGScheduleFloatList':
      if (widgetValues[0] !== undefined) inputs.cfg_scale_start = widgetValues[0];
      if (widgetValues[1] !== undefined) inputs.cfg_scale_end = widgetValues[1];
      break;
    // Handle Power Lora Loader (rgthree) format
    case 'Power Lora Loader (rgthree)':
      // This node type stores LoRA configs in the widget values differently
      for (let i = 0; i < widgetValues.length; i++) {
        const value = widgetValues[i];
        if (typeof value === 'object' && value !== null) {
          inputs[`lora_${i + 1}`] = value;
        }
      }
      break;
    // Generic handling for other node types
    default:
      // Try to extract common fields
      if (widgetValues[0] && typeof widgetValues[0] === 'string') {
        // First widget value is often the main parameter
        if (classType.includes('Text')) {
          inputs.text = widgetValues[0];
        } else if (classType.includes('Lora') || classType.includes('LoRA')) {
          inputs.lora = widgetValues[0];
          if (widgetValues[1] !== undefined) inputs.strength = widgetValues[1];
        } else if (classType.includes('Model') || classType.includes('Checkpoint')) {
          inputs.model_name = widgetValues[0];
        }
      }
      break;
  }

  // Handle node connections (from inputs array)
  if (node.inputs && Array.isArray(node.inputs)) {
    node.inputs.forEach((input: any, index: number) => {
      if (input && input.link !== null && input.name) {
        // This is a connected input, store the connection info
        inputs[input.name] = { link: input.link };
      }
    });
  }

  return inputs;
}
