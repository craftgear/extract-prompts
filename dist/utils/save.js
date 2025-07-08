"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveExtractedData = saveExtractedData;
exports.handleDuplicateNames = handleDuplicateNames;
exports.calculateSaveStats = calculateSaveStats;
const fs_1 = require("fs");
const path = __importStar(require("path"));
const output_1 = require("./output");
/**
 * 抽出されたデータをディレクトリに保存
 */
async function saveExtractedData(data, directory, options = {}) {
    const { format = 'json', overwrite = false, namePattern = 'source', organize = 'none' } = options;
    // ディレクトリが存在しない場合は作成
    await ensureDirectory(directory);
    const processedData = await Promise.all(data.map(async (item, index) => {
        const fileName = generateFileName(item, index, namePattern, format, options.customNameFn);
        const targetDirectory = getTargetDirectory(directory, organize, format);
        // 必要に応じてサブディレクトリを作成
        if (targetDirectory !== directory) {
            await ensureDirectory(targetDirectory);
        }
        const filePath = path.join(targetDirectory, fileName);
        // 既存ファイルのチェック
        if (!overwrite && await fileExists(filePath)) {
            throw new Error(`File already exists: ${filePath}. Use overwrite option to replace.`);
        }
        // データの形式に応じてコンテンツを生成
        let content;
        if (format === 'json') {
            content = JSON.stringify([item], null, 2);
        }
        else if (format === 'pretty') {
            content = (0, output_1.formatOutput)([item], 'pretty');
        }
        else {
            content = JSON.stringify([item], null, 2);
        }
        // ファイルに書き込み
        await fs_1.promises.writeFile(filePath, content, 'utf8');
        return {
            sourceFile: item.file,
            savedFile: filePath,
            size: content.length
        };
    }));
    console.log(`Saved ${processedData.length} files to ${directory}`);
    if (!options.overwrite) {
        processedData.forEach(item => {
            console.log(`  ${path.basename(item.sourceFile)} -> ${path.basename(item.savedFile)}`);
        });
    }
}
/**
 * ディレクトリが存在することを確認し、存在しない場合は作成
 */
async function ensureDirectory(dirPath) {
    try {
        await fs_1.promises.access(dirPath);
    }
    catch (error) {
        await fs_1.promises.mkdir(dirPath, { recursive: true });
    }
}
/**
 * ファイルが存在するかチェック
 */
async function fileExists(filePath) {
    try {
        await fs_1.promises.access(filePath);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * ファイル名を生成
 */
function generateFileName(data, index, pattern, format, customNameFn) {
    const extension = getFileExtension(format);
    if (pattern === 'custom' && customNameFn) {
        const customName = customNameFn(data, index);
        return ensureExtension(customName, extension);
    }
    let baseName;
    switch (pattern) {
        case 'source':
            baseName = path.basename(data.file, path.extname(data.file));
            break;
        case 'sequential':
            baseName = `workflow_${(index + 1).toString().padStart(3, '0')}`;
            break;
        case 'timestamp':
            baseName = `workflow_${Date.now()}_${index}`;
            break;
        default:
            baseName = path.basename(data.file, path.extname(data.file));
    }
    return `${baseName}${extension}`;
}
/**
 * 保存先ディレクトリを決定
 */
function getTargetDirectory(baseDir, organize, format) {
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
function getFileExtension(format) {
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
function ensureExtension(fileName, extension) {
    if (fileName.endsWith(extension)) {
        return fileName;
    }
    return fileName + extension;
}
/**
 * 重複するファイル名を処理
 */
function handleDuplicateNames(files) {
    const nameCount = new Map();
    return files.map(file => {
        const base = path.basename(file, path.extname(file));
        const ext = path.extname(file);
        if (nameCount.has(base)) {
            const count = nameCount.get(base) + 1;
            nameCount.set(base, count);
            return `${base}_${count}${ext}`;
        }
        else {
            nameCount.set(base, 1);
            return file;
        }
    });
}
/**
 * 保存統計情報を計算
 */
function calculateSaveStats(results) {
    return {
        totalFiles: results.length,
        savedFiles: results.filter(r => r.success).length,
        skippedFiles: results.filter(r => r.skipped).length,
        errors: results.filter(r => r.error).length,
        totalSize: results.reduce((sum, r) => sum + (r.size || 0), 0)
    };
}
//# sourceMappingURL=save.js.map