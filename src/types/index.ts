/**
 * TypeScript type definitions for the prompt extraction project
 * Supports ComfyUI, A1111, and other metadata extraction workflows
 * 
 * @fileoverview Complete type definitions for extracted workflow data
 */

/**
 * Basic structure for extracted data results from file processing
 * 
 * Contains all possible types of data that can be extracted from images and videos,
 * including ComfyUI workflows, A1111 parameters, and general metadata.
 */
export interface ExtractedData {
  /** ComfyUI workflow data */
  workflow?: ComfyUIWorkflow;
  /** A1111-style generation parameters */
  parameters?: A1111Parameters;
  /** Raw parameter text as found in metadata */
  raw_parameters?: string;
  /** Other metadata content */
  metadata?: string;
  /** User comment text */
  user_comment?: string;
  /** Source file path */
  file: string;
}

/**
 * Raw extraction result from individual format processors
 * 
 * Contains extracted data without file path information,
 * as the file path is added later by the main processing loop.
 */
export interface RawExtractionResult {
  /** ComfyUI workflow data */
  workflow?: ComfyUIWorkflow;
  /** A1111-style generation parameters */
  parameters?: A1111Parameters;
  /** Raw parameter text as found in metadata */
  raw_parameters?: string;
  /** Other metadata content */
  metadata?: string;
  /** User comment text */
  user_comment?: string;
}

/**
 * ComfyUI workflow structure
 * 
 * Represents the complete workflow data structure used by ComfyUI,
 * including prompt information and node definitions.
 */
export interface ComfyUIWorkflow {
  /** Workflow prompt information */
  prompt?: string | ComfyUIPrompt;
  /** Additional PNG metadata information */
  extra_pnginfo?: Record<string, any>;
  /** Workflow nodes (with numeric keys) */
  [key: string]: any;
}

/**
 * Detailed ComfyUI prompt structure
 * 
 * Maps node IDs to their corresponding ComfyUI node definitions.
 */
export interface ComfyUIPrompt {
  /** Workflow nodes mapped by node ID */
  [nodeId: string]: ComfyUINode;
}

/**
 * ComfyUI node structure
 * 
 * Represents a single node in a ComfyUI workflow with its type,
 * inputs, outputs, and metadata.
 */
export interface ComfyUINode {
  /** Node class name/type */
  class_type: string;
  /** Node input parameters */
  inputs?: Record<string, any>;
  /** Node outputs */
  outputs?: any[];
  /** Node metadata */
  _meta?: {
    title?: string;
    [key: string]: any;
  };
}

/**
 * Automatic1111 (A1111) style parameters structure
 * 
 * Represents generation parameters commonly used by Stable Diffusion WebUI
 * and other A1111-compatible tools.
 */
export interface A1111Parameters {
  /** Positive prompt text */
  positive_prompt?: string;
  /** Negative prompt text */
  negative_prompt?: string;
  /** Number of generation steps */
  steps?: string;
  /** CFG scale value */
  cfg?: string;
  /** Sampler method */
  sampler?: string;
  /** Random seed value */
  seed?: string;
  /** Model name */
  model?: string;
  /** Additional parameters */
  [key: string]: string | undefined;
}

/**
 * 抽出結果のラッパー
 */
export interface ExtractionResult {
  /** 成功フラグ */
  success: boolean;
  /** 抽出データ */
  data?: ExtractedData;
  /** エラーメッセージ */
  error?: string;
  /** 処理時間（ミリ秒） */
  processingTime?: number;
  /** ファイルパス */
  filePath: string;
}

/**
 * PNGのtEXtチャンクの構造
 */
export interface PngTextChunk {
  /** チャンクのキーワード */
  keyword: string;
  /** チャンクのテキストデータ */
  text: string;
  /** チャンクの長さ */
  length: number;
  /** チャンクのCRC */
  crc?: number;
}

/**
 * EXIFデータの構造
 */
