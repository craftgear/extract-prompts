import ffprobeStatic from 'ffprobe-static';
import { spawn } from 'child_process';
import { validateComfyUIWorkflow } from '../utils/validation';
import {
  ExternalCommandError,
  MetadataNotFoundError,
  ParseError,
} from '../errors/index';
import { RawExtractionResult, VideoMetadata } from '../types';

export async function extractFromVideo(
  filePath: string
): Promise<RawExtractionResult | null> {
  const metadata = await getVideoMetadata(filePath);

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
            result.workflow = parsed.workflow;
            break;
          }
        } catch (e) {
          // Try to find JSON patterns in the string
          const jsonMatch = value.match(/\{[\s\S]*?\}/);
          if (jsonMatch) {
            try {
              const parsed = JSON.parse(jsonMatch[0]);
              if (validateComfyUIWorkflow(parsed)) {
                result.workflow = parsed.workflow;
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
                result.workflow = parsed.workflow;
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
  filePath: string
): Promise<VideoMetadata | null> {
  return new Promise((resolve, reject) => {
    const args = [
      '-v',
      'quiet',
      '-print_format',
      'json',
      '-show_format',
      '-show_streams',
      filePath,
    ];

    const process = spawn(ffprobeStatic.path, args);

    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    process.on('close', (code) => {
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
