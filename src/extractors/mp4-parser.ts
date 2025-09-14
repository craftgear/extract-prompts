import { createFile, MP4Info } from 'mp4box';
import { readFileSync } from 'fs';
import { VideoMetadata } from '../types';

export async function extractMP4Metadata(filePath: string): Promise<VideoMetadata | null> {
  return new Promise((resolve, reject) => {
    try {
      const buffer = readFileSync(filePath);
      const arrayBuffer = buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength
      );

      const mp4boxFile = createFile();

      mp4boxFile.onReady = (info: MP4Info) => {
        // MP4のメタデータを変換してVideoMetadata形式に合わせる
        const metadata: VideoMetadata = {
          format: {
            filename: filePath,
            format_name: 'mov,mp4,m4a,3gp,3g2,mj2',
            duration: (info.duration / info.timescale).toString(),
            size: buffer.length.toString(),
            bit_rate: '0',
            tags: {}
          },
          streams: info.tracks.map(track => ({
            index: track.id,
            codec_name: track.codec,
            codec_type: track.type,
            width: track.type === 'video' ? (track as any).video?.width : undefined,
            height: track.type === 'video' ? (track as any).video?.height : undefined,
            r_frame_rate: '30/1',
            duration: (track.duration / track.timescale).toString(),
            tags: {}
          }))
        };

        // udta (user data) の処理でメタデータタグを探す
        if (info.udta && metadata.format && metadata.format.tags) {
          for (const box of info.udta) {
            if (box.type === 'meta' && box.data) {
              // metaボックス内のデータを解析してComfyUIワークフローを探す
              try {
                const dataString = new TextDecoder().decode(box.data);
                const potentialFields = ['comment', 'description', 'workflow', 'comfyui', 'ComfyUI'];

                for (const field of potentialFields) {
                  if (dataString.includes(field)) {
                    // JSONパターンを探す
                    const jsonMatch = dataString.match(/\{[\s\S]*?\}/);
                    if (jsonMatch) {
                      metadata.format!.tags![field] = jsonMatch[0];
                    }
                  }
                }
              } catch {
                // JSON解析エラーは無視
              }
            }
          }
        }

        resolve(metadata);
      };

      mp4boxFile.onError = (error: string) => {
        reject(new Error(`MP4 parsing error: ${error}`));
      };

      // ArrayBufferを処理用にmp4boxに渡す
      (arrayBuffer as any).fileStart = 0;
      (mp4boxFile as any).appendBuffer(arrayBuffer);
      (mp4boxFile as any).flush();

    } catch (error) {
      reject(error);
    }
  });
}