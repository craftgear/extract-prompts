import sharp from 'sharp';
import exifr from 'exifr';
import { validateComfyUIWorkflow } from '../utils/validation';
import { parseA1111Parameters } from '../parsers/a1111';
import { RawExtractionResult } from '../types/index';
import { UnsupportedFormatError, FileAccessError } from '../errors/index';
import {
  extractTextAfterUnicodePrefix,
  extractTextFromUtf16Le,
  decodeUserComment
} from '../utils/encoding';
import {
  extractPngTextChunks,
  parseTextChunk,
  extractJsonPatterns
} from '../utils/binary';
import {
  isPngFormat,
  isJpegFormat,
  isWebpFormat,
  containsA1111Parameters,
  isMetadataKeyword,
  normalizeExifFieldName
} from '../utils/formats';

export async function extractFromImage(filePath: string): Promise<RawExtractionResult | null> {
  // PNG files store ComfyUI data in tEXt chunks
  if (isPngFormat(filePath)) {
    return extractFromPNG(filePath);
  }
  
  // JPEG files may have metadata in EXIF
  if (isJpegFormat(filePath)) {
    return extractFromJPEG(filePath);
  }
  
  // WebP files may have metadata in EXIF
  if (isWebpFormat(filePath)) {
    return extractFromWebP(filePath);
  }
  
  const ext = filePath.split('.').pop() || 'unknown';
  throw new UnsupportedFormatError(filePath, ext, ['png', 'jpg', 'jpeg', 'webp']);
}

async function extractFromPNG(filePath: string): Promise<RawExtractionResult | null> {
  const result: any = {};
  
  try {
    // Read data directly from PNG tEXt chunks
    const fs = await import('fs/promises');
    let buffer: Buffer;
    
    try {
      buffer = await fs.readFile(filePath);
    } catch (error) {
      throw new FileAccessError(filePath, 'read', error as Error);
    }
    
    const textChunks = extractPngTextChunks(buffer);
    
    for (const chunk of textChunks) {
      const parsed = parseTextChunk(chunk.data);
      if (!parsed) continue;
      
      const { keyword, text } = parsed;
      
      // Check for keywords that may contain ComfyUI or A1111 data
      if (isMetadataKeyword(keyword)) {
        if (keyword === 'parameters') {
          // Parse A1111 style parameters
          result.parameters = parseA1111Parameters(text);
          result.raw_parameters = text;
        } else {
          // Check if JSON data
          try {
            const parsedJson = JSON.parse(text);
            if (validateComfyUIWorkflow(parsedJson)) {
              result.workflow = parsedJson;
            } else {
              result[keyword] = parsedJson;
            }
          } catch (e) {
            result[keyword] = text;
          }
        }
      }
    }
  } catch (error) {
    // Fallback: use sharp
    try {
      const image = sharp(filePath);
      const metadata = await image.metadata();
      
      if (metadata.exif) {
        const jsonMatches = extractJsonPatterns(metadata.exif);
        
        for (const match of jsonMatches) {
          try {
            const parsed = JSON.parse(match);
            if (validateComfyUIWorkflow(parsed)) {
              result.workflow = parsed;
              break;
            }
          } catch (e) {
            // Continue to next match
          }
        }
      }
    } catch (fallbackError) {
      // Final fallback
    }
  }
  
  return Object.keys(result).length > 0 ? result : null;
}

async function extractFromJPEG(filePath: string): Promise<RawExtractionResult | null> {
  const result: any = {};
  
  // For WebP files, use sharp directly (exifr doesn't support WebP)
  if (isWebpFormat(filePath)) {
    return extractFromWebP(filePath);
  }
  
  try {
    // Use exifr to extract comprehensive EXIF data
    const exifData = await exifr.parse(filePath, {
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
    });
    
    if (exifData) {
      // Check common EXIF fields where ComfyUI data might be stored
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
      
      for (const field of fieldsToCheck) {
        const normalizedField = normalizeExifFieldName(field);
        const value = exifData[normalizedField] || exifData[field];
        if (value && typeof value === 'string') {
          // Try to parse as JSON directly
          try {
            const parsed = JSON.parse(value);
            if (validateComfyUIWorkflow(parsed)) {
              result.workflow = parsed;
              break;
            }
          } catch (e) {
            // Try to find JSON patterns in the string
            const jsonMatches = value.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g);
            if (jsonMatches) {
              for (const match of jsonMatches) {
                try {
                  const parsed = JSON.parse(match);
                  if (validateComfyUIWorkflow(parsed)) {
                    result.workflow = parsed;
                    break;
                  }
                } catch (e) {
                  // Continue to next match
                }
              }
              if (result.workflow) break;
            }
          }
        }
      }
      
      // Also check for parameters in specific formats used by various tools
      if (!result.workflow) {
        // Check for A1111-style parameters
        const imageDesc = exifData.ImageDescription || '';
        if (containsA1111Parameters(imageDesc)) {
          result.parameters = parseA1111Parameters(imageDesc);
        }
        
        // Check UTF-16 encoded UserComment field
        const userComment = exifData.userComment || exifData.UserComment;
        if (userComment) {
          const decodedComment = decodeUserComment(userComment);
          
          if (decodedComment) {
            // Check A1111 style parameters
            if (containsA1111Parameters(decodedComment)) {
              result.parameters = parseA1111Parameters(decodedComment);
              result.raw_parameters = decodedComment;
            } else if (decodedComment.includes('workflow') || decodedComment.includes('prompt')) {
              try {
                const parsed = JSON.parse(decodedComment);
                result.workflow = parsed;
              } catch (e) {
                result.metadata = decodedComment;
              }
            } else {
              // Save other metadata as well
              result.user_comment = decodedComment;
            }
          }
        }
      }
    }
  } catch (error) {
    // Fallback to sharp metadata extraction
    try {
      const sharpMetadata = await sharp(filePath).metadata();
      if (sharpMetadata.exif) {
        const jsonMatches = extractJsonPatterns(sharpMetadata.exif);
        
        for (const match of jsonMatches) {
          try {
            const parsed = JSON.parse(match);
            if (validateComfyUIWorkflow(parsed)) {
              result.workflow = parsed;
              break;
            }
          } catch (e) {
            // Continue
          }
        }
      }
    } catch (fallbackError) {
      // Final fallback
    }
  }
  
  return Object.keys(result).length > 0 ? result : null;
}

async function extractFromWebP(filePath: string): Promise<RawExtractionResult | null> {
  const result: any = {};
  
  try {
    // Use Sharp to extract EXIF data from WebP
    const metadata = await sharp(filePath).metadata();
    
    if (metadata.exif) {
      const exifString = metadata.exif.toString();
      
      // Look for User Comment field (text after UNICODE prefix)
      const textData = extractTextAfterUnicodePrefix(exifString);
      if (textData) {
        // Extract text from UTF-16LE format data
        const cleanText = extractTextFromUtf16Le(textData);
        
        if (cleanText && containsA1111Parameters(cleanText)) {
          result.parameters = parseA1111Parameters(cleanText);
          result.raw_parameters = cleanText;
        } else if (cleanText) {
          result.user_comment = cleanText;
        }
      }
    }
  } catch (error) {
    // Error handling
    console.error('WebP extraction error:', error);
  }
  
  return Object.keys(result).length > 0 ? result : null;
}