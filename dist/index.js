#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const glob_1 = require("glob");
const image_1 = require("./extractors/image");
const video_1 = require("./extractors/video");
const output_1 = require("./utils/output");
const save_1 = require("./utils/save");
const a1111_to_comfyui_1 = require("./converters/a1111-to-comfyui");
const fs_1 = require("fs");
const path_1 = require("path");
const types_1 = require("./types");
const program = new commander_1.Command();
program
    .name('extract-prompts')
    .description('Extract ComfyUI workflow JSON from images and videos')
    .version('2.0.1');
program
    .argument('<files...>', 'Files to process (supports glob patterns)')
    .option('-p, --pretty', 'Human-readable output format')
    .option('-s, --save [directory]', 'Save workflows to directory (use quotes for paths with spaces, defaults to input directory if not specified)')
    .option('-q, --quiet', 'Suppress non-error output')
    .option('--overwrite', 'Overwrite existing files when saving')
    .option('--name-pattern <pattern>', 'File naming pattern (source|sequential|timestamp)', 'source')
    .option('--organize <mode>', 'Organize saved files (none|format|date)', 'none')
    .option('--json-file', 'Create JSON file with same name as input file')
    .option('--convert-a1111', 'Convert A1111 parameters to ComfyUI workflow format')
    .action(async (files, options) => {
    try {
        const allFiles = await expandGlobs(files);
        if (allFiles.length === 0) {
            console.error('No files found matching the specified patterns');
            process.exit(1);
        }
        // Detect potential unquoted directory paths with spaces
        if (options.save && typeof options.save === 'string' &&
            !options.save.includes(' ') &&
            allFiles.some(f => !f.includes('.') && f.includes(' '))) {
            console.warn('⚠️  Warning: Some arguments appear to be directory names with spaces.');
            console.warn('   If you intended to specify a directory with spaces, use quotes:');
            console.warn(`   --save "${options.save} ${allFiles.filter(f => !f.includes('.') && f.includes(' ')).join(' ')}"`);
            console.warn('');
        }
        const results = [];
        for (const file of allFiles) {
            try {
                const result = await extractWorkflow(file);
                if (result) {
                    let processedResult = { file, ...result };
                    // A1111からComfyUIへの変換処理
                    if (options.convertA1111 &&
                        result.parameters &&
                        (0, a1111_to_comfyui_1.shouldConvertToComfyUI)(result.parameters)) {
                        const conversionResult = (0, a1111_to_comfyui_1.convertA1111ToComfyUI)(result.parameters);
                        if (conversionResult.success && conversionResult.workflow) {
                            processedResult.workflow = conversionResult.workflow;
                            if (!options.quiet) {
                                console.log(`Converted A1111 parameters to ComfyUI workflow for ${file}`);
                                if (conversionResult.loras &&
                                    conversionResult.loras.length > 0) {
                                    console.log(`  Found ${conversionResult.loras.length} LoRA(s): ${conversionResult.loras.map((l) => l.name).join(', ')}`);
                                }
                                if (conversionResult.upscaler) {
                                    console.log(`  Found upscaler: ${conversionResult.upscaler.model}`);
                                }
                            }
                        }
                        else if (!options.quiet) {
                            console.warn(`Failed to convert A1111 parameters for ${file}: ${conversionResult.error}`);
                        }
                    }
                    results.push(processedResult);
                    // --json-file オプションが指定された場合、入力ファイルと同じ名前でJSONファイルを作成
                    if (options.jsonFile) {
                        const outputPath = (0, path_1.join)((0, path_1.dirname)(file), (0, path_1.basename)(file, (0, path_1.extname)(file)) + '.json');
                        const jsonContent = JSON.stringify(processedResult.workflow, null, 2);
                        (0, fs_1.writeFileSync)(outputPath, jsonContent);
                        if (!options.quiet) {
                            console.log(`Created JSON file: ${outputPath}`);
                        }
                    }
                }
            }
            catch (error) {
                if (!options.quiet) {
                    console.error(`Error processing ${file}:`, error.message);
                }
            }
        }
        if (results.length === 0) {
            console.error('No workflow data found in any files');
            process.exit(1);
        }
        // Handle A1111 to ComfyUI conversion output differently  
        if (options.convertA1111) {
            const workflowResults = results.filter(result => result.workflow);
            if (workflowResults.length === 0) {
                console.error('No workflows generated from A1111 conversion');
                process.exit(1);
            }
            // Always save individual workflow files when using --convert-a1111
            let savedFiles = 0;
            for (const result of workflowResults) {
                const outputPath = (0, path_1.join)((0, path_1.dirname)(result.file), (0, path_1.basename)(result.file, (0, path_1.extname)(result.file)) + '_workflow.json');
                const workflowContent = JSON.stringify(result.workflow, null, 2);
                (0, fs_1.writeFileSync)(outputPath, workflowContent);
                if (!options.quiet) {
                    console.log(`Saved ComfyUI workflow: ${outputPath}`);
                }
                savedFiles++;
            }
            if (!options.quiet) {
                console.log(`Generated ${savedFiles} ComfyUI workflow file(s)`);
            }
            // Handle additional --save option if specified (for saving in different location)
            if (options.save !== undefined) {
                const saveDirectory = (typeof options.save === 'string')
                    ? options.save
                    : (allFiles.length > 0 ? (0, path_1.dirname)(allFiles[0]) : './extracted');
                await (0, save_1.saveExtractedData)(results, saveDirectory, {
                    format: (options.pretty ? 'pretty' : 'json'),
                    overwrite: options.overwrite || false,
                    namePattern: options.namePattern ||
                        'source',
                    organize: options.organize || 'none',
                });
                console.log(`Also saved ${results.length} file(s) to ${saveDirectory}`);
            }
        }
        else {
            // Normal extraction mode
            const output = (0, output_1.formatOutput)(results, options.pretty ? 'pretty' : 'json');
            if (options.save !== undefined) {
                const saveDirectory = (typeof options.save === 'string')
                    ? options.save
                    : (allFiles.length > 0 ? (0, path_1.dirname)(allFiles[0]) : './extracted');
                await (0, save_1.saveExtractedData)(results, saveDirectory, {
                    format: (options.pretty ? 'pretty' : 'json'),
                    overwrite: options.overwrite || false,
                    namePattern: options.namePattern ||
                        'source',
                    organize: options.organize || 'none',
                });
                console.log(`Saved ${results.length} file(s) to ${saveDirectory}`);
            }
            else {
                console.log(output);
            }
        }
    }
    catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
});
async function expandGlobs(patterns) {
    const files = [];
    for (const pattern of patterns) {
        const matches = await (0, glob_1.glob)(pattern);
        files.push(...matches);
    }
    return [...new Set(files)];
}
async function extractWorkflow(filePath) {
    const ext = filePath.toLowerCase().split('.').pop();
    switch (ext) {
        case 'png':
        case 'jpg':
        case 'jpeg':
        case 'webp':
            return await (0, image_1.extractFromImage)(filePath);
        case 'mp4':
        case 'webm':
        case 'mov':
            return await (0, video_1.extractFromVideo)(filePath);
        default:
            throw new types_1.UnsupportedFormatError(ext || 'unknown', filePath);
    }
}
program.parse();
//# sourceMappingURL=index.js.map