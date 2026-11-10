export interface KeyState {
  key: string;
  maskedKey: string;
  failureCount: number;
  rateLimitedUntil: number; // timestamp in ms
  isInvalid: boolean; // 401 / 403 permanent failure
}

export interface KeyRotatorOptions {
  keys: string[];
  cooldownMs?: number; // default: 60,000 ms (1 minute)
  onRotate?: (info: { previousKey: string; nextKey: string; reason: string }) => void;
}

export class KeyRotationExhaustedError extends Error {
  constructor(
    message: string,
    public readonly totalKeys: number,
  ) {
    super(message);
    this.name = "KeyRotationExhaustedError";
  }
}

/**
 * Mask an API key for safe logging (e.g., "abcd...1234").
 */
export function maskKey(key: string): string {
  if (!key) return "";
  const trimmed = key.trim();
  if (trimmed.length <= 8) {
    return "***";
  }
  return `${trimmed.slice(0, 4)}...${trimmed.slice(-4)}`;
}

/**
 * Manages automatic key rotation across multiple API keys.
 * Handles:
 * - Round-robin distribution
 * - Temporary cool-off on 429 (Rate Limit)
 * - Permanent marking of invalid keys on 401 (Unauthorized) / 403 (Forbidden)
 * - Safe logging without leaking secret values
 */
export class KeyRotator {
  private keyStates: KeyState[];
  private currentIndex = 0;
  private cooldownMs: number;
  private onRotate?: (info: { previousKey: string; nextKey: string; reason: string }) => void;

  constructor(options: KeyRotatorOptions) {
    const rawKeys = options.keys.map((k) => k.trim()).filter(Boolean);
    if (rawKeys.length === 0) {
      throw new Error("KeyRotator requires at least one API key.");
    }

    this.cooldownMs = options.cooldownMs ?? 60_000;
    this.onRotate = options.onRotate;
    this.keyStates = rawKeys.map((key) => ({
      key,
      maskedKey: maskKey(key),
      failureCount: 0,
      rateLimitedUntil: 0,
      isInvalid: false,
    }));
  }

  public get totalKeys(): number {
    return this.keyStates.length;
  }

  public get activeKeyCount(): number {
    const now = Date.now();
    return this.keyStates.filter((k) => !k.isInvalid && k.rateLimitedUntil <= now).length;
  }

  /**
   * Returns the current key to use, or rotates to the next available one.
   * Throws KeyRotationExhaustedError if all keys are invalid or rate-limited.
   */
  public getKey(): string {
    const now = Date.now();
    const total = this.keyStates.length;

    // First check if current key is valid and not rate-limited
    const current = this.keyStates[this.currentIndex];
    if (current && !current.isInvalid && current.rateLimitedUntil <= now) {
      return current.key;
    }

    // Try finding the next usable key
    for (let i = 1; i <= total; i++) {
      const candidateIndex = (this.currentIndex + i) % total;
      const candidate = this.keyStates[candidateIndex];
      if (candidate && !candidate.isInvalid && candidate.rateLimitedUntil <= now) {
        this.currentIndex = candidateIndex;
        return candidate.key;
      }
    }

    // If all are invalid or in cooldown, check if any is just in cooldown
    const cooldownRemaining = this.keyStates
      .filter((k) => !k.isInvalid && k.rateLimitedUntil > now)
      .map((k) => k.rateLimitedUntil - now);

    if (cooldownRemaining.length > 0) {
      const minWait = Math.min(...cooldownRemaining);
      throw new KeyRotationExhaustedError(
        `All ${total} keys are currently rate-limited. Earliest cooldown finishes in ${Math.ceil(minWait / 1000)}s.`,
        total,
      );
    }

    throw new KeyRotationExhaustedError(
      `All ${total} keys have been marked as invalid (401/403). No usable keys remaining.`,
      total,
    );
  }

  /**
   * Reports an HTTP error status code for the current key and rotates to the next available key.
   */
  public reportFailure(status: number, customCooldownMs?: number): string {
    const current = this.keyStates[this.currentIndex];
    if (!current) {
      throw new KeyRotationExhaustedError("No key available to report failure.", this.totalKeys);
    }

    const prevMasked = current.maskedKey;
    const now = Date.now();

    let reason: string;
    if (status === 401 || status === 403) {
      current.isInvalid = true;
      current.failureCount += 1;
      reason = `HTTP ${status} (Invalid API Key)`;
    } else if (status === 429) {
      const duration = customCooldownMs ?? this.cooldownMs;
      current.rateLimitedUntil = now + duration;
      current.failureCount += 1;
      reason = `HTTP 429 (Rate Limited for ${Math.ceil(duration / 1000)}s)`;
    } else {
      current.failureCount += 1;
      reason = `HTTP ${status} (Request Failure)`;
    }

    // Try rotating to next usable key
    const total = this.keyStates.length;
    let foundIndex = -1;

    for (let i = 1; i < total; i++) {
      const candidateIndex = (this.currentIndex + i) % total;
      const candidate = this.keyStates[candidateIndex];
      if (candidate && !candidate.isInvalid && candidate.rateLimitedUntil <= now) {
        foundIndex = candidateIndex;
        break;
      }
    }

    if (foundIndex !== -1) {
      this.currentIndex = foundIndex;
      const next = this.keyStates[foundIndex];
      if (next) {
        this.onRotate?.({
          previousKey: prevMasked,
          nextKey: next.maskedKey,
          reason,
        });
        return next.key;
      }
    }

    // No immediate key available
    throw new KeyRotationExhaustedError(
      `Key ${prevMasked} failed with ${reason}. No remaining active keys available.`,
      total,
    );
  }

  /**
   * Manually rotate to the next key regardless of status (e.g. for load balancing).
   */
  public rotateNext(reason = "manual rotation"): string {
    const prev = this.keyStates[this.currentIndex];
    const prevMasked = prev ? prev.maskedKey : "unknown";
    const total = this.keyStates.length;
    const now = Date.now();

    for (let i = 1; i <= total; i++) {
      const nextIndex = (this.currentIndex + i) % total;
      const candidate = this.keyStates[nextIndex];
      if (candidate && !candidate.isInvalid && candidate.rateLimitedUntil <= now) {
        this.currentIndex = nextIndex;
        this.onRotate?.({
          previousKey: prevMasked,
          nextKey: candidate.maskedKey,
          reason,
        });
        return candidate.key;
      }
    }

    return this.getKey();
  }

  /**
   * Resets failure statistics and rate limits.
   */
  public reset(): void {
    for (const state of this.keyStates) {
      state.failureCount = 0;
      state.rateLimitedUntil = 0;
      state.isInvalid = false;
    }
    this.currentIndex = 0;
  }
}
