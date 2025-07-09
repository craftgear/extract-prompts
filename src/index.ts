#!/usr/bin/env node

import { Command } from 'commander';
import { glob } from 'glob';
import { extractFromImage } from './extractors/image';
import { extractFromVideo } from './extractors/video';
import { formatOutput } from './utils/output';
import { saveExtractedData } from './utils/save';
import {
  convertA1111ToComfyUI,
  shouldConvertToComfyUI,
} from './converters/a1111-to-comfyui';
import { writeFileSync } from 'fs';
import { join, dirname, basename, extname } from 'path';
import { stat, mkdir } from 'fs/promises';
import { UnsupportedFormatError } from './types';

const program = new Command();

program
  .name('extract-prompts')
  .description('Extract ComfyUI workflow JSON from images and videos')
  .version('2.0.1');

program
  .argument('<files...>', 'Files to process (supports glob patterns)')
  .option('-p, --pretty', 'Human-readable output format')
  .option(
    '-s, --save [directory]',
    'Save workflows to directory (use quotes for paths with spaces, defaults to input directory if not specified)'
  )
  .option('-q, --quiet', 'Suppress non-error output')
  .option('--overwrite', 'Overwrite existing files when saving')
  .option(
    '--name-pattern <pattern>',
    'File naming pattern (source|sequential|timestamp)',
    'source'
  )
  .option(
    '--organize <mode>',
    'Organize saved files (none|format|date)',
    'none'
  )
  .option(
    '--convert-a1111',
    'Convert A1111 parameters to ComfyUI workflow format'
  )
  .action(async (files: string[], options) => {
    try {
      const allFiles = await expandGlobs(files);

      if (allFiles.length === 0) {
        console.error('No files found matching the specified patterns');
        process.exit(1);
      }

      // Detect potential unquoted directory paths with spaces
      if (
        options.save &&
        typeof options.save === 'string' &&
        !options.save.includes(' ') &&
        allFiles.some((f) => !f.includes('.') && f.includes(' '))
      ) {
        console.warn(
          '⚠️  Warning: Some arguments appear to be directory names with spaces.'
        );
        console.warn(
          '   If you intended to specify a directory with spaces, use quotes:'
        );
        console.warn(
          `   --save "${options.save} ${allFiles.filter((f) => !f.includes('.') && f.includes(' ')).join(' ')}"`
        );
        console.warn('');
      }

      for (const file of allFiles) {
        try {
          const result = await extractWorkflow(file);

          if (result) {
            // Detect if result is a1111 or ComfyUI format
            const hasA1111 =
              result.parameters && shouldConvertToComfyUI(result.parameters);
            const hasComfyUI = result.workflow;

            // If result is A1111 format and --convert-a1111 is specified, convert it to ComfyUI workflow and save as a json file
            if (hasA1111 && options.convertA1111 && result.parameters) {
              await processA1111Conversion(file, result, options);
              continue;
            }
            // If result is ComfyUI format and --save is specified, save it as a json file
            if (hasComfyUI && options.save) {
              await processComfyUIWorkflowSave(file, result, options);
              continue;
            }
            // If result is A1111 format and --save is specified, save it as a json file
            if (hasA1111 && options.save) {
              await processA1111ParameterSave(file, result, options);
              continue;
            }
            // Otherwise show the result in the console
            const output = formatOutput(
              file,
              result,
              options.pretty ? 'pretty' : 'json'
            );
            console.log(output);
          }
        } catch (error) {
          if (!options.quiet) {
            console.error(
              `Error processing ${file}:`,
              (error as Error).message
            );
          }
        }
      }
    } catch (error) {
      console.error('Error:', (error as Error).message);
      process.exit(1);
    }
  });

interface ProcessingOptions {
  save?: string | boolean;
  overwrite?: boolean;
  namePattern?: string;
  organize?: string;
  quiet?: boolean;
  pretty?: boolean;
}

async function processA1111Conversion(
  file: string,
  result: any,
  options: ProcessingOptions
): Promise<void> {
  const conversion = convertA1111ToComfyUI(result.parameters);
  if (conversion.success && conversion.workflow) {
    // Save workflow file
    const outputPath = join(
      dirname(file),
      basename(file, extname(file)) + '_workflow.json'
    );

    const saveDirectory =
      typeof options.save === 'string' ? options.save : dirname(file);

    await saveWorkflowsToDirectory(file, conversion.workflow, saveDirectory, {
      overwrite: options.overwrite || false,
      namePattern:
        (options.namePattern as 'source' | 'sequential' | 'timestamp') ||
        'source',
      organize: (options.organize as 'none' | 'format' | 'date') || 'none',
    });

    if (!options.quiet) {
      console.log(`Converted A1111 parameters to ComfyUI workflow for ${file}`);
      if (conversion.loras && conversion.loras.length > 0) {
        console.log(
          `  Found ${conversion.loras.length} LoRA(s): ${conversion.loras.map((l) => l.name).join(', ')}`
        );
      }
      if (conversion.upscaler) {
        console.log(`  Found upscaler: ${conversion.upscaler.model}`);
      }
      console.log(`Saved ComfyUI workflow: ${outputPath}`);
    }
  } else if (!options.quiet) {
    console.warn(
      `Failed to convert A1111 parameters for ${file}: ${conversion.error}`
    );
  }
}

