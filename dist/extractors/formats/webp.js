"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractFromWebP = extractFromWebP;
exports.extractFromWebPAdvanced = extractFromWebPAdvanced;
exports.getWebPMetadataInfo = getWebPMetadataInfo;
const sharp_1 = __importDefault(require("sharp"));
const validation_1 = require("../../utils/validation");
const encoding_1 = require("../../utils/encoding");
const parameters_1 = require("../../utils/parameters");
/**
 * WebPファイルからメタデータを抽出
 * @param filePath WebPファイルパス
 * @returns 抽出されたデータ、または null
 */
async function extractFromWebP(filePath) {
    const result = {};
    try {
        // Sharpを使用してWebPのEXIFデータを抽出
        const metadata = await (0, sharp_1.default)(filePath).metadata();
        if (metadata.exif) {
            const extractedData = await processWebPExifData(metadata.exif);
            Object.assign(result, extractedData);
        }
    }
    catch (error) {
        // エラーが発生した場合は空の結果を返す
    }
    return Object.keys(result).length > 0 ? result : null;
}
/**
 * WebPのEXIFデータを処理
 * @param exifBuffer EXIFバッファ
 * @returns 抽出されたデータ
 */
async function processWebPExifData(exifBuffer) {
    const result = {};
    const exifString = exifBuffer.toString();
    // User Commentフィールドを探す（UNICODEプレフィックスの後にテキストがある）
    const unicodeIndex = exifString.indexOf('UNICODE');
    if (unicodeIndex !== -1) {
        const cleanText = (0, encoding_1.extractUTF16TextFromWebP)(exifString, unicodeIndex);
        if (cleanText) {
            const processedData = await processWebPText(cleanText);
            Object.assign(result, processedData);
        }
    }
    return result;
}
/**
 * WebPから抽出されたテキストを処理
 * @param text 抽出されたテキスト
 * @returns 処理されたデータ
 */
async function processWebPText(text) {
    const result = {};
    // A1111スタイルのパラメータをチェック
    if ((0, encoding_1.isA1111Parameters)(text)) {
        result.parameters = (0, parameters_1.parseA1111Parameters)(text);
        result.raw_parameters = text;
    }
    else if (text.includes('workflow') || text.includes('prompt')) {
        // ComfyUIワークフローまたはプロンプトデータを解析
        try {
            const parsed = JSON.parse(text);
            if ((0, validation_1.validateComfyUIWorkflow)(parsed)) {
                result.workflow = parsed;
            }
            else {
                result.metadata = text;
            }
        }
        catch (e) {
            result.metadata = text;
        }
    }
    else {
        // その他のコメントデータとして保存
        result.user_comment = text;
    }
    return result;
}
/**
 * WebPファイルの高度な処理（将来の拡張用）
 * @param filePath ファイルパス
 * @returns 抽出されたデータ
 */
async function extractFromWebPAdvanced(filePath) {
    // 現在は標準のextractFromWebPと同じ実装
    // 将来的により高度な処理を実装可能
    return extractFromWebP(filePath);
}
/**
 * WebPファイルのメタデータ詳細を取得
 * @param filePath ファイルパス
 * @returns メタデータ情報
 */
async function getWebPMetadataInfo(filePath) {
    const metadata = await (0, sharp_1.default)(filePath).metadata();
    return {
        hasExif: !!metadata.exif,
        exifSize: metadata.exif?.length,
        format: metadata.format || 'webp',
        width: metadata.width,
        height: metadata.height
    };
}
//# sourceMappingURL=webp.js.map