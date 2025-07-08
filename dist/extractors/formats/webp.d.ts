import { RawExtractionResult } from '../../types';
/**
 * WebPファイルからメタデータを抽出
 * @param filePath WebPファイルパス
 * @returns 抽出されたデータ、または null
 */
export declare function extractFromWebP(filePath: string): Promise<RawExtractionResult | null>;
/**
 * WebPファイルの高度な処理（将来の拡張用）
 * @param filePath ファイルパス
 * @returns 抽出されたデータ
 */
export declare function extractFromWebPAdvanced(filePath: string): Promise<RawExtractionResult | null>;
/**
 * WebPファイルのメタデータ詳細を取得
 * @param filePath ファイルパス
 * @returns メタデータ情報
 */
export declare function getWebPMetadataInfo(filePath: string): Promise<{
    hasExif: boolean;
    exifSize?: number;
    format: string;
    width?: number;
    height?: number;
}>;
//# sourceMappingURL=webp.d.ts.map