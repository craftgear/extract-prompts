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
import { ExtractedData, OutputFormat, UnsupportedFormatError } from './types';

const program = new Command();

program
  .name('extract-prompts')
  .description('Extract ComfyUI workflow JSON from images and videos')
  .version('2.0.0');

program
  .argument('<files...>', 'Files to process (supports glob patterns)')
  .option('-p, --pretty', 'Human-readable output format')
  .option(
    '-s, --save [directory]',
    'Save workflows to directory (defaults to input directory if not specified)'
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
  .option('--json-file', 'Create JSON file with same name as input file')
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

      const results = [];

      for (const file of allFiles) {
        try {
          const result = await extractWorkflow(file);
          if (result) {
            let processedResult = { file, ...result };

            // A1111からComfyUIへの変換処理
            if (
              options.convertA1111 &&
              result.parameters &&
              shouldConvertToComfyUI(result.parameters)
            ) {
              const conversionResult = convertA1111ToComfyUI(result.parameters);
              if (conversionResult.success && conversionResult.workflow) {
                processedResult.workflow = conversionResult.workflow;
                if (!options.quiet) {
                  console.log(
                    `Converted A1111 parameters to ComfyUI workflow for ${file}`
                  );
                  if (
                    conversionResult.loras &&
                    conversionResult.loras.length > 0
                  ) {
                    console.log(
                      `  Found ${conversionResult.loras.length} LoRA(s): ${conversionResult.loras.map((l) => l.name).join(', ')}`
                    );
                  }
                  if (conversionResult.upscaler) {
                    console.log(
                      `  Found upscaler: ${conversionResult.upscaler.model}`
                    );
                  }
                }
              } else if (!options.quiet) {
                console.warn(
                  `Failed to convert A1111 parameters for ${file}: ${conversionResult.error}`
                );
              }
            }

            results.push(processedResult);

            // --json-file オプションが指定された場合、入力ファイルと同じ名前でJSONファイルを作成
            if (options.jsonFile) {
              const outputPath = join(
                dirname(file),
                basename(file, extname(file)) + '.json'
              );
              const jsonContent = JSON.stringify(
                processedResult.workflow,
                null,
                2
              );
              writeFileSync(outputPath, jsonContent);
              if (!options.quiet) {
                console.log(`Created JSON file: ${outputPath}`);
              }
            }
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

      if (results.length === 0) {
        console.error('No workflow data found in any files');
        process.exit(1);
      }

      const output = formatOutput(results, options.pretty ? 'pretty' : 'json');

      if (options.save !== undefined) {
        // If --save is specified without directory, use the directory of the first input file
        const saveDirectory =
          options.save ||
          (allFiles.length > 0 ? dirname(allFiles[0]) : './extracted');

        await saveExtractedData(results as ExtractedData[], saveDirectory, {
          format: (options.pretty ? 'pretty' : 'json') as OutputFormat,
          overwrite: options.overwrite || false,
          namePattern:
            (options.namePattern as 'source' | 'sequential' | 'timestamp') ||
            'source',
          organize: (options.organize as 'none' | 'format' | 'date') || 'none',
        });
        console.log(`Saved ${results.length} file(s) to ${saveDirectory}`);
      } else {
        console.log(output);
      }
    } catch (error) {
      console.error('Error:', (error as Error).message);
      process.exit(1);
    }
  });

async function expandGlobs(patterns: string[]): Promise<string[]> {
  const files = [];
  for (const pattern of patterns) {
    const matches = await glob(pattern);
    files.push(...matches);
  }
  return [...new Set(files)];
}

async function extractWorkflow(filePath: string) {
  const ext = filePath.toLowerCase().split('.').pop();

  switch (ext) {
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'webp':
      return await extractFromImage(filePath);
    case 'mp4':
    case 'webm':
    case 'mov':
      return await extractFromVideo(filePath);
    default:
      throw new UnsupportedFormatError(ext || 'unknown', filePath);
  }
}

program.parse();

