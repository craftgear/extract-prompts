import sharp from 'sharp';
import { validateComfyUIWorkflow } from '../../utils/validation';
import { RawExtractionResult } from '../../types';
import { extractUTF16TextFromWebP, isA1111Parameters } from '../../utils/encoding';
import { parseA1111Parameters } from '../../utils/parameters';

/**
 * WebPファイルからメタデータを抽出
 * @param filePath WebPファイルパス
 * @returns 抽出されたデータ、または null
 */
export async function extractFromWebP(filePath: string): Promise<RawExtractionResult | null> {
  const result: RawExtractionResult = {};
  
  try {
    // Sharpを使用してWebPのEXIFデータを抽出
    const metadata = await sharp(filePath).metadata();
    
    if (metadata.exif) {
      const extractedData = await processWebPExifData(metadata.exif);
      Object.assign(result, extractedData);
    }
  } catch (error) {
    // エラーが発生した場合は空の結果を返す
  }
  
  return Object.keys(result).length > 0 ? result : null;
}

/**
 * WebPのEXIFデータを処理
 * @param exifBuffer EXIFバッファ
 * @returns 抽出されたデータ
 */
async function processWebPExifData(exifBuffer: Buffer): Promise<RawExtractionResult> {
  const result: RawExtractionResult = {};
  const exifString = exifBuffer.toString();
  
  // User Commentフィールドを探す（UNICODEプレフィックスの後にテキストがある）
  const unicodeIndex = exifString.indexOf('UNICODE');
  if (unicodeIndex !== -1) {
    const cleanText = extractUTF16TextFromWebP(exifString, unicodeIndex);
    
    if (cleanText) {
      const processedData = await processWebPText(cleanText);
      Object.assign(result, processedData);
    }
  }
  
  return result;
}

/**
 * WebPから抽出されたテキストを処理
 * @param text 抽出されたテキスト
 * @returns 処理されたデータ
 */
async function processWebPText(text: string): Promise<RawExtractionResult> {
  const result: RawExtractionResult = {};
  
  // A1111スタイルのパラメータをチェック
  if (isA1111Parameters(text)) {
    result.parameters = parseA1111Parameters(text);
    result.raw_parameters = text;
  } else if (text.includes('workflow') || text.includes('prompt')) {
    // ComfyUIワークフローまたはプロンプトデータを解析
    try {
      const parsed = JSON.parse(text);
      if (validateComfyUIWorkflow(parsed)) {
        result.workflow = parsed;
      } else {
        result.metadata = text;
      }
    } catch (e) {
      result.metadata = text;
    }
  } else {
    // その他のコメントデータとして保存
    result.user_comment = text;
  }
  
  return result;
}

/**
 * WebPファイルの高度な処理（将来の拡張用）
 * @param filePath ファイルパス
 * @returns 抽出されたデータ
 */
export async function extractFromWebPAdvanced(filePath: string): Promise<RawExtractionResult | null> {
  // 現在は標準のextractFromWebPと同じ実装
  // 将来的により高度な処理を実装可能
  return extractFromWebP(filePath);
}

/**
 * WebPファイルのメタデータ詳細を取得
 * @param filePath ファイルパス
 * @returns メタデータ情報
 */
export async function getWebPMetadataInfo(filePath: string): Promise<{
  hasExif: boolean;
  exifSize?: number;
  format: string;
  width?: number;
  height?: number;
}> {
  const metadata = await sharp(filePath).metadata();
  
  return {
    hasExif: !!metadata.exif,
    exifSize: metadata.exif?.length,
    format: metadata.format || 'webp',
    width: metadata.width,
    height: metadata.height
  };
}