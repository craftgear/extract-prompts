import { Decoder } from 'ts-ebml';
import { readFileSync } from 'fs';
import { VideoMetadata } from '../types';

export async function extractWebMMetadata(filePath: string): Promise<VideoMetadata | null> {
  try {
    const buffer = readFileSync(filePath);
    const decoder = new Decoder();
    const elms = decoder.decode(buffer);

    const metadata: VideoMetadata = {
      format: {
        filename: filePath,
        format_name: 'matroska,webm',
        duration: '0',
        size: buffer.length.toString(),
        bit_rate: '0',
        tags: {}
      },
      streams: []
    };

    // EBML要素を解析してメタデータを抽出
    let segmentDuration = 0;
    let timecodeScale = 1000000; // デフォルト値

    for (const elm of elms) {
      const element = elm as any;
      switch (element.name) {
        case 'TimecodeScale':
          if (element.value && typeof element.value === 'number') {
            timecodeScale = element.value;
          }
          break;
        case 'Duration':
          if (element.value && typeof element.value === 'number') {
            segmentDuration = element.value;
          }
          break;
        case 'Title':
          if (element.value && typeof element.value === 'string' && metadata.format && metadata.format.tags) {
            metadata.format.tags['title'] = element.value;
          }
          break;
        case 'Tags':
          // Tagsセクションの処理
          if (element.children) {
            for (const tagElm of element.children) {
              if (tagElm.name === 'Tag' && tagElm.children) {
                let tagName = '';
                let tagValue = '';

                for (const simpleTag of tagElm.children) {
                  if (simpleTag.name === 'SimpleTag' && simpleTag.children) {
                    for (const child of simpleTag.children) {
                      if (child.name === 'TagName' && child.value) {
                        tagName = child.value.toString();
                      } else if (child.name === 'TagString' && child.value) {
                        tagValue = child.value.toString();
                      }
                    }
                  }
                }

                if (tagName && tagValue && metadata.format && metadata.format.tags) {
                  // ComfyUIワークフローに関連する可能性のあるタグを探す
                  const lowercaseName = tagName.toLowerCase();
                  if (lowercaseName.includes('comment') ||
                      lowercaseName.includes('description') ||
                      lowercaseName.includes('workflow') ||
                      lowercaseName.includes('comfyui')) {
                    metadata.format.tags[tagName] = tagValue;
                  }
                }
              }
            }
          }
          break;
        case 'TrackEntry':
          // トラック情報の処理
          if (element.children) {
            const track: any = {
              index: 0,
              codec_name: '',
              codec_type: 'unknown',
              r_frame_rate: '30/1',
              duration: '0',
              tags: {}
            };

            for (const trackChild of element.children) {
              switch (trackChild.name) {
                case 'TrackNumber':
                  if (trackChild.value) track.index = Number(trackChild.value);
                  break;
                case 'TrackType':
                  if (trackChild.value) {
                    const type = Number(trackChild.value);
                    if (type === 1) track.codec_type = 'video';
                    else if (type === 2) track.codec_type = 'audio';
                    else if (type === 17) track.codec_type = 'subtitle';
                  }
                  break;
                case 'CodecID':
                  if (trackChild.value) {
                    track.codec_name = trackChild.value.toString();
                    track.codec_long_name = trackChild.value.toString();
                  }
                  break;
                case 'Video':
                  if ((trackChild as any).children) {
                    for (const videoChild of (trackChild as any).children) {
                      if (videoChild.name === 'PixelWidth' && videoChild.value) {
                        track.width = Number(videoChild.value);
                      }
                      if (videoChild.name === 'PixelHeight' && videoChild.value) {
                        track.height = Number(videoChild.value);
                      }
                    }
                  }
                  break;
              }
            }

            if (metadata.streams) {
              metadata.streams.push(track);
            }
          }
          break;
      }
    }

    // 持続時間を計算
    if (segmentDuration > 0 && metadata.format) {
      const durationInSeconds = (segmentDuration * timecodeScale) / 1000000000;
      metadata.format.duration = durationInSeconds.toString();

      if (metadata.streams) {
        for (const stream of metadata.streams) {
          stream.duration = durationInSeconds.toString();
        }
      }
    }

    return metadata;

  } catch (error) {
    throw new Error(`WebM/MKV parsing error: ${(error as Error).message}`);
  }
}