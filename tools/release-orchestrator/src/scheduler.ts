export interface SchedulerConfig {
  cronSchedule?: string;
  enabled?: boolean;
  lastReleaseDate?: Date | null;
}

export interface TriggerResult {
  success: boolean;
  triggeredAt: Date;
  reason: string;
}

/**
 * Validates a 5-part cron expression.
 * Format: minute hour day-of-month month day-of-week
 */
export function isValidCron(cron: string): boolean {
  if (!cron || typeof cron !== 'string') return false;
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return false;

  const ranges = [
    { min: 0, max: 59 }, // minute
    { min: 0, max: 23 }, // hour
    { min: 1, max: 31 }, // day of month
    { min: 1, max: 12 }, // month
    { min: 0, max: 7 },  // day of week (0 and 7 are Sunday)
  ];

  return parts.every((part, i) => validateCronPart(part, ranges[i].min, ranges[i].max));
}

function validateCronPart(part: string, min: number, max: number): boolean {
  if (part === '*') return true;

  // Step syntax: */N or range/N
  if (part.includes('/')) {
    const [rangeStr, stepStr] = part.split('/');
    if (!/^\d+$/.test(stepStr)) return false;
    const step = parseInt(stepStr, 10);
    if (step <= 0) return false;
    if (rangeStr === '*') return true;
    return validateCronPart(rangeStr, min, max);
  }

  // List syntax: N,M,K
  if (part.includes(',')) {
    const items = part.split(',');
    return items.every((item) => validateCronPart(item, min, max));
  }

  // Range syntax: N-M
  if (part.includes('-')) {
    const [startStr, endStr] = part.split('-');
    if (!/^\d+$/.test(startStr) || !/^\d+$/.test(endStr)) return false;
    const start = parseInt(startStr, 10);
    const end = parseInt(endStr, 10);
    return start >= min && start <= max && end >= min && end <= max && start <= end;
  }

  // Exact number
  if (!/^\d+$/.test(part)) return false;
  const val = parseInt(part, 10);
  return val >= min && val <= max;
}

/**
 * Checks if a date matches a field in cron.
 */
function fieldMatches(part: string, val: number, min: number, max: number): boolean {
  if (part === '*') return true;

  if (part.includes('/')) {
    const [rangeStr, stepStr] = part.split('/');
    const step = parseInt(stepStr, 10);
    if (rangeStr === '*') {
      return (val - min) % step === 0;
    }
    if (rangeStr.includes('-')) {
      const [startStr, endStr] = rangeStr.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (val >= start && val <= end) {
        return (val - start) % step === 0;
      }
      return false;
    }
    if (fieldMatches(rangeStr, val, min, max)) {
      return (val - min) % step === 0;
    }
    return false;
  }

  if (part.includes(',')) {
    return part.split(',').some((item) => fieldMatches(item, val, min, max));
  }

  if (part.includes('-')) {
    const [startStr, endStr] = part.split('-');
    const start = parseInt(startStr, 10);
    const end = parseInt(endStr, 10);
    return val >= start && val <= end;
  }

  const exact = parseInt(part, 10);
  return exact === val;
}

/**
 * Checks if a given Date matches the 5-part cron expression (in UTC).
 */
export function matchesCron(cron: string, date: Date = new Date()): boolean {
  if (!isValidCron(cron)) return false;

  const parts = cron.trim().split(/\s+/);
  const minute = date.getUTCMinutes();
  const hour = date.getUTCHours();
  const dayOfMonth = date.getUTCDate();
  const month = date.getUTCMonth() + 1; // 1-12
  let dayOfWeek = date.getUTCDay(); // 0-6

  const dowPart = parts[4];
  const dowMatch =
    fieldMatches(dowPart, dayOfWeek, 0, 7) ||
    (dayOfWeek === 0 && fieldMatches(dowPart, 7, 0, 7));

  return (
    fieldMatches(parts[0], minute, 0, 59) &&
    fieldMatches(parts[1], hour, 0, 23) &&
    fieldMatches(parts[2], dayOfMonth, 1, 31) &&
    fieldMatches(parts[3], month, 1, 12) &&
    dowMatch
  );
}

export class ReleaseScheduler {
  private cronSchedule: string;
  private enabled: boolean;
  private lastReleaseDate: Date | null;

  constructor(config: SchedulerConfig = {}) {
    this.cronSchedule = config.cronSchedule || '0 0 * * 0'; // Default: Weekly on Sunday 00:00 UTC
    if (!isValidCron(this.cronSchedule)) {
      throw new Error(`Invalid cron schedule expression: ${this.cronSchedule}`);
    }
    this.enabled = config.enabled !== undefined ? config.enabled : true;
    this.lastReleaseDate = config.lastReleaseDate || null;
  }

  public getSchedule(): string {
    return this.cronSchedule;
  }

  public setSchedule(cron: string): void {
    if (!isValidCron(cron)) {
      throw new Error(`Invalid cron schedule expression: ${cron}`);
    }
    this.cronSchedule = cron;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  public getLastReleaseDate(): Date | null {
    return this.lastReleaseDate;
  }

  /**
   * Determines if a release is due to run at the given time (`now`).
   */
  public shouldRelease(now: Date = new Date()): boolean {
    if (!this.enabled) return false;

    if (!matchesCron(this.cronSchedule, now)) {
      return false;
    }

    if (this.lastReleaseDate) {
      // Don't trigger if already released in the same minute window
      const timeDiffMs = now.getTime() - this.lastReleaseDate.getTime();
      if (timeDiffMs < 60000) {
        return false;
      }
    }

    return true;
  }

  /**
   * Triggers a scheduled release if due, or if `force` option is set.
   */
  public triggerRelease(options: { force?: boolean; now?: Date } = {}): TriggerResult {
    const now = options.now || new Date();
    const force = !!options.force;

    if (!this.enabled && !force) {
      return {
        success: false,
        triggeredAt: now,
        reason: 'Release scheduler is disabled.',
      };
    }

    if (!force && !this.shouldRelease(now)) {
      return {
        success: false,
        triggeredAt: now,
        reason: `Current time ${now.toISOString()} does not match cron schedule '${this.cronSchedule}' or release was already run recently.`,
      };
    }

    this.lastReleaseDate = now;
    return {
      success: true,
      triggeredAt: now,
      reason: force
        ? 'Release triggered forcibly.'
        : `Release triggered on schedule '${this.cronSchedule}'.`,
    };
  }
}
