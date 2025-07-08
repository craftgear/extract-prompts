"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractFromJPEG = extractFromJPEG;
const sharp_1 = __importDefault(require("sharp"));
const exifr_1 = __importDefault(require("exifr"));
const validation_1 = require("../../utils/validation");
const encoding_1 = require("../../utils/encoding");
const parameters_1 = require("../../utils/parameters");
/**
 * JPEGファイルからメタデータを抽出
 * @param filePath JPEGファイルパス
 * @returns 抽出されたデータ、または null
 */
async function extractFromJPEG(filePath) {
    const result = {};
    try {
        // exifrを使用してEXIFデータを抽出
        const exifData = await extractExifData(filePath);
        if (exifData) {
            // ComfyUIワークフローまたはA1111パラメータを検索
            const extractedData = await processExifFields(exifData);
            Object.assign(result, extractedData);
        }
    }
    catch (error) {
        // フォールバック: sharpを使用してメタデータを抽出
        try {
            const fallbackData = await extractWithSharpFallback(filePath);
            Object.assign(result, fallbackData);
        }
        catch (fallbackError) {
            // 抽出失敗時は空の結果を返す
        }
    }
    return Object.keys(result).length > 0 ? result : null;
}
/**
 * exifrを使用してEXIFデータを抽出
 * @param filePath ファイルパス
 * @returns EXIFデータ
 */
async function extractExifData(filePath) {
    const options = {
        userComment: true,
        exif: true,
        gps: false,
        tiff: true,
        icc: false,
        iptc: false,
        jfif: false,
        ihdr: false,
        reviveValues: false,
        translateKeys: false,
        translateValues: false,
        mergeOutput: false
    };
    return await exifr_1.default.parse(filePath, options);
}
/**
 * EXIFフィールドを処理してデータを抽出
 * @param exifData EXIFデータ
 * @returns 抽出されたデータ
 */
async function processExifFields(exifData) {
    const result = {};
    // ComfyUIデータが格納される可能性のあるEXIFフィールド
    const fieldsToCheck = [
        'UserComment',
        'ImageDescription',
        'XPComment',
        'XPKeywords',
        'Software',
        'Artist',
        'Copyright',
        'Comment'
    ];
    // 各フィールドをチェック
    for (const field of fieldsToCheck) {
        const value = exifData[field];
        if (value && typeof value === 'string') {
            const extracted = await processStringField(value);
            if (extracted) {
                Object.assign(result, extracted);
                break; // 最初に見つかったデータを使用
            }
        }
    }
    // UTF-16エンコードされたUserCommentフィールドを処理
    if (!result.workflow && !result.parameters) {
        const userCommentData = await processUserCommentField(exifData);
        if (userCommentData) {
            Object.assign(result, userCommentData);
        }
    }
    // A1111スタイルのパラメータをImageDescriptionから抽出
    if (!result.workflow && !result.parameters) {
        const imageDesc = exifData.ImageDescription || '';
        if ((0, encoding_1.isA1111Parameters)(imageDesc)) {
            result.parameters = (0, parameters_1.parseA1111Parameters)(imageDesc);
        }
    }
    return result;
}
/**
 * 文字列フィールドを処理
 * @param value フィールド値
 * @returns 抽出されたデータ
 */
async function processStringField(value) {
    // 直接JSON解析を試行
    try {
        const parsed = JSON.parse(value);
        if ((0, validation_1.validateComfyUIWorkflow)(parsed)) {
            return { workflow: parsed };
        }
    }
    catch (e) {
        // JSONパターンを検索
        const jsonMatches = (0, encoding_1.extractJSONFromText)(value);
        if (jsonMatches.length > 0) {
            for (const match of jsonMatches) {
                try {
                    const parsed = JSON.parse(match);
                    if ((0, validation_1.validateComfyUIWorkflow)(parsed)) {
                        return { workflow: parsed };
                    }
                }
                catch (e) {
                    // 次のマッチを試行
                }
            }
        }
    }
    return null;
}
/**
 * UTF-16エンコードされたUserCommentフィールドを処理
 * @param exifData EXIFデータ
 * @returns 抽出されたデータ
 */
async function processUserCommentField(exifData) {
    const userComment = exifData.userComment || exifData.UserComment;
    if (!userComment) {
        return null;
    }
    let decodedComment = '';
    if (typeof userComment === 'object' && userComment !== null) {
        // バイト配列として保存されている場合（UTF-16）
        const bytes = (0, encoding_1.extractBytesFromObject)(userComment);
        if (bytes.length > 9) {
            decodedComment = (0, encoding_1.decodeUTF16FromBytes)(bytes);
        }
    }
    else if (typeof userComment === 'string') {
        decodedComment = userComment;
    }
    if (!decodedComment) {
        return null;
    }
    const result = {};
    // A1111スタイルのパラメータをチェック
    if ((0, encoding_1.isA1111Parameters)(decodedComment)) {
        result.parameters = (0, parameters_1.parseA1111Parameters)(decodedComment);
        result.raw_parameters = decodedComment;
    }
    else if (decodedComment.includes('workflow') || decodedComment.includes('prompt')) {
        // ComfyUIワークフローまたはプロンプトデータを解析
        try {
            const parsed = JSON.parse(decodedComment);
            result.workflow = parsed;
        }
        catch (e) {
            result.metadata = decodedComment;
        }
    }
    else {
        // その他のメタデータとして保存
        result.user_comment = decodedComment;
    }
    return result;
}
/**
 * Sharpを使用したフォールバック抽出
 * @param filePath ファイルパス
 * @returns 抽出されたデータ
 */
async function extractWithSharpFallback(filePath) {
    const result = {};
    const sharpMetadata = await (0, sharp_1.default)(filePath).metadata();
    if (sharpMetadata.exif) {
        const exifString = sharpMetadata.exif.toString();
        const jsonMatches = (0, encoding_1.extractJSONFromText)(exifString);
        if (jsonMatches.length > 0) {
            for (const match of jsonMatches) {
                try {
                    const parsed = JSON.parse(match);
                    if ((0, validation_1.validateComfyUIWorkflow)(parsed)) {
                        result.workflow = parsed;
                        break;
                    }
                }
                catch (e) {
                    // 次のマッチを試行
                }
            }
        }
    }
    return result;
}
//# sourceMappingURL=jpeg.js.map