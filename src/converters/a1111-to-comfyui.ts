/**
 * A1111からComfyUIワークフローへの変換機能
 * 
 * このモジュールは、Automatic1111形式のパラメータを
 * ComfyUIワークフロー形式に変換する機能を提供します。
 */

import { ComfyUIWorkflow, ComfyUIPrompt, LoRAInfo, UpscalerInfo, ConversionResult, ConversionOptions, A1111Parameters } from '../types';

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

    // ComfyUIワークフローを生成
    const workflow = generateComfyUIWorkflow({
      positivePrompt: cleanedPositivePrompt,
      negativePrompt: parameters.negative_prompt || '',
      steps: parameters.steps ? parseInt(parameters.steps) : 20,
      cfg: parameters.cfg ? parseFloat(parameters.cfg) : 7.0,
      sampler: parameters.sampler || 'DPM++ 2M Karras',
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
  seed: number;
  model: string;
  size: string;
  loras: LoRAInfo[];
  upscaler?: UpscalerInfo;
  startNodeId: number;
}

function generateComfyUIWorkflow(params: WorkflowGenerationParams): ComfyUIWorkflow {
  let nodeId = params.startNodeId;
  const prompt: ComfyUIPrompt = {};

  // サイズをパース
  const [width, height] = params.size.split('x').map(s => parseInt(s.trim()));

  // 1. CheckpointLoaderSimple
  const checkpointNodeId = nodeId++;
  prompt[checkpointNodeId.toString()] = {
    class_type: 'CheckpointLoaderSimple',
    inputs: {
      ckpt_name: params.model
    }
  };

  // 2. LoRAローダーチェーンを作成
  let modelConnectionNode = checkpointNodeId;
  let clipConnectionNode = checkpointNodeId;

  for (const lora of params.loras) {
    const loraNodeId = nodeId++;
    prompt[loraNodeId.toString()] = {
      class_type: 'LoraLoader',
      inputs: {
        model: [modelConnectionNode.toString(), 0],
        clip: [clipConnectionNode.toString(), 1],
        lora_name: lora.name,
        strength_model: lora.strength,
        strength_clip: lora.strength
      }
    };
    modelConnectionNode = loraNodeId;
    clipConnectionNode = loraNodeId;
  }

  // 3. CLIPTextEncode (Positive)
  const positivePromptNodeId = nodeId++;
  prompt[positivePromptNodeId.toString()] = {
    class_type: 'CLIPTextEncode',
    inputs: {
      text: params.positivePrompt,
      clip: [clipConnectionNode.toString(), 1]
    }
  };

  // 4. CLIPTextEncode (Negative)
  const negativePromptNodeId = nodeId++;
  prompt[negativePromptNodeId.toString()] = {
    class_type: 'CLIPTextEncode',
    inputs: {
      text: params.negativePrompt,
      clip: [clipConnectionNode.toString(), 1]
    }
  };

  // 5. EmptyLatentImage
  const latentNodeId = nodeId++;
  prompt[latentNodeId.toString()] = {
    class_type: 'EmptyLatentImage',
    inputs: {
      width: width || 512,
      height: height || 512,
      batch_size: 1
    }
  };

  // 6. KSampler
  const samplerNodeId = nodeId++;
  prompt[samplerNodeId.toString()] = {
    class_type: 'KSampler',
    inputs: {
      model: [modelConnectionNode.toString(), 0],
      positive: [positivePromptNodeId.toString(), 0],
      negative: [negativePromptNodeId.toString(), 0],
      latent_image: [latentNodeId.toString(), 0],
      seed: params.seed,
      steps: params.steps,
      cfg: params.cfg,
      sampler_name: params.sampler,
      scheduler: 'normal',
      denoise: 1.0
    }
  };

  let finalLatentNode = samplerNodeId;

  // 7. アップスケーラーがある場合の処理
  if (params.upscaler) {
    // UpscaleModelLoader
    const upscaleLoaderNodeId = nodeId++;
    prompt[upscaleLoaderNodeId.toString()] = {
      class_type: 'UpscaleModelLoader',
      inputs: {
        model_name: params.upscaler.model
      }
    };

    // VAEDecode (first)
    const vaeDecodeNodeId = nodeId++;
    prompt[vaeDecodeNodeId.toString()] = {
      class_type: 'VAEDecode',
      inputs: {
        samples: [samplerNodeId.toString(), 0],
        vae: [checkpointNodeId.toString(), 2]
      }
    };

    // ImageUpscaleWithModel
    const imageUpscaleNodeId = nodeId++;
    prompt[imageUpscaleNodeId.toString()] = {
      class_type: 'ImageUpscaleWithModel',
      inputs: {
        upscale_model: [upscaleLoaderNodeId.toString(), 0],
        image: [vaeDecodeNodeId.toString(), 0]
      }
    };

    // VAEEncode
    const vaeEncodeNodeId = nodeId++;
    prompt[vaeEncodeNodeId.toString()] = {
      class_type: 'VAEEncode',
      inputs: {
        pixels: [imageUpscaleNodeId.toString(), 0],
        vae: [checkpointNodeId.toString(), 2]
      }
    };

    // Second KSampler for hires pass
    const hiresSamplerNodeId = nodeId++;
    prompt[hiresSamplerNodeId.toString()] = {
      class_type: 'KSampler',
      inputs: {
        model: [modelConnectionNode.toString(), 0],
        positive: [positivePromptNodeId.toString(), 0],
        negative: [negativePromptNodeId.toString(), 0],
        latent_image: [vaeEncodeNodeId.toString(), 0],
        seed: params.seed,
        steps: params.upscaler.steps || 10,
        cfg: params.cfg,
        sampler_name: params.sampler,
        scheduler: 'normal',
        denoise: params.upscaler.denoising || 0.5
      }
    };

    finalLatentNode = hiresSamplerNodeId;
  }

  // 8. VAEDecode (final)
  const finalVaeDecodeNodeId = nodeId++;
  prompt[finalVaeDecodeNodeId.toString()] = {
    class_type: 'VAEDecode',
    inputs: {
      samples: [finalLatentNode.toString(), 0],
      vae: [checkpointNodeId.toString(), 2]
    }
  };

  // 9. SaveImage
  const saveImageNodeId = nodeId++;
  prompt[saveImageNodeId.toString()] = {
    class_type: 'SaveImage',
    inputs: {
      images: [finalVaeDecodeNodeId.toString(), 0],
      filename_prefix: 'ComfyUI'
    }
  };

  return {
    prompt,
    extra_pnginfo: {
      workflow: prompt
    }
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