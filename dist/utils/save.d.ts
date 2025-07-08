import { ExtractedData } from '../types';
/**
 * Save options
 */
export interface SaveOptions {
    /** Output format (json, pretty) */
    format?: 'json' | 'pretty';
    /** Whether to overwrite existing files */
    overwrite?: boolean;
    /** File name pattern */
    namePattern?: 'source' | 'sequential' | 'timestamp' | 'custom';
    /** Custom name function for custom pattern */
    customNameFn?: (data: ExtractedData, index: number) => string;
    /** Organize by date or format */
    organize?: 'none' | 'format' | 'date';
}
/**
 * 抽出されたデータをディレクトリに保存
 */
export declare function saveExtractedData(data: ExtractedData[], directory: string, options?: SaveOptions): Promise<void>;
/**
 * 重複するファイル名を処理
 */
export declare function handleDuplicateNames(files: string[]): string[];
/**
 * 保存統計情報を取得
 */
export interface SaveStats {
    totalFiles: number;
    savedFiles: number;
    skippedFiles: number;
    errors: number;
    totalSize: number;
}
/**
 * 保存統計情報を計算
 */
export declare function calculateSaveStats(results: any[]): SaveStats;
//# sourceMappingURL=save.d.ts.map