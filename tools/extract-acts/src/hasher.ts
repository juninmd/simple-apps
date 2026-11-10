import { createHash } from "node:crypto";

/**
 * Normalizes transcript text before hashing.
 * Strips carriage returns and trims leading/trailing whitespace.
 */
export function normalizeTranscript(text: string): string {
  return text.replace(/\r\n/g, "\n").trim();
}

/**
 * Computes deterministic SHA-256 hash of a meeting transcript.
 */
export function hashTranscript(text: string): string {
  const normalized = normalizeTranscript(text);
  return createHash("sha256").update(normalized, "utf8").digest("hex");
}