export interface ExifData {
  /** ユーザーコメント */
  UserComment?: string | object;
  /** 画像の説明 */
  ImageDescription?: string;
  /** XPコメント */
  XPComment?: string;
  /** XPキーワード */
  XPKeywords?: string;
  /** ソフトウェア情報 */
  Software?: string;
  /** 作者情報 */
  Artist?: string;
  /** 著作権情報 */
  Copyright?: string;
  /** コメント */
  Comment?: string;
  /** その他のEXIFフィールド */
  [key: string]: any;
}

/**
 * 汎用メタデータチャンクの構造
 */
export interface MetadataChunk {
  /** チャンクのタイプ */
  type: string;
  /** チャンクのデータ */
  data: string | object;
  /** チャンクのサイズ */
  size?: number;
  /** エンコーディング */
  encoding?: string;
}

/**
 * 抽出プロセスのオプション
 */
export interface ExtractorOptions {
  /** 静寂モード */
  quiet?: boolean;
  /** 厳密なバリデーション */
  strict?: boolean;
  /** 最大ファイルサイズ（バイト） */
  maxFileSize?: number;
  /** タイムアウト（ミリ秒） */
  timeout?: number;
  /** 対象フォーマット */
  formats?: string[];
}

/**
 * LoRA情報の構造
 */
export interface LoRAInfo {
  /** LoRAモデル名 */
  name: string;
  /** LoRA強度 */
  strength: number;
  /** LoRAファイルパス */
  path?: string;
}

/**
 * アップスケーラー情報の構造
 */
export interface UpscalerInfo {
  /** アップスケーラーモデル名 */
  model: string;
  /** ハイレゾステップ数 */
  steps?: number;
  /** ハイレゾデノイズ強度 */
  denoising?: number;
  /** アップスケール倍率 */
  scale?: number;
}

/**
 * A1111からComfyUIへの変換結果
 */
export interface ConversionResult {
  /** 変換成功フラグ */
  success: boolean;
  /** 生成されたComfyUIワークフロー */
  workflow?: ComfyUIWorkflow;
  /** 検出されたLoRAリスト */
  loras?: LoRAInfo[];
  /** 検出されたアップスケーラー情報 */
  upscaler?: UpscalerInfo;
  /** 変換エラーメッセージ */
  error?: string;
  /** 元のA1111パラメータ */
  originalParameters?: A1111Parameters;
}

/**
 * A1111からComfyUIへの変換オプション
 */
export interface ConversionOptions {
  /** プロンプトからLoRAタグを除去するか */
  removeLoRATags?: boolean;
  /** デフォルトのモデル名 */
  defaultModel?: string;
  /** デフォルトの画像サイズ */
  defaultSize?: string;
  /** ノードIDの開始番号 */
  startNodeId?: number;
}

/**
 * サポートされる出力フォーマット
 */
export type OutputFormat = 'json' | 'pretty';

/**
 * 保存オプション
 */
export interface SaveOptions {
  /** 保存先ディレクトリ */
  directory: string;
  /** ファイル名のパターン */
  filenamePattern?: string;
  /** 上書きを許可するか */
  overwrite?: boolean;
  /** 出力フォーマット */
  format?: OutputFormat;
}

/**
 * 抽出処理のエラー
 */
export class ExtractionError extends Error {
  constructor(
    message: string,
    public readonly filePath?: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'ExtractionError';
  }
}

/**
 * サポートされていないフォーマットのエラー
 */
export class UnsupportedFormatError extends ExtractionError {
  constructor(
    format: string,
    filePath?: string
  ) {
    super(`Unsupported file format: ${format}`, filePath);
    this.name = 'UnsupportedFormatError';
  }
}

/**
 * 動画メタデータの構造（FFprobeから取得）
 */
export interface VideoMetadata {
  /** フォーマット情報 */
  format?: {
    /** ファイル名 */
    filename?: string;
    /** フォーマット名 */
    format_name?: string;
    /** 長さ（秒） */
    duration?: string;
    /** サイズ（バイト） */
    size?: string;
    /** ビットレート */
    bit_rate?: string;
    /** タグ */
    tags?: Record<string, string>;
  };
  /** ストリーム情報 */
  streams?: VideoStream[];
}

/**
 * 動画ストリームの構造
 */
