import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { join } from "node:path";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { FileResponseCache } from "../src/cache";
import type { ExtractionResult } from "../src/types";

describe("FileResponseCache", () => {
  let testCacheDir: string;
  let cache: FileResponseCache;

  beforeEach(async () => {
    testCacheDir = await mkdtemp(join(tmpdir(), "extract-acts-cache-test-"));
    cache = new FileResponseCache({ cacheDir: testCacheDir });
  });

  afterEach(async () => {
    await rm(testCacheDir, { recursive: true, force: true });
  });

  const sampleResult: ExtractionResult = {
    transcriptHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    extractedAt: "2026-01-01T00:00:00.000Z",
    model: "test-model-v1",
    items: [
      {
        id: "item-1",
        description: "Review quarterly roadmap",
        assignee: "Alice",
        completed: false,
      },
    ],
  };

  it("returns null on cache miss", async () => {
    const result = await cache.get("non-existent-hash");
    expect(result).toBeNull();
    expect(await cache.has("non-existent-hash")).toBeFalse();
  });

  it("saves and retrieves extraction results", async () => {
    await cache.set(sampleResult.transcriptHash, sampleResult);
    expect(await cache.has(sampleResult.transcriptHash)).toBeTrue();

    const retrieved = await cache.get(sampleResult.transcriptHash);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.transcriptHash).toBe(sampleResult.transcriptHash);
    expect(retrieved?.model).toBe("test-model-v1");
    expect(retrieved?.items).toHaveLength(1);
    expect(retrieved?.items[0].description).toBe("Review quarterly roadmap");
  });

  it("handles corrupted or malformed cache files gracefully", async () => {
    const filePath = join(testCacheDir, `${sampleResult.transcriptHash}.json`);
    await writeFile(filePath, "{ malformed json...", "utf8");

    const retrieved = await cache.get(sampleResult.transcriptHash);
    expect(retrieved).toBeNull();
    expect(await cache.has(sampleResult.transcriptHash)).toBeFalse();
  });

  it("clears cache directory completely", async () => {
    await cache.set(sampleResult.transcriptHash, sampleResult);
    expect(await cache.has(sampleResult.transcriptHash)).toBeTrue();

    await cache.clear();
    expect(await cache.has(sampleResult.transcriptHash)).toBeFalse();
  });
});
