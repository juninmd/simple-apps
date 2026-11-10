import { createHmac, timingSafeEqual } from "node:crypto";

// ---- signed session cookie: base64url(payload).hex(hmac) ----
export function signSession(exp: number, secret: string): string {
  const payload = Buffer.from(JSON.stringify({ exp })).toString("base64url");
  const sig = createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export function verifySession(cookie: string | undefined, secret: string, now = Date.now()): boolean {
  if (!cookie) return false;
  const dot = cookie.lastIndexOf(".");
  if (dot < 1) return false;
  const payload = cookie.slice(0, dot);
  const sig = cookie.slice(dot + 1);
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  if (sig.length !== expected.length) return false;
  if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(payload, "base64url").toString());
    return typeof exp === "number" && exp > now;
  } catch {
    return false;
  }
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

// ---- TOTP (RFC 6238, SHA-1, 6 digits, 30s) ----
function base32Decode(s: string): Buffer {
  const alph = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const clean = s.toUpperCase().replace(/=+$/, "").replace(/\s/g, "");
  let bits = "";
  for (const ch of clean) {
    const idx = alph.indexOf(ch);
    if (idx === -1) continue;
    bits += idx.toString(2).padStart(5, "0");
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

function hotp(secret: Buffer, counter: number): string {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const hmac = createHmac("sha1", secret).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code = ((hmac[offset] & 0x7f) << 24) | (hmac[offset + 1] << 16) | (hmac[offset + 2] << 8) | hmac[offset + 3];
  return (code % 1_000_000).toString().padStart(6, "0");
}

// Accepts the current step ±1 to tolerate clock skew.
export function verifyTotp(token: string, base32Secret: string, now = Date.now()): boolean {
  if (!/^\d{6}$/.test(token)) return false;
  const secret = base32Decode(base32Secret);
  const step = Math.floor(now / 1000 / 30);
  for (let w = -1; w <= 1; w++) {
    if (safeEqual(token, hotp(secret, step + w))) return true;
  }
  return false;
}
