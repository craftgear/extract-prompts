/**
 * Automatic1111 (A1111) パラメータ専用パーサー
 * 
 * このモジュールは、Automatic1111形式のパラメータを解析するための
 * 包括的なパーサーとバリデーション機能を提供します。
 */

export interface A1111Parameters {
  positive_prompt: string;
  negative_prompt?: string;
  steps?: number;
  cfg?: number;
  sampler?: string;
  seed?: number;
  model?: string;
  size?: string;
  scheduler?: string;
  denoise?: number;
  clip_skip?: number;
  ensd?: string;
  hires_fix?: boolean;
  hires_upscaler?: string;
  hires_steps?: number;
  hires_denoising?: number;
  restore_faces?: boolean;
  batch_size?: number;
  batch_count?: number;
  version?: string;
  raw_text?: string;
}

export interface GenerationSettings {
  steps?: number;
  cfg?: number;
  sampler?: string;
  seed?: number;
  model?: string;
  size?: string;
  scheduler?: string;
  denoise?: number;
  clip_skip?: number;
  ensd?: string;
  hires_fix?: boolean;
  hires_upscaler?: string;
  hires_steps?: number;
  hires_denoising?: number;
  restore_faces?: boolean;
  batch_size?: number;
  batch_count?: number;
  version?: string;
}

export interface PromptSeparationResult {
  positive: string;
  negative: string;
}

/**
 * A1111形式のパラメータテキストを解析する
 */
export function parseA1111Parameters(text: string): A1111Parameters {
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid input: text must be a non-empty string');
  }

  const cleanText = text.trim();
  if (!cleanText) {
    throw new Error('Invalid input: text cannot be empty');
  }

  try {
    const { positive, negative } = separatePrompts(cleanText);
    const generationSettings = extractGenerationSettings(cleanText);
    
    const result: A1111Parameters = {
      positive_prompt: positive,
      raw_text: cleanText,
      ...generationSettings,
    };

    if (negative) {
      result.negative_prompt = negative;
    }

    return result;
  } catch (error) {
    return {
      positive_prompt: cleanText,
      raw_text: cleanText,
    };
  }
}

/**
 * テキストからポジティブプロンプトとネガティブプロンプトを分離する
 */
export function separatePrompts(text: string): PromptSeparationResult {
  const normalizedText = text.trim();
  
  const negativeMarkers = ['Negative prompt:', 'Negative:', 'negative prompt:', 'negative:'];
  const parameterMarkers = ['Steps:', 'Sampler:', 'CFG scale:', 'Size:', 'Seed:', 'Model:'];

  let negativeIndex = -1;
  let negativeMarkerLength = 0;
  
  for (const marker of negativeMarkers) {
    const index = normalizedText.indexOf(marker);
    if (index !== -1) {
      negativeIndex = index;
      negativeMarkerLength = marker.length;
      break;
    }
  }

  let parametersIndex = -1;
  for (const marker of parameterMarkers) {
    const index = normalizedText.indexOf(marker);
    if (index !== -1 && (parametersIndex === -1 || index < parametersIndex)) {
      parametersIndex = index;
    }
  }

  let positive = '';
  let negative = '';

  if (negativeIndex !== -1 && parametersIndex !== -1) {
    positive = normalizedText.substring(0, negativeIndex).trim();
    negative = normalizedText.substring(negativeIndex + negativeMarkerLength, parametersIndex).trim();
  } else if (negativeIndex !== -1) {
    positive = normalizedText.substring(0, negativeIndex).trim();
    negative = normalizedText.substring(negativeIndex + negativeMarkerLength).trim();
  } else if (parametersIndex !== -1) {
    positive = normalizedText.substring(0, parametersIndex).trim();
  } else {
    positive = normalizedText;
  }

  return {
    positive: positive || '',
    negative: negative || '',
  };
}

/**
 * テキストから生成設定を抽出する
 */
export function extractGenerationSettings(text: string): GenerationSettings {
  const settings: GenerationSettings = {};

  const basicPatterns = {
    steps: /Steps:\s*(\d+)/i,
    cfg: /CFG scale:\s*([\d.]+)/i,
    sampler: /Sampler:\s*([^,\n]+)/i,
    seed: /Seed:\s*(\d+)/i,
    model: /Model:\s*([^,\n]+)/i,
    size: /Size:\s*(\d+x\d+)/i,
    denoise: /Denoising strength:\s*([\d.]+)/i,
    clip_skip: /Clip skip:\s*(\d+)/i,
    ensd: /ENSD:\s*([^,\n]+)/i,
  };

  for (const [key, pattern] of Object.entries(basicPatterns)) {
    const match = text.match(pattern);
    if (match) {
      const value = match[1].trim();
      
      if (['steps', 'seed', 'clip_skip'].includes(key)) {
        const numValue = parseInt(value, 10);
        if (!isNaN(numValue)) {
          (settings as any)[key] = numValue;
        }
      } else if (['cfg', 'denoise'].includes(key)) {
        const floatValue = parseFloat(value);
        if (!isNaN(floatValue)) {
          (settings as any)[key] = floatValue;
        }
      } else {
        (settings as any)[key] = value;
      }
    }
  }

  // Extended parameters
  if (/Hires upscale:\s*([\d.]+)/i.test(text)) {
    settings.hires_fix = true;
  }
  
  const hiresUpscalerMatch = text.match(/Hires upscaler:\s*([^,\n]+)/i);
  if (hiresUpscalerMatch) {
    settings.hires_upscaler = hiresUpscalerMatch[1].trim();
  }

  const hiresStepsMatch = text.match(/Hires steps:\s*(\d+)/i);
  if (hiresStepsMatch) {
    settings.hires_steps = parseInt(hiresStepsMatch[1], 10);
  }

  const hiresDenoisingMatch = text.match(/Hires denoising strength:\s*([\d.]+)/i);
  if (hiresDenoisingMatch) {
    settings.hires_denoising = parseFloat(hiresDenoisingMatch[1]);
  }

  if (text.includes('Restore faces')) {
    settings.restore_faces = true;
  }

  return settings;
}

/**
 * テキストがA1111形式かどうかを検証する
 */
export function validateA1111Format(text: string): boolean {
  if (!text || typeof text !== 'string') {
    return false;
  }

  const normalizedText = text.trim();
  if (!normalizedText) {
    return false;
  }

  const a1111Indicators = [
    /Steps:\s*\d+/i,
    /CFG scale:\s*[\d.]+/i,
    /Sampler:\s*[^,\n]+/i,
    /Seed:\s*\d+/i,
    /Model:\s*[^,\n]+/i,
    /Size:\s*\d+x\d+/i,
    /Negative prompt:/i,
  ];

  return a1111Indicators.some(pattern => pattern.test(normalizedText));
}

/**
 * プロンプト分離が正しく行われているかを検証する
 */
export function isValidPromptSeparation(text: string): boolean {
  if (!text || typeof text !== 'string') {
    return false;
  }

  try {
    const { positive, negative } = separatePrompts(text);
    
    if (!positive || positive.trim().length === 0) {
      return false;
    }

    if (negative && negative.trim().length > 0) {
      const hasNegativeMarker = /Negative prompt:/i.test(text);
      if (!hasNegativeMarker) {
        return false;
      }
    }

    const totalLength = positive.length + negative.length;
    if (totalLength > 10000) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * A1111パラメータの妥当性を検証する
 */
export function validateA1111Parameters(params: A1111Parameters): boolean {
  if (!params || typeof params !== 'object') {
    return false;
  }

  if (!params.positive_prompt || typeof params.positive_prompt !== 'string') {
    return false;
  }

  const numericValidations = [
    { key: 'steps', min: 1, max: 1000 },
    { key: 'cfg', min: 0, max: 30 },
    { key: 'seed', min: 0, max: Number.MAX_SAFE_INTEGER },
    { key: 'denoise', min: 0, max: 1 },
    { key: 'clip_skip', min: 1, max: 12 },
  ];

  for (const { key, min, max } of numericValidations) {
    const value = (params as any)[key];
    if (value !== undefined) {
      if (typeof value !== 'number' || isNaN(value) || value < min || value > max) {
        return false;
      }
    }
  }

  return true;
}