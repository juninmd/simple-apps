import { test, expect } from "bun:test";
import { signSession, verifySession, safeEqual, verifyTotp } from "../src/auth";
import { createHmac } from "node:crypto";

const SECRET = "topsecret";

test("valid session verifies, expired does not", () => {
  const good = signSession(Date.now() + 10_000, SECRET);
  expect(verifySession(good, SECRET)).toBe(true);
  const expired = signSession(Date.now() - 1, SECRET);
  expect(verifySession(expired, SECRET)).toBe(false);
});

test("tampered signature is rejected", () => {
  const good = signSession(Date.now() + 10_000, SECRET);
  const tampered = good.slice(0, -1) + (good.at(-1) === "a" ? "b" : "a");
  expect(verifySession(tampered, SECRET)).toBe(false);
  expect(verifySession(good, "wrong-secret")).toBe(false);
});

test("verifySession handles junk input", () => {
  expect(verifySession(undefined, SECRET)).toBe(false);
  expect(verifySession("nodot", SECRET)).toBe(false);
  expect(verifySession(".", SECRET)).toBe(false);
});

test("safeEqual", () => {
  expect(safeEqual("abc", "abc")).toBe(true);
  expect(safeEqual("abc", "abd")).toBe(false);
  expect(safeEqual("abc", "abcd")).toBe(false);
});

// Reference TOTP: generate the expected code the same way and confirm acceptance.
function refTotp(secretB32: string, now: number): string {
  const alph = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const ch of secretB32.toUpperCase()) {
    const i = alph.indexOf(ch);
    if (i >= 0) bits += i.toString(2).padStart(5, "0");
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  const counter = Math.floor(now / 1000 / 30);
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const h = createHmac("sha1", Buffer.from(bytes)).update(buf).digest();
  const off = h[h.length - 1] & 0x0f;
  const code = ((h[off] & 0x7f) << 24) | (h[off + 1] << 16) | (h[off + 2] << 8) | h[off + 3];
  return (code % 1_000_000).toString().padStart(6, "0");
}

test("verifyTotp accepts a correct code and rejects a wrong one", () => {
  const secret = "JBSWY3DPEHPK3PXP"; // "Hello!" test vector base32
  const now = 1_700_000_000_000;
  expect(verifyTotp(refTotp(secret, now), secret, now)).toBe(true);
  expect(verifyTotp("000000", secret, now)).toBe(false);
  expect(verifyTotp("abc", secret, now)).toBe(false);
});
