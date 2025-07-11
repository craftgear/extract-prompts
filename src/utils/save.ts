import { promises as fs } from 'fs';
import * as path from 'path';
import { formatOutput } from './output';
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
  customNameFn?: (data: ExtractedData) => string;
  /** Organize by date or format */
  organize?: 'none' | 'format' | 'date';
}

/**
 * 抽出されたデータをディレクトリに保存
 */
export async function saveExtractedData(
  file: string,
  data: ExtractedData,
  directory: string,
  options: SaveOptions = {}
): Promise<void> {
  const {
    format = 'json',
    overwrite = false,
    namePattern = 'source',
    organize = 'none',
  } = options;

  // ディレクトリが存在しない場合は作成
  await ensureDirectory(directory);

  const fileName = generateFileName(
    file,
    data,
    namePattern,
    format,
    options.customNameFn
  );
  const targetDirectory = getTargetDirectory(directory, organize, format);

  // 必要に応じてサブディレクトリを作成
  if (targetDirectory !== directory) {
    await ensureDirectory(targetDirectory);
  }

  const filePath = path.join(targetDirectory, fileName);

  // 既存ファイルのチェック
  if (!overwrite && (await fileExists(filePath))) {
    throw new Error(
      `File already exists: ${filePath}. Use overwrite option to replace.`
    );
  }

  // データの形式に応じてコンテンツを生成
  let content: string;

  if (format === 'json') {
    content = JSON.stringify(data, null, 2);
  } else if (format === 'pretty') {
    content = formatOutput(file, data, 'pretty');
  } else {
    content = JSON.stringify(data, null, 2);
  }

  // ファイルに書き込み
  await fs.writeFile(filePath, content, 'utf8');
}

/**
 * ディレクトリが存在することを確認し、存在しない場合は作成
 */
async function ensureDirectory(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch (error) {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

/**
 * ファイルが存在するかチェック
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * ファイル名を生成
 */
function generateFileName(
  file: string,
  data: ExtractedData,
  pattern: string,
  format: string,
  customNameFn?: (data: ExtractedData) => string
): string {
  const extension = getFileExtension(format);

  if (pattern === 'custom' && customNameFn) {
    const customName = customNameFn(data);
    return ensureExtension(customName, extension);
  }

  let baseName: string;

  switch (pattern) {
    case 'source':
      baseName = path.basename(file, path.extname(file));
      break;
    case 'timestamp':
      baseName = `workflow_${Date.now()}`;
      break;
    default:
      baseName = path.basename(file, path.extname(file));
  }

  return `${baseName}${extension}`;
}

/**
 * 保存先ディレクトリを決定
 */
function getTargetDirectory(
  baseDir: string,
  organize: string,
  format: string
): string {
  switch (organize) {
    case 'format':
      return path.join(baseDir, format);
    case 'date':
      const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      return path.join(baseDir, dateStr);
    default:
      return baseDir;
  }
}

/**
 * 形式に応じたファイル拡張子を取得
 */
function getFileExtension(format: string): string {
  switch (format) {
    case 'json':
      return '.json';
    case 'pretty':
      return '.txt';
    default:
      return '.json';
  }
}

/**
 * ファイル名に適切な拡張子があることを確認
 */
function ensureExtension(fileName: string, extension: string): string {
  if (fileName.endsWith(extension)) {
    return fileName;
  }
  return fileName + extension;
}

/**
 * 重複するファイル名を処理
 */
export function handleDuplicateNames(files: string[]): string[] {
  const nameCount = new Map<string, number>();

  return files.map((file) => {
    const base = path.basename(file, path.extname(file));
    const ext = path.extname(file);

    if (nameCount.has(base)) {
      const count = nameCount.get(base)! + 1;
      nameCount.set(base, count);
      return `${base}_${count}${ext}`;
    } else {
      nameCount.set(base, 1);
      return file;
    }
  });
}

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
export function calculateSaveStats(results: any[]): SaveStats {
  return {
    totalFiles: results.length,
    savedFiles: results.filter((r) => r.success).length,
    skippedFiles: results.filter((r) => r.skipped).length,
    errors: results.filter((r) => r.error).length,
    totalSize: results.reduce((sum, r) => sum + (r.size || 0), 0),
  };
}

