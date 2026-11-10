import { describe, expect, it, vi } from "vitest";
import { KeyRotationExhaustedError, KeyRotator, maskKey } from "../src/providers/key-rotator.js";

describe("maskKey", () => {
  it("masks sensitive api keys correctly", () => {
    expect(maskKey("")).toBe("");
    expect(maskKey("short")).toBe("***");
    expect(maskKey("12345678")).toBe("***");
    expect(maskKey("1234567890abcdef")).toBe("1234...cdef");
    expect(maskKey("  secret_api_key_123456  ")).toBe("secr...3456");
  });
});

describe("KeyRotator", () => {
  it("initializes with multiple keys and rotates through them", () => {
    const keys = ["key-1", "key-2", "key-3"];
    const rotator = new KeyRotator({ keys });

    expect(rotator.totalKeys).toBe(3);
    expect(rotator.activeKeyCount).toBe(3);
    expect(rotator.getKey()).toBe("key-1");

    // Manually rotate
    expect(rotator.rotateNext()).toBe("key-2");
    expect(rotator.rotateNext()).toBe("key-3");
    expect(rotator.rotateNext()).toBe("key-1");
  });

  it("marks key invalid permanently on 401 Unauthorized", () => {
    const keys = ["key-1", "key-2"];
    const onRotate = vi.fn();
    const rotator = new KeyRotator({ keys, onRotate });

    expect(rotator.getKey()).toBe("key-1");

    // Report 401 on key-1
    const nextKey = rotator.reportFailure(401);
    expect(nextKey).toBe("key-2");
    expect(rotator.getKey()).toBe("key-2");
    expect(rotator.activeKeyCount).toBe(1);
    expect(onRotate).toHaveBeenCalledWith(
      expect.objectContaining({
        previousKey: "***",
        nextKey: "***",
        reason: "HTTP 401 (Invalid API Key)",
      }),
    );

    // If key-2 also reports 401, exhaustion error is thrown
    expect(() => rotator.reportFailure(401)).toThrow(KeyRotationExhaustedError);
    expect(rotator.activeKeyCount).toBe(0);
  });

  it("handles 429 rate limit cooldown and skips key until cooldown expires", () => {
    vi.useFakeTimers();
    const keys = ["key-1", "key-2"];
    const rotator = new KeyRotator({ keys, cooldownMs: 10_000 });

    expect(rotator.getKey()).toBe("key-1");

    // Report 429 on key-1
    const nextKey = rotator.reportFailure(429);
    expect(nextKey).toBe("key-2");
    expect(rotator.getKey()).toBe("key-2");
    expect(rotator.activeKeyCount).toBe(1);

    // Advance time by 11 seconds (past cooldown)
    vi.advanceTimersByTime(11_000);
    expect(rotator.activeKeyCount).toBe(2);

    vi.useRealTimers();
  });

  it("throws KeyRotationExhaustedError with cooldown duration when all keys are rate-limited", () => {
    vi.useFakeTimers();
    const keys = ["key-1", "key-2"];
    const rotator = new KeyRotator({ keys, cooldownMs: 10_000 });

    rotator.reportFailure(429); // key-1 rate limited, currentIndex becomes key-2 (index 1)
    expect(() => rotator.reportFailure(429)).toThrow(KeyRotationExhaustedError);

    expect(() => rotator.getKey()).toThrow(/rate-limited/i);

    // Advance time by 10s
    vi.advanceTimersByTime(10_000);
    // currentIndex was on index 1 (key-2) when key-2 failed, so getKey() checks currentIndex first
    expect(rotator.getKey()).toBe("key-2");

    vi.useRealTimers();
  });

  it("throws when initialized with empty keys array", () => {
    expect(() => new KeyRotator({ keys: [] })).toThrow(/at least one API key/);
    expect(() => new KeyRotator({ keys: ["   ", ""] })).toThrow(/at least one API key/);
  });
});
