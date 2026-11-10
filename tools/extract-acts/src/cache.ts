import { mkdir, readFile, rename, rm, unlink, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { randomUUID } from "node:crypto";
import type { CacheEntry, ExtractionResult, ResponseCache } from "./types";

export interface FileResponseCacheOptions {
  cacheDir?: string;
}

const CACHE_VERSION = 1;

/**
 * File-system based cache for LLM extraction results indexed by transcript hash.
 * Writes files atomically using a temporary file and atomic rename.
 */
export class FileResponseCache implements ResponseCache {
  private cacheDir: string;

  constructor(options: FileResponseCacheOptions = {}) {
    this.cacheDir = options.cacheDir ?? join(process.cwd(), ".cache", "extract-acts");
  }

  getCacheDir(): string {
    return this.cacheDir;
  }

  private getFilePath(hash: string): string {
    // Sanitize hash to avoid path traversal
    const safeHash = hash.replace(/[^a-f0-9]/gi, "");
    return join(this.cacheDir, `${safeHash}.json`);
  }

  async get(transcriptHash: string): Promise<ExtractionResult | null> {
    const filePath = this.getFilePath(transcriptHash);
    try {
      const content = await readFile(filePath, "utf8");
      const entry = JSON.parse(content) as CacheEntry;
      if (entry && entry.version === CACHE_VERSION && entry.data) {
        return entry.data;
      }
      return null;
    } catch (err: unknown) {
      const error = err as NodeJS.ErrnoException;
      if (error.code === "ENOENT") {
        return null;
      }
      // If file is corrupted or unreadable, treat as cache miss
      return null;
    }
  }

  async set(transcriptHash: string, result: ExtractionResult): Promise<void> {
    await mkdir(this.cacheDir, { recursive: true });
    const targetPath = this.getFilePath(transcriptHash);
    const tempPath = join(this.cacheDir, `.tmp-${randomUUID()}.json`);

    const entry: CacheEntry = {
      version: CACHE_VERSION,
      data: result,
    };

    const payload = JSON.stringify(entry, null, 2);

    try {
      await writeFile(tempPath, payload, "utf8");
      await rename(tempPath, targetPath);
    } catch (err) {
      try {
        await unlink(tempPath);
      } catch {
        // Ignore unlink failure if file never existed
      }
      throw err;
    }
  }

  async has(transcriptHash: string): Promise<boolean> {
    const cached = await this.get(transcriptHash);
    return cached !== null;
  }

  async clear(): Promise<void> {
    try {
      await rm(this.cacheDir, { recursive: true, force: true });
    } catch {
      // Ignore errors when directory does not exist
    }
  }
}
