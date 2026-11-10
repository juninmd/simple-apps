import { describe, expect, it, mock } from "bun:test";
import { OfflineCacheMissError, TranscriptExtractor } from "../src/extractor";
import { hashTranscript } from "../src/hasher";
import type { ExtractedItem, ExtractionResult, LLMClient, ResponseCache } from "../src/types";

class InMemoryCache implements ResponseCache {
  public store = new Map<string, ExtractionResult>();

  async get(hash: string): Promise<ExtractionResult | null> {
    return this.store.get(hash) ?? null;
  }

  async set(hash: string, result: ExtractionResult): Promise<void> {
    this.store.set(hash, result);
  }

  async has(hash: string): Promise<boolean> {
    return this.store.has(hash);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }
}

describe("TranscriptExtractor", () => {
  const dummyItems: ExtractedItem[] = [
    {
      id: "1",
      description: "Implement response caching",
      assignee: "Jules",
      completed: false,
    },
  ];

  it("calls LLM on cache miss and populates cache", async () => {
    const cache = new InMemoryCache();
    const extractMock = mock(async (_t: string) => ({
      model: "gpt-mock",
      items: dummyItems,
    }));
    const llmClient: LLMClient = { extract: extractMock };

    const extractor = new TranscriptExtractor(cache, llmClient);
    const transcript = "Alice: Jules will implement caching.";

    const event = await extractor.extract(transcript);

    expect(event.source).toBe("llm");
    expect(event.result.items).toEqual(dummyItems);
    expect(extractMock).toHaveBeenCalledTimes(1);

    // Verify it is now cached
    expect(await cache.has(event.hash)).toBeTrue();
  });

  it("returns cached result on cache hit without invoking LLM", async () => {
    const cache = new InMemoryCache();
    const extractMock = mock(async (_t: string) => ({
      model: "gpt-mock",
      items: dummyItems,
    }));
    const llmClient: LLMClient = { extract: extractMock };

    const extractor = new TranscriptExtractor(cache, llmClient);
    const transcript = "Alice: Jules will implement caching.";

    // First call: populates cache
    await extractor.extract(transcript);
    expect(extractMock).toHaveBeenCalledTimes(1);

    // Second call: should hit cache
    const secondEvent = await extractor.extract(transcript);
    expect(secondEvent.source).toBe("cache");
    expect(secondEvent.result.items).toEqual(dummyItems);
    // LLM should NOT have been called again
    expect(extractMock).toHaveBeenCalledTimes(1);
  });

  it("bypasses cache when noCache is set", async () => {
    const cache = new InMemoryCache();
    const extractMock = mock(async (_t: string) => ({
      model: "gpt-mock",
      items: dummyItems,
    }));
    const llmClient: LLMClient = { extract: extractMock };

    const extractor = new TranscriptExtractor(cache, llmClient);
    const transcript = "Alice: Jules will implement caching.";

    await extractor.extract(transcript);
    expect(extractMock).toHaveBeenCalledTimes(1);

    // Call with noCache: true
    const event = await extractor.extract(transcript, { noCache: true });
    expect(event.source).toBe("llm");
    expect(extractMock).toHaveBeenCalledTimes(2);
  });

  it("enables offline replay without an LLM client for cached transcripts", async () => {
    const cache = new InMemoryCache();
    const transcript = "Bob: Deploy to production.";
    const realHash = hashTranscript(transcript);

    // Seed cache
    await cache.set(realHash, {
      transcriptHash: realHash,
      extractedAt: new Date().toISOString(),
      model: "cached-model",
      items: dummyItems,
    });

    // Extractor without LLM client
    const extractor = new TranscriptExtractor(cache);

    const replayEvent = await extractor.extract(transcript, { offlineReplay: true });
    expect(replayEvent.source).toBe("cache");
    expect(replayEvent.result.items).toEqual(dummyItems);
    expect(replayEvent.result.model).toBe("cached-model");
  });

  it("throws OfflineCacheMissError when offline replay has no cache", async () => {
    const cache = new InMemoryCache();
    const extractor = new TranscriptExtractor(cache);

    expect(
      extractor.extract("Unseen meeting transcript", { offlineReplay: true }),
    ).rejects.toThrow(OfflineCacheMissError);
  });
});
