import { createHmac, timingSafeEqual } from "node:crypto";

// Verifies an HMAC-SHA256 signature over the raw body.
// Accepts GitHub-style ("sha256=<hex>") and bare-hex signatures.
export function verifyHmac(rawBody: string, secret: string, signature: string | undefined): boolean {
  if (!signature) return false;
  const provided = signature.startsWith("sha256=") ? signature.slice(7) : signature;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  if (provided.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(provided, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

// Exponential backoff schedule in ms for a given attempt (0-indexed).
export function backoffMs(attempt: number, baseMs = 500): number {
  return baseMs * 2 ** attempt;
}
