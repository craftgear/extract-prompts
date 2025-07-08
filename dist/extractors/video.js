"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractFromVideo = extractFromVideo;
const ffprobe_static_1 = __importDefault(require("ffprobe-static"));
const child_process_1 = require("child_process");
const validation_1 = require("../utils/validation");
const index_1 = require("../errors/index");
async function extractFromVideo(filePath) {
    const metadata = await getVideoMetadata(filePath);
    if (!metadata) {
        throw new index_1.MetadataNotFoundError(filePath, 'video', ['format.tags', 'streams.tags']);
    }
    const result = {};
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
            'ComfyUI'
        ];
        for (const field of potentialFields) {
            const value = tags[field] || tags[field.toLowerCase()] || tags[field.toUpperCase()];
            if (value && typeof value === 'string') {
                try {
                    const parsed = JSON.parse(value);
                    if ((0, validation_1.validateComfyUIWorkflow)(parsed)) {
                        result.workflow = parsed;
                        break;
                    }
                }
                catch (e) {
                    // Try to find JSON patterns in the string
                    const jsonMatch = value.match(/\{[^}]+\}/);
                    if (jsonMatch) {
                        try {
                            const parsed = JSON.parse(jsonMatch[0]);
                            if ((0, validation_1.validateComfyUIWorkflow)(parsed)) {
                                result.workflow = parsed;
                                break;
                            }
                        }
                        catch (e) {
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
                for (const [key, value] of Object.entries(tags)) {
                    if (typeof value === 'string') {
                        try {
                            const parsed = JSON.parse(value);
                            if ((0, validation_1.validateComfyUIWorkflow)(parsed)) {
                                result.workflow = parsed;
                                break;
                            }
                        }
                        catch (e) {
                            // Continue
                        }
                    }
                }
                if (result.workflow)
                    break;
            }
        }
    }
    return Object.keys(result).length > 0 ? result : null;
}
async function getVideoMetadata(filePath) {
    return new Promise((resolve, reject) => {
        const args = [
            '-v', 'quiet',
            '-print_format', 'json',
            '-show_format',
            '-show_streams',
            filePath
        ];
        const process = (0, child_process_1.spawn)(ffprobe_static_1.default.path, args);
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
                reject(new index_1.ExternalCommandError('ffprobe', args, code || -1, stderr, filePath));
                return;
            }
            try {
                const metadata = JSON.parse(stdout);
                resolve(metadata);
            }
            catch (error) {
                reject(new index_1.ParseError(`Failed to parse ffprobe output: ${error.message}`, error, stdout, 'JSON', filePath));
            }
        });
        process.on('error', (error) => {
            reject(new index_1.ExternalCommandError('ffprobe', args, null, `Process error: ${error.message}`, filePath));
        });
    });
}
//# sourceMappingURL=video.js.map