async function processComfyUIWorkflowSave(
  file: string,
  result: any,
  options: ProcessingOptions
): Promise<void> {
  const saveDirectory =
    typeof options.save === 'string' ? options.save : dirname(file);

  await saveWorkflowsToDirectory(file, result.workflow, saveDirectory, {
    overwrite: options.overwrite || false,
    namePattern:
      (options.namePattern as 'source' | 'sequential' | 'timestamp') ||
      'source',
    organize: (options.organize as 'none' | 'format' | 'date') || 'none',
  });

  if (!options.quiet) {
    console.log(`Saved ComfyUI workflow from ${file} to ${saveDirectory}`);
  }
}

async function processA1111ParameterSave(
  file: string,
  result: any,
  options: ProcessingOptions
): Promise<void> {
  const saveDirectory =
    typeof options.save === 'string' ? options.save : dirname(file);

  await saveExtractedData(
    file,
    { file: basename(file), ...result },
    saveDirectory,
    {
      format: 'json',
      overwrite: options.overwrite || false,
      namePattern:
        (options.namePattern as 'source' | 'sequential' | 'timestamp') ||
        'source',
      organize: (options.organize as 'none' | 'format' | 'date') || 'none',
    }
  );

  if (!options.quiet) {
    console.log(`Saved A1111 parameters from ${file} to ${saveDirectory}`);
  }
}

interface WorkflowSaveOptions {
  overwrite: boolean;
  namePattern: 'source' | 'sequential' | 'timestamp';
  organize: 'none' | 'format' | 'date';
}

async function saveWorkflowsToDirectory(
  file: string,
  workflow: any,
  saveDirectory: string,
  options: WorkflowSaveOptions
): Promise<void> {
  // ディレクトリが存在しない場合は作成
  try {
    await mkdir(saveDirectory, { recursive: true });
  } catch (error) {
    // ディレクトリが既に存在する場合は無視
  }
  // ファイル名を生成
  let fileName: string;
  const baseName = basename(file, extname(file));

  switch (options.namePattern) {
    case 'timestamp':
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      fileName = `workflow_${timestamp}.json`;
      break;
    case 'source':
    default:
      fileName = `${baseName}_workflow.json`;
      break;
  }

  // サブディレクトリ構成を処理
  let targetDirectory = saveDirectory;
  if (options.organize === 'format') {
    targetDirectory = join(saveDirectory, 'workflows');
    try {
      await mkdir(targetDirectory, { recursive: true });
    } catch (error) {
      // ディレクトリが既に存在する場合は無視
    }
  } else if (options.organize === 'date') {
    const dateFolder = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    targetDirectory = join(saveDirectory, dateFolder);
    try {
      await mkdir(targetDirectory, { recursive: true });
    } catch (error) {
      // ディレクトリが既に存在する場合は無視
    }
  }

  const outputPath = join(targetDirectory, fileName);

  // 既存ファイルのチェック
  if (!options.overwrite) {
    try {
      await stat(outputPath);
      console.warn(`File already exists, skipping: ${outputPath}`);
    } catch (error) {
      // ファイルが存在しない場合は続行
    }
  }

  // ワークフローをJSONとして保存
  const workflowContent = JSON.stringify(workflow, null, 2);
  writeFileSync(outputPath, workflowContent);
}

async function expandGlobs(patterns: string[]): Promise<string[]> {
  const files = [];
  for (const pattern of patterns) {
    try {
      const stats = await stat(pattern);
      if (stats.isDirectory()) {
        // ディレクトリ内の画像ファイルを再帰的に検索
        const imageGlobs = [
          join(pattern, '**/*.png'),
          join(pattern, '**/*.jpg'),
          join(pattern, '**/*.jpeg'),
          join(pattern, '**/*.webp'),
          join(pattern, '**/*.mp4'),
          join(pattern, '**/*.webm'),
          join(pattern, '**/*.mov'),
        ];

        for (const imageGlob of imageGlobs) {
          const matches = await glob(imageGlob);
          files.push(...matches);
        }
      } else {
        // 通常のファイルまたはglobパターン
        const matches = await glob(pattern);
        files.push(...matches);
      }
    } catch (error) {
      // ファイルが存在しない場合はglobパターンとして処理
      const matches = await glob(pattern);
      files.push(...matches);
    }
  }
  return [...new Set(files)];
}

async function extractWorkflow(filePath: string) {
  const ext = filePath.toLowerCase().split('.').pop();

  switch (ext) {
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'webp': {
      const result = await extractFromImage(filePath);
      return result;
    }
    case 'mp4':
    case 'webm':
    case 'mov': {
      const result = await extractFromVideo(filePath);
      return result;
    }
    default:
      throw new UnsupportedFormatError(ext || 'unknown', filePath);
  }
}

program.parse();