export interface VideoStream {
  /** ストリームのインデックス */
  index: number;
  /** コーデック名 */
  codec_name?: string;
  /** コーデックタイプ */
  codec_type?: string;
  /** 幅 */
  width?: number;
  /** 高さ */
  height?: number;
  /** フレームレート */
  r_frame_rate?: string;
  /** 長さ（秒） */
  duration?: string;
  /** タグ */
  tags?: Record<string, string>;
}

/**
 * ワークフロー情報の統計
 */
export interface WorkflowInfo {
  /** ノード数 */
  nodeCount: number;
  /** ノードタイプの配列 */
  nodeTypes: string[];
  /** プロンプトノードの有無 */
  hasPrompt: boolean;
  /** モデルノードの有無 */
  hasModel: boolean;
}

/**
 * 抽出されたワークフローデータの構造
 */
export interface ExtractedWorkflowData {
  /** LoRAモデルの情報 */
  loras: Array<{
    /** モデル名 */
    name: string;
    /** 強度 */
    strength: number;
  }>;
  /** プロンプト情報 */
  prompts: Array<{
    /** ポジティブプロンプト */
    positive: string;
    /** ネガティブプロンプト */
    negative?: string;
  }>;
  /** サンプラー設定 */
  samplerSettings: {
    /** ステップ数 */
    steps?: number;
    /** CFGスケール */
    cfg?: number;
    /** CFG開始値 */
    cfg_start?: number;
    /** CFG終了値 */
    cfg_end?: number;
    /** スケジューラー */
    scheduler?: string;
    /** シード値 */
    seed?: number;
    /** ノイズ除去強度 */
    denoise?: number;
  } | null;
  /** モデル名の配列 */
  models: string[];
}

/**
 * コマンドラインオプション
 */
export interface CommandLineOptions {
  /** 出力フォーマット */
  output: OutputFormat;
  /** 保存先ディレクトリ */
  save?: string;
  /** 静寂モード */
  quiet?: boolean;
}

/**
 * グロブ展開の結果
 */
export interface GlobResult {
  /** マッチしたファイルパス */
  files: string[];
  /** 処理時間（ミリ秒） */
  processingTime: number;
}

/**
 * ファイル処理の結果
 */
export interface FileProcessingResult {
  /** ファイルパス */
  file: string;
  /** 抽出された内容 */
  extractedData: ExtractedData;
  /** 処理時間（ミリ秒） */
  processingTime: number;
  /** エラー情報 */
  error?: string;
}

/**
 * バッチ処理の結果
 */
export interface BatchProcessingResult {
  /** 成功したファイル数 */
  successCount: number;
  /** 失敗したファイル数 */
  errorCount: number;
  /** 処理結果の配列 */
  results: FileProcessingResult[];
  /** 総処理時間（ミリ秒） */
  totalTime: number;
}

// 型ガード関数

/**
 * ComfyUIワークフローかどうかを判定
 */
export function isComfyUIWorkflow(data: any): data is ComfyUIWorkflow {
  if (!data || typeof data !== 'object') {
    return false;
  }
  
  const keys = Object.keys(data);
  const hasNumericKeys = keys.some(key => /^\d+$/.test(key));
  
  if (hasNumericKeys) {
    for (const key of keys) {
      if (/^\d+$/.test(key)) {
        const node = data[key];
        if (node && typeof node === 'object' && node.class_type) {
          return true;
        }
      }
    }
  }
  
  return !!(data.workflow || data.prompt || data.extra_pnginfo);
}

/**
 * A1111パラメータかどうかを判定
 */
export function isA1111Parameters(data: any): data is A1111Parameters {
  if (!data || typeof data !== 'object') {
    return false;
  }
  
  const commonFields = ['positive_prompt', 'negative_prompt', 'steps', 'cfg', 'sampler', 'seed'];
  return commonFields.some(field => field in data);
}

/**
 * 抽出データが有効かどうかを判定
 */
export function isValidExtractedData(data: any): data is ExtractedData {
  if (!data || typeof data !== 'object') {
    return false;
  }
  
  return !!(data.workflow || data.parameters || data.metadata || data.user_comment);
}