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
export declare function parseA1111Parameters(text: string): A1111Parameters;
/**
 * テキストからポジティブプロンプトとネガティブプロンプトを分離する
 */
export declare function separatePrompts(text: string): PromptSeparationResult;
/**
 * テキストから生成設定を抽出する
 */
export declare function extractGenerationSettings(text: string): GenerationSettings;
/**
 * テキストがA1111形式かどうかを検証する
 */
export declare function validateA1111Format(text: string): boolean;
/**
 * プロンプト分離が正しく行われているかを検証する
 */
export declare function isValidPromptSeparation(text: string): boolean;
/**
 * A1111パラメータの妥当性を検証する
 */
export declare function validateA1111Parameters(params: A1111Parameters): boolean;
//# sourceMappingURL=a1111.d.ts.map