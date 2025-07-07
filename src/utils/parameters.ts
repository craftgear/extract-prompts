import { A1111Parameters } from '../types';

/**
 * A1111スタイルのパラメータ文字列を解析
 * @param text A1111フォーマットのテキスト
 * @returns 解析されたパラメータ
 */
export function parseA1111Parameters(text: string): A1111Parameters {
  const params: A1111Parameters = {};
  
  // 共通のA1111パラメータを抽出
  const patterns = {
    steps: /Steps:\s*(\d+)/i,
    cfg: /CFG scale:\s*([\d.]+)/i,
    sampler: /Sampler:\s*([^,\n]+)/i,
    seed: /Seed:\s*(\d+)/i,
    model: /Model:\s*([^,\n]+)/i
  };
  
  for (const [key, pattern] of Object.entries(patterns)) {
    const match = text.match(pattern);
    if (match) {
      params[key as keyof A1111Parameters] = match[1].trim();
    }
  }
  
  // プロンプトを正確に分離
  const negativeIndex = text.indexOf('Negative prompt:');
  const stepsIndex = text.indexOf('Steps:');
  
  if (negativeIndex !== -1 && stepsIndex !== -1) {
    // ポジティブ、ネガティブ、パラメータセクションに分割
    params.positive_prompt = text.substring(0, negativeIndex).trim();
    params.negative_prompt = text.substring(negativeIndex + 16, stepsIndex).trim(); // "Negative prompt: "をスキップ
  } else if (stepsIndex !== -1) {
    // ネガティブプロンプトが見つからない場合、Steps:の前はすべてポジティブ
    params.positive_prompt = text.substring(0, stepsIndex).trim();
  } else {
    // Stepsが見つからない場合、ポジティブプロンプトのみとして扱う
    params.positive_prompt = text.trim();
  }
  
  return params;
}