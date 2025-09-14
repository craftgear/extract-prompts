import ffprobeStatic from 'ffprobe-static';
import { spawn } from 'child_process';
import { readFileSync } from 'fs';
import { extname } from 'path';
import { validateComfyUIWorkflow } from '../utils/validation';
import {
  ExternalCommandError,
  MetadataNotFoundError,
  ParseError,
} from '../errors/index';
import { RawExtractionResult, VideoMetadata } from '../types';
import { extractMP4Metadata } from './mp4-parser';
import { extractWebMMetadata } from './webm-parser';
import { metadataCache } from './cache';

// ファイル形式を検出
function detectFileFormat(filePath: string): 'mp4' | 'webm' | 'mkv' | 'fallback' {
  const ext = extname(filePath).toLowerCase();

  switch (ext) {
    case '.mp4':
    case '.m4v':
    case '.mov':
      return 'mp4';
    case '.webm':
      return 'webm';
    case '.mkv':
      return 'mkv';
    default:
      return 'fallback';
  }
}

// マジックバイトによるファイル形式の検証
function verifyFileFormat(filePath: string, expectedFormat: string): boolean {
  try {
    const buffer = readFileSync(filePath).slice(0, 12);

    switch (expectedFormat) {
      case 'mp4':
        // MP4のftypボックスをチェック
        return buffer.includes(Buffer.from('ftyp'));
      case 'webm':
      case 'mkv':
        // EBMLヘッダーをチェック
        return buffer[0] === 0x1A && buffer[1] === 0x45 && buffer[2] === 0xDF && buffer[3] === 0xA3;
      default:
        return true;
    }
  } catch {
    return false;
  }
}

export async function extractFromVideo(
  filePath: string
): Promise<RawExtractionResult | null> {
  // キャッシュから取得を試行
  let metadata = metadataCache.get(filePath);

  if (!metadata) {
    const format = detectFileFormat(filePath);

    try {
      // 形式に応じて最適なパーサーを使用
      switch (format) {
        case 'mp4':
          // TODO: MP4 native parser needs metadata extraction fix
          // Temporarily disabled to ensure reliable extraction
          // if (verifyFileFormat(filePath, 'mp4')) {
          //   metadata = await extractMP4Metadata(filePath);
          // }
          break;
        case 'webm':
        case 'mkv':
          // TODO: WebM/MKV native parser needs tag extraction fix
          // Temporarily disabled to ensure reliable extraction
          // if (verifyFileFormat(filePath, format)) {
          //   metadata = await extractWebMMetadata(filePath);
          // }
          break;
        case 'fallback':
        default:
          // その他の形式やネイティブパーサーが失敗した場合はffprobeを使用
          break;
      }
    } catch (error) {
      // ネイティブパーサーが失敗した場合はログに記録してffprobeにフォールバック
      console.warn(`Native parser failed for ${filePath}, falling back to ffprobe:`, error);
    }

    // ネイティブパーサーが失敗したか、対応していない形式の場合はffprobeを使用
    if (!metadata) {
      metadata = await getVideoMetadata(filePath);
    }

    // メタデータが取得できた場合はキャッシュに保存
    if (metadata) {
      metadataCache.set(filePath, metadata);
    }
  }

  if (!metadata) {
    throw new MetadataNotFoundError(filePath, 'video', [
      'format.tags',
      'streams.tags',
    ]);
  }

  const result: RawExtractionResult = {};

  // Check format metadata
  if (metadata.format && metadata.format.tags) {
    const tags = metadata.format.tags;

    // Common fields where ComfyUI might store workflow data
    const potentialFields = [
      'comment',
      'description',
      'metadata',
      'workflow',
      'comfyui',
      'ComfyUI',
    ];

    for (const field of potentialFields) {
      const value =
        tags[field] || tags[field.toLowerCase()] || tags[field.toUpperCase()];

      if (value && typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          if (validateComfyUIWorkflow(parsed)) {
            // 一部のエンコーダはラッパー({ workflow: {...} })ではなく、ワークフロー本体を直接保存する
            result.workflow = (parsed as any).workflow ?? parsed;
            break;
          }
        } catch (e) {
          // Try to find JSON patterns in the string
          const jsonMatch = value.match(/\{[\s\S]*?\}/);
          if (jsonMatch) {
            try {
              const parsed = JSON.parse(jsonMatch[0]);
              if (validateComfyUIWorkflow(parsed)) {
                // ラッパー有無に関係なく取り出す
                result.workflow = (parsed as any).workflow ?? parsed;
                break;
              }
            } catch (e) {
              // Continue to next field
            }
          }
        }
      }
    }
  }

  // Check stream metadata
  if (metadata.streams) {
    for (const stream of metadata.streams) {
      if (stream.tags) {
        const tags = stream.tags;

        for (const [_key, value] of Object.entries(tags)) {
          if (typeof value === 'string') {
            try {
              const parsed = JSON.parse(value);
              if (validateComfyUIWorkflow(parsed)) {
                // ラッパー有無に関係なく取り出す
                result.workflow = (parsed as any).workflow ?? parsed;
                break;
              }
            } catch (e) {
              // Continue
            }
          }
        }

        if (result.workflow) break;
      }
    }
  }

  return Object.keys(result).length > 0 ? result : null;
}

async function getVideoMetadata(
  filePath: string,
  timeoutMs: number = 30000
): Promise<VideoMetadata | null> {
  return new Promise((resolve, reject) => {
    const args = [
      '-v',
      'quiet',
      '-print_format',
      'json',
      '-show_format',
      '-probesize',
      '32M',
      '-analyzeduration',
      '5M',
      '-read_intervals',
      '%+#1',
      filePath,
    ];

    const process = spawn(ffprobeStatic.path, args);
    let stdout = '';
    let stderr = '';
    let isResolved = false;

    // タイムアウト処理
    const timeout = setTimeout(() => {
      if (!isResolved) {
        isResolved = true;
        process.kill('SIGKILL');
        reject(
          new ExternalCommandError(
            'ffprobe',
            args,
            null,
            `Process timeout after ${timeoutMs}ms`,
            filePath
          )
        );
      }
    }, timeoutMs);

    const cleanup = () => {
      if (timeout) clearTimeout(timeout);
    };

    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    process.on('close', (code) => {
      if (isResolved) return;
      isResolved = true;
      cleanup();

      if (code !== 0) {
        reject(
          new ExternalCommandError(
            'ffprobe',
            args,
            code || -1,
            stderr,
            filePath
          )
        );
        return;
      }

      try {
        const metadata = JSON.parse(stdout);
        resolve(metadata);
      } catch (error) {
        reject(
          new ParseError(
            `Failed to parse ffprobe output: ${(error as Error).message}`,
            error as Error,
            stdout,
            'JSON',
            filePath
          )
        );
      }
    });

    process.on('error', (error) => {
      if (isResolved) return;
      isResolved = true;
      cleanup();

      reject(
        new ExternalCommandError(
          'ffprobe',
          args,
          null,
          `Process error: ${(error as Error).message}`,
          filePath
        )
      );
    });
  });
}
