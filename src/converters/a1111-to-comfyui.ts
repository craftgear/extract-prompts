/**
 * A1111からComfyUIワークフローへの変換機能
 * 
 * このモジュールは、Automatic1111形式のパラメータを
 * ComfyUIワークフロー形式に変換する機能を提供します。
 */

import { ComfyUIUIWorkflow, ComfyUIPrompt, LoRAInfo, UpscalerInfo, ConversionResult, ConversionOptions, A1111Parameters } from '../types';

/**
 * ComfyUI sampler and scheduler combination
 */
interface ComfyUISamplerConfig {
  sampler: string;
  scheduler: string;
}

/**
 * A1111サンプラー名をComfyUIフォーマットに変換
 * @param a1111Sampler A1111のサンプラー名
 * @returns ComfyUIのサンプラーとスケジューラー設定
 */
export function convertSamplerName(a1111Sampler: string): ComfyUISamplerConfig {
  const sampler = a1111Sampler.toLowerCase();
  
  // DPM++ series
  if (sampler.includes('dpm++ 2m karras')) return { sampler: 'dpmpp_2m', scheduler: 'karras' };
  if (sampler.includes('dpm++ 2m')) return { sampler: 'dpmpp_2m', scheduler: 'normal' };
  if (sampler.includes('dpm++ sde karras')) return { sampler: 'dpmpp_sde', scheduler: 'karras' };
  if (sampler.includes('dpm++ sde')) return { sampler: 'dpmpp_sde', scheduler: 'normal' };
  if (sampler.includes('dpm++ 2s karras')) return { sampler: 'dpmpp_2s_ancestral', scheduler: 'karras' };
  if (sampler.includes('dpm++ 2s')) return { sampler: 'dpmpp_2s_ancestral', scheduler: 'normal' };
  if (sampler.includes('dpm++ 3m karras')) return { sampler: 'dpmpp_3m_sde', scheduler: 'karras' };
  if (sampler.includes('dpm++ 3m')) return { sampler: 'dpmpp_3m_sde', scheduler: 'normal' };
  
  // DPM2 series - order matters: check specific variants first
  if (sampler.includes('dpm2 a karras')) return { sampler: 'dpm_2_ancestral', scheduler: 'karras' };
  if (sampler.includes('dpm2 a')) return { sampler: 'dpm_2_ancestral', scheduler: 'normal' };
  if (sampler.includes('dpm2 karras')) return { sampler: 'dpm_2', scheduler: 'karras' };
  if (sampler.includes('dpm2')) return { sampler: 'dpm_2', scheduler: 'normal' };
  
  // DPM fast/adaptive
  if (sampler.includes('dpm fast')) return { sampler: 'dpm_fast', scheduler: 'normal' };
  if (sampler.includes('dpm adaptive')) return { sampler: 'dpm_adaptive', scheduler: 'normal' };
  
  // Euler series
  if (sampler.includes('euler a')) return { sampler: 'euler_ancestral', scheduler: 'normal' };
  if (sampler.includes('euler')) return { sampler: 'euler', scheduler: 'normal' };
  
  // Heun
  if (sampler.includes('heun')) return { sampler: 'heun', scheduler: 'normal' };
  
  // LMS series
  if (sampler.includes('lms karras')) return { sampler: 'lms', scheduler: 'karras' };
  if (sampler.includes('lms')) return { sampler: 'lms', scheduler: 'normal' };
  
  // UniPC
  if (sampler.includes('unipc')) return { sampler: 'uni_pc', scheduler: 'normal' };
  
  // DDIM
  if (sampler.includes('ddim')) return { sampler: 'ddim', scheduler: 'normal' };
  
  // PLMS
  if (sampler.includes('plms')) return { sampler: 'plms', scheduler: 'normal' };
  
  // Default fallback
  return { sampler: 'euler', scheduler: 'normal' };
}

/**
 * A1111パラメータからComfyUIワークフローに変換
 * @param parameters A1111パラメータ
 * @param options 変換オプション
 * @returns 変換結果
 */
export function convertA1111ToComfyUI(
  parameters: A1111Parameters, 
  options: ConversionOptions = {}
): ConversionResult {
  try {
    const {
      removeLoRATags = true,
      defaultModel = 'sd_xl_base_1.0.safetensors',
      defaultSize = '512x512',
      startNodeId = 1
    } = options;

    // LoRAタグを抽出
    const loras = extractLoRATags(parameters.positive_prompt || '');
    
    // アップスケーラー情報を抽出
    const upscaler = extractUpscalerInfo(parameters);

    // プロンプトからLoRAタグを除去
    const cleanedPositivePrompt = removeLoRATags ? 
      removeLoRATagsFromPrompt(parameters.positive_prompt || '') : 
      (parameters.positive_prompt || '');

    // サンプラー設定を変換
    const samplerConfig = convertSamplerName(parameters.sampler || 'DPM++ 2M Karras');

    // ComfyUIワークフローを生成
    const workflow = generateComfyUIWorkflow({
      positivePrompt: cleanedPositivePrompt,
      negativePrompt: parameters.negative_prompt || '',
      steps: parameters.steps ? parseInt(parameters.steps) : 20,
      cfg: parameters.cfg ? parseFloat(parameters.cfg) : 7.0,
      sampler: samplerConfig.sampler,
      scheduler: samplerConfig.scheduler,
      seed: parameters.seed ? parseInt(parameters.seed) : 42,
      model: parameters.model || defaultModel,
      size: parameters.size || defaultSize,
      loras,
      upscaler,
      startNodeId
    });

    return {
      success: true,
      workflow,
      loras,
      upscaler,
      originalParameters: parameters
    };
  } catch (error) {
    return {
      success: false,
      error: `変換エラー: ${(error as Error).message}`,
      originalParameters: parameters
    };
  }
}

/**
 * プロンプトからLoRAタグを抽出
 * @param prompt プロンプト文字列
 * @returns LoRA情報の配列
 */
export function extractLoRATags(prompt: string): LoRAInfo[] {
  const loraRegex = /<lora:([^:>]+):([0-9.]+)>/g;
  const loras: LoRAInfo[] = [];
  let match;

  while ((match = loraRegex.exec(prompt)) !== null) {
    const [, name, strengthStr] = match;
    const strength = parseFloat(strengthStr);
    
    if (!isNaN(strength)) {
      loras.push({
        name: name.trim(),
        strength,
        path: `${name.trim()}.safetensors`
      });
    }
  }

  return loras;
}

/**
 * プロンプトからLoRAタグを除去
 * @param prompt プロンプト文字列
 * @returns LoRAタグが除去されたプロンプト
 */
export function removeLoRATagsFromPrompt(prompt: string): string {
  return prompt.replace(/<lora:[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

/**
 * A1111パラメータからアップスケーラー情報を抽出
 * @param parameters A1111パラメータ
 * @returns アップスケーラー情報
 */
export function extractUpscalerInfo(parameters: A1111Parameters): UpscalerInfo | undefined {
  // hires_fixがtrueまたはhires_upscalerが設定されている場合
  const hiresFixEnabled = parameters.hires_fix === 'true' || parameters.hires_fix === 'True';
  if (hiresFixEnabled || parameters.hires_upscaler) {
    return {
      model: parameters.hires_upscaler || 'ESRGAN_4x',
      steps: parameters.hires_steps ? parseInt(parameters.hires_steps as string) : 10,
      denoising: parameters.hires_denoising ? parseFloat(parameters.hires_denoising as string) : 0.5,
      scale: 2.0
    };
  }
  return undefined;
}

/**
 * ComfyUIワークフローを生成する内部関数
 */
interface WorkflowGenerationParams {
  positivePrompt: string;
  negativePrompt: string;
  steps: number;
  cfg: number;
  sampler: string;
  scheduler: string;
  seed: number;
  model: string;
  size: string;
  loras: LoRAInfo[];
  upscaler?: UpscalerInfo;
  startNodeId: number;
}

function generateComfyUIWorkflow(params: WorkflowGenerationParams): ComfyUIUIWorkflow {
  let nodeId = params.startNodeId;
  let linkId = 1;
  const nodes: any[] = [];
  const links: any[] = [];

  // サイズをパース
  const [width, height] = params.size.split('x').map(s => parseInt(s.trim()));

  // レイアウト設定
  const nodeSpacing = { x: 250, y: 100 };
  let currentPos = { x: 50, y: 50 };

  // Helper function to create a node with proper inputs/outputs
  function createNode(
    type: string, 
    widgets_values: any[] = [], 
    inputs: any[] = [], 
    outputs: any[] = [],
    properties: any = {}, 
    size: [number, number] = [315, 58]
  ) {
    const node = {
      id: nodeId,
      type,
      pos: [currentPos.x, currentPos.y],
      size,
      flags: {},
      order: nodeId - params.startNodeId,
      mode: 0,
      inputs,
      outputs,
      properties: {
        cnr_id: "comfy-core",
        ver: "0.3.43",
        "Node name for S&R": type,
        ...properties
      },
      widgets_values
    };
    nodes.push(node);
    currentPos.y += nodeSpacing.y;
    return nodeId++;
  }

  // Helper function to create a link and update node connections
  function createLink(outputNodeId: number, outputSlot: number, inputNodeId: number, inputSlot: number, type: string) {
    const currentLinkId = linkId++;
    const link = [currentLinkId, outputNodeId, outputSlot, inputNodeId, inputSlot, type];
    links.push(link);

    // Find and update the output node
    const outputNode = nodes.find(n => n.id === outputNodeId);
    if (outputNode && outputNode.outputs[outputSlot]) {
      if (!outputNode.outputs[outputSlot].links) {
        outputNode.outputs[outputSlot].links = [];
      }
      outputNode.outputs[outputSlot].links.push(currentLinkId);
    }

    // Find and update the input node
    const inputNode = nodes.find(n => n.id === inputNodeId);
    if (inputNode && inputNode.inputs[inputSlot]) {
      inputNode.inputs[inputSlot].link = currentLinkId;
    }

    return link;
  }

  // 1. CheckpointLoaderSimple
  currentPos.x = 50;
  const checkpointNodeId = createNode(
    'CheckpointLoaderSimple', 
    [params.model], 
    [], // no inputs
    [
      { name: "MODEL", type: "MODEL", slot_index: 0 },
      { name: "CLIP", type: "CLIP", slot_index: 1 },
      { name: "VAE", type: "VAE", slot_index: 2 }
    ],
    {},
    [350, 98]
  );

  // 2. LoRAローダーチェーンを作成
  let modelConnectionNode = checkpointNodeId;
  let clipConnectionNode = checkpointNodeId;

  currentPos.x = 350;
  currentPos.y = 50;

  for (const lora of params.loras) {
    const loraNodeId = createNode(
      'LoraLoader', 
      [lora.path, lora.strength, lora.strength], 
      [
        { name: "model", type: "MODEL", link: null },
        { name: "clip", type: "CLIP", link: null }
      ],
      [
        { name: "MODEL", type: "MODEL", slot_index: 0 },
        { name: "CLIP", type: "CLIP", slot_index: 1 }
      ],
      {},
      [315, 126]
    );
    
    // Create links for LoRA
    createLink(modelConnectionNode, 0, loraNodeId, 0, 'MODEL');
    createLink(clipConnectionNode, 1, loraNodeId, 1, 'CLIP');
    
    modelConnectionNode = loraNodeId;
    clipConnectionNode = loraNodeId;
  }

  // 3. CLIPTextEncode (Positive)
  currentPos.x = 650;
  currentPos.y = 50;
  const positivePromptNodeId = createNode(
    'CLIPTextEncode', 
    [params.positivePrompt], 
    [
      { name: "clip", type: "CLIP", link: null }
    ],
    [
      { name: "CONDITIONING", type: "CONDITIONING", slot_index: 0 }
    ],
    {},
    [422, 164]
  );
  createLink(clipConnectionNode, 1, positivePromptNodeId, 0, 'CLIP');

  // 4. CLIPTextEncode (Negative)
  currentPos.y += 50;
  const negativePromptNodeId = createNode(
    'CLIPTextEncode', 
    [params.negativePrompt], 
    [
      { name: "clip", type: "CLIP", link: null }
    ],
    [
      { name: "CONDITIONING", type: "CONDITIONING", slot_index: 0 }
    ],
    {},
    [422, 164]
  );
  createLink(clipConnectionNode, 1, negativePromptNodeId, 0, 'CLIP');

  // 5. EmptyLatentImage
  currentPos.x = 50;
  currentPos.y = 300;
  const emptyLatentImageNodeId = createNode(
    'EmptyLatentImage', 
    [width, height, 1], 
    [], // no inputs
    [
      { name: "LATENT", type: "LATENT", slot_index: 0 }
    ],
    {},
    [315, 106]
  );

  // 6. KSampler
  currentPos.x = 950;
  currentPos.y = 50;
  const ksamplerNodeId = createNode(
    'KSampler', 
    [params.seed, 'randomize', params.steps, params.cfg, params.sampler, params.scheduler, 1.0], 
    [
      { name: "model", type: "MODEL", link: null },
      { name: "positive", type: "CONDITIONING", link: null },
      { name: "negative", type: "CONDITIONING", link: null },
      { name: "latent_image", type: "LATENT", link: null }
    ],
    [
      { name: "LATENT", type: "LATENT", slot_index: 0 }
    ],
    {},
    [315, 262]
  );
  
  // Create links for KSampler
  createLink(modelConnectionNode, 0, ksamplerNodeId, 0, 'MODEL');
  createLink(positivePromptNodeId, 0, ksamplerNodeId, 1, 'CONDITIONING');
  createLink(negativePromptNodeId, 0, ksamplerNodeId, 2, 'CONDITIONING');
  createLink(emptyLatentImageNodeId, 0, ksamplerNodeId, 3, 'LATENT');

  let finalLatentOutput = ksamplerNodeId;

  // アップスケーラー処理を追加
  if (params.upscaler) {
    currentPos.x = 50;
    currentPos.y = 450;
    
    // UpscaleModelLoader
    const upscaleModelLoaderNodeId = createNode(
      'UpscaleModelLoader', 
      [params.upscaler.model], 
      [], // no inputs
      [
        { name: "UPSCALE_MODEL", type: "UPSCALE_MODEL", slot_index: 0 }
      ],
      {},
      [315, 58]
    );

    // VAEDecode (for upscaling)
    currentPos.x = 350;
    const vaeDecodeUpscaleNodeId = createNode(
      'VAEDecode', 
      [], 
      [
        { name: "samples", type: "LATENT", link: null },
        { name: "vae", type: "VAE", link: null }
      ],
      [
        { name: "IMAGE", type: "IMAGE", slot_index: 0 }
      ],
      {},
      [210, 46]
    );
    createLink(finalLatentOutput, 0, vaeDecodeUpscaleNodeId, 0, 'LATENT');
    createLink(checkpointNodeId, 2, vaeDecodeUpscaleNodeId, 1, 'VAE');

    // ImageUpscaleWithModel
    const imageUpscaleNodeId = createNode(
      'ImageUpscaleWithModel', 
      [], 
      [
        { name: "upscale_model", type: "UPSCALE_MODEL", link: null },
        { name: "image", type: "IMAGE", link: null }
      ],
      [
        { name: "IMAGE", type: "IMAGE", slot_index: 0 }
      ],
      {},
      [315, 126]
    );
    createLink(upscaleModelLoaderNodeId, 0, imageUpscaleNodeId, 0, 'UPSCALE_MODEL');
    createLink(vaeDecodeUpscaleNodeId, 0, imageUpscaleNodeId, 1, 'IMAGE');

    // VAEEncode
    const vaeEncodeNodeId = createNode(
      'VAEEncode', 
      [], 
      [
        { name: "pixels", type: "IMAGE", link: null },
        { name: "vae", type: "VAE", link: null }
      ],
      [
        { name: "LATENT", type: "LATENT", slot_index: 0 }
      ],
      {},
      [210, 46]
    );
    createLink(imageUpscaleNodeId, 0, vaeEncodeNodeId, 0, 'IMAGE');
    createLink(checkpointNodeId, 2, vaeEncodeNodeId, 1, 'VAE');

    // Second KSampler for hires pass
    const hiresSamplerNodeId = createNode(
      'KSampler', 
      [params.seed, 'randomize', params.upscaler.steps || 10, params.cfg, params.sampler, params.scheduler, params.upscaler.denoising || 0.5], 
      [
        { name: "model", type: "MODEL", link: null },
        { name: "positive", type: "CONDITIONING", link: null },
        { name: "negative", type: "CONDITIONING", link: null },
        { name: "latent_image", type: "LATENT", link: null }
      ],
      [
        { name: "LATENT", type: "LATENT", slot_index: 0 }
      ],
      {},
      [315, 262]
    );
    createLink(modelConnectionNode, 0, hiresSamplerNodeId, 0, 'MODEL');
    createLink(positivePromptNodeId, 0, hiresSamplerNodeId, 1, 'CONDITIONING');
    createLink(negativePromptNodeId, 0, hiresSamplerNodeId, 2, 'CONDITIONING');
    createLink(vaeEncodeNodeId, 0, hiresSamplerNodeId, 3, 'LATENT');

    finalLatentOutput = hiresSamplerNodeId;
  }

  // Final VAEDecode
  currentPos.x = 1300;
  currentPos.y = 50;
  const finalVaeDecodeNodeId = createNode(
    'VAEDecode', 
    [], 
    [
      { name: "samples", type: "LATENT", link: null },
      { name: "vae", type: "VAE", link: null }
    ],
    [
      { name: "IMAGE", type: "IMAGE", slot_index: 0 }
    ],
    {},
    [210, 46]
  );
  createLink(finalLatentOutput, 0, finalVaeDecodeNodeId, 0, 'LATENT');
  createLink(checkpointNodeId, 2, finalVaeDecodeNodeId, 1, 'VAE');

  // SaveImage
  const saveImageNodeId = createNode(
    'SaveImage', 
    ['ComfyUI'], 
    [
      { name: "images", type: "IMAGE", link: null }
    ],
    [], // no outputs
    {},
    [315, 58]
  );
  createLink(finalVaeDecodeNodeId, 0, saveImageNodeId, 0, 'IMAGE');

  // Generate UUID for workflow ID
  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  return {
    id: generateUUID(),
    revision: 0,
    last_node_id: nodeId - 1,
    last_link_id: linkId - 1,
    nodes,
    links,
    groups: [],
    config: {},
    extra: {},
    version: 0.4
  };
}

/**
 * A1111パラメータにComfyUIワークフロー変換フラグを追加
 * @param parameters A1111パラメータ
 * @returns 変換フラグ付きA1111パラメータ
 */
export function shouldConvertToComfyUI(parameters: A1111Parameters): boolean {
  // A1111パラメータが存在し、基本的なフィールドがある場合に変換対象とする
  return !!(parameters.positive_prompt || parameters.steps || parameters.cfg);
}