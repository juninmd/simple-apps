import { describe, expect, it } from "bun:test";
import { hashTranscript, normalizeTranscript } from "../src/hasher";

describe("hasher", () => {
  it("normalizes carriage returns and trims whitespace", () => {
    const raw = "  hello world\r\nsecond line  \r\n";
    expect(normalizeTranscript(raw)).toBe("hello world\nsecond line");
  });

  it("produces deterministic SHA-256 hash for identical transcripts", () => {
    const text1 = "Alice: Let's ship caching.\nBob: I'll write the tests.";
    const text2 = "Alice: Let's ship caching.\nBob: I'll write the tests.";
    expect(hashTranscript(text1)).toBe(hashTranscript(text2));
    expect(hashTranscript(text1)).toHaveLength(64);
  });

  it("produces identical hashes across CRLF and LF variations", () => {
    const lf = "Line 1\nLine 2\nLine 3";
    const crlf = "Line 1\r\nLine 2\r\nLine 3\r\n";
    expect(hashTranscript(lf)).toBe(hashTranscript(crlf));
  });

  it("produces different hashes for different content", () => {
    const text1 = "Meeting A";
    const text2 = "Meeting B";
    expect(hashTranscript(text1)).not.toBe(hashTranscript(text2));
  });
});
