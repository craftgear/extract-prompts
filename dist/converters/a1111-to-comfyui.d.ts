/**
 * A1111からComfyUIワークフローへの変換機能
 *
 * このモジュールは、Automatic1111形式のパラメータを
 * ComfyUIワークフロー形式に変換する機能を提供します。
 */
import { LoRAInfo, UpscalerInfo, ConversionResult, ConversionOptions, A1111Parameters } from '../types';
/**
 * A1111パラメータからComfyUIワークフローに変換
 * @param parameters A1111パラメータ
 * @param options 変換オプション
 * @returns 変換結果
 */
export declare function convertA1111ToComfyUI(parameters: A1111Parameters, options?: ConversionOptions): ConversionResult;
/**
 * プロンプトからLoRAタグを抽出
 * @param prompt プロンプト文字列
 * @returns LoRA情報の配列
 */
export declare function extractLoRATags(prompt: string): LoRAInfo[];
/**
 * プロンプトからLoRAタグを除去
 * @param prompt プロンプト文字列
 * @returns LoRAタグが除去されたプロンプト
 */
export declare function removeLoRATagsFromPrompt(prompt: string): string;
/**
 * A1111パラメータからアップスケーラー情報を抽出
 * @param parameters A1111パラメータ
 * @returns アップスケーラー情報
 */
export declare function extractUpscalerInfo(parameters: A1111Parameters): UpscalerInfo | undefined;
/**
 * A1111パラメータにComfyUIワークフロー変換フラグを追加
 * @param parameters A1111パラメータ
 * @returns 変換フラグ付きA1111パラメータ
 */
export declare function shouldConvertToComfyUI(parameters: A1111Parameters): boolean;
//# sourceMappingURL=a1111-to-comfyui.d.ts.map