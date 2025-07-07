/**
 * Output formatting utilities for extracted workflow data
 *
 * This module provides functions to format extracted ComfyUI workflow data
 * into various output formats including JSON, human-readable, and raw formats.
 *
 * @fileoverview Output formatting and data presentation utilities
 */

import { extractWorkflowInfo } from './validation';
import { ExtractedData, OutputFormat, ExtractedWorkflowData } from '../types';

/**
 * Formats extraction results into the specified output format
 *
 * @param results - Array of extracted data from files
 * @param format - Output format ('json', 'pretty', or 'raw')
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
  results: ExtractedData[],
  format: OutputFormat
): string {
  switch (format) {
    case 'json':
      return JSON.stringify(results, null, 2);

    case 'pretty':
      return formatPretty(results);

    case 'raw':
      return formatRaw(results);

    default:
      return JSON.stringify(results, null, 2);
  }
}

/**
 * Formats results in a human-readable format
 *
 * Creates a detailed, structured output that's easy to read, including
 * workflow statistics, LoRA models, prompts, and generation settings.
 *
 * @param results - Array of extracted data to format
 * @returns Human-readable formatted string
 */
function formatPretty(results: ExtractedData[]): string {
  let output = '';

  for (const result of results) {
    output += `\n=== ${result.file} ===\n`;

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
        const hasConfidentDistinction = hasPositive && hasNegative && 
          workflowData.prompts.length <= 2 &&
          workflowData.prompts.some(p => p.positive && p.negative && 
            p.positive !== p.negative); // Ensure they're actually different
        
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
      if (result.parameters.seed)
        output += `  Seed: ${result.parameters.seed}\n`;
      if (result.parameters.model)
        output += `  Model: ${result.parameters.model}\n`;
    } else if (result.metadata) {
      output += `Metadata found:\n`;
      output += `  ${result.metadata.substring(0, 200)}${result.metadata.length > 200 ? '...' : ''}\n`;
    } else {
      output += `No workflow found\n`;
    }

    output += '\n';
  }

  return output;
}

function extractComfyUIWorkflowData(workflow: any): ExtractedWorkflowData {
  const data: ExtractedWorkflowData = {
    loras: [],
    prompts: [],
    samplerSettings: null,
    models: [],
  };

  // Handle both direct workflow and nested prompt structure
  let workflowNodes = workflow;
  if (workflow.prompt && typeof workflow.prompt === 'string') {
    try {
      workflowNodes = JSON.parse(workflow.prompt);
    } catch (e) {
      // Fallback to original workflow
    }
  }

  if (!workflowNodes || typeof workflowNodes !== 'object') {
    return data;
  }

  // First, find sampler nodes to identify positive/negative connections
  const promptConnections = findPromptConnections(workflowNodes);

  // Extract data from nodes
  for (const [nodeId, node] of Object.entries(workflowNodes)) {
    if (!node || typeof node !== 'object') continue;

    const nodeData = node as any;
    const classType = nodeData.class_type;
    const inputs = nodeData.inputs || {};

    // Extract LoRA information
    if (classType === 'WanVideoLoraSelect' || classType?.includes('Lora') || classType === 'Power Lora Loader (rgthree)') {
      // Handle Power Lora Loader (rgthree) format
      if (classType === 'Power Lora Loader (rgthree)') {
        for (const [inputKey, inputValue] of Object.entries(inputs)) {
          if (inputKey.startsWith('lora_') && typeof inputValue === 'object' && inputValue !== null) {
            const loraConfig = inputValue as any;
            // Only include enabled LoRAs
            if (loraConfig.on === true && loraConfig.lora && loraConfig.strength !== undefined) {
              const loraName = loraConfig.lora.split('\\').pop()?.split('/').pop() || loraConfig.lora;
              data.loras.push({
                name: loraName,
                strength: loraConfig.strength,
              });
            }
          }
        }
      }
      
      // Handle individual LoRA nodes with lora and strength fields
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
      classType === 'easy showAnything'
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
 * Find positive and negative prompt connections by analyzing sampler nodes
 */
function findPromptConnections(workflowNodes: any): {
  positive: string[];
  negative: string[];
} {
  const connections: { positive: string[]; negative: string[] } = {
    positive: [],
    negative: [],
  };

  // Find all sampler nodes
  for (const [nodeId, node] of Object.entries(workflowNodes)) {
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
        const [connectedNodeId] = inputs.positive;
        connections.positive.push(connectedNodeId);
      }

      // Check for negative connection
      if (inputs.negative && Array.isArray(inputs.negative)) {
        const [connectedNodeId] = inputs.negative;
        connections.negative.push(connectedNodeId);
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

function formatRaw(results: ExtractedData[]): string {
  let output = '';

  for (const result of results) {
    if (result.workflow) {
      output += `${result.file}: ${JSON.stringify(result.workflow)}\n`;
    }
  }

  return output;
}
