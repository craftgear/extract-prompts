import { statSync } from 'fs';
import { VideoMetadata } from '../types';

interface CacheEntry {
  metadata: VideoMetadata;
  mtime: number;
  size: number;
}

class MetadataCache {
  private cache = new Map<string, CacheEntry>();
  private maxSize = 100; // メモリ使用量を制限するためキャッシュエントリの最大数

  // ファイルが変更されているかチェック
  private isFileChanged(filePath: string, cachedEntry: CacheEntry): boolean {
    try {
      const stats = statSync(filePath);
      return stats.mtime.getTime() !== cachedEntry.mtime || stats.size !== cachedEntry.size;
    } catch {
      return true; // ファイルが存在しない場合は変更されたとみなす
    }
  }

  // キャッシュからメタデータを取得
  get(filePath: string): VideoMetadata | null {
    const entry = this.cache.get(filePath);
    if (!entry) {
      return null;
    }

    // ファイルが変更されているかチェック
    if (this.isFileChanged(filePath, entry)) {
      this.cache.delete(filePath);
      return null;
    }

    return entry.metadata;
  }

  // メタデータをキャッシュに保存
  set(filePath: string, metadata: VideoMetadata): void {
    try {
      const stats = statSync(filePath);

      // キャッシュサイズの制限をチェック
      if (this.cache.size >= this.maxSize) {
        // 最も古いエントリを削除（LRU風）
        const firstKey = this.cache.keys().next().value;
        if (firstKey) {
          this.cache.delete(firstKey);
        }
      }

      this.cache.set(filePath, {
        metadata,
        mtime: stats.mtime.getTime(),
        size: stats.size,
      });
    } catch {
      // statに失敗した場合はキャッシュしない
    }
  }

  // キャッシュをクリア
  clear(): void {
    this.cache.clear();
  }

  // キャッシュのサイズを取得
  size(): number {
    return this.cache.size;
  }

  // 特定のファイルのキャッシュを削除
  delete(filePath: string): boolean {
    return this.cache.delete(filePath);
  }
}

// シングルトンインスタンス
export const metadataCache = new MetadataCache();