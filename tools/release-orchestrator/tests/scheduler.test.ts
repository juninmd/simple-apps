import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  ReleaseScheduler,
  isValidCron,
  matchesCron,
} from '../src/scheduler.ts';
import { runCli } from '../src/cli.ts';

describe('isValidCron', () => {
  test('returns true for valid 5-part cron expressions', () => {
    assert.strictEqual(isValidCron('0 0 * * 0'), true);
    assert.strictEqual(isValidCron('*/15 * * * *'), true);
    assert.strictEqual(isValidCron('0 12 1 * *'), true);
    assert.strictEqual(isValidCron('0 0 1,15 * 1-5'), true);
    assert.strictEqual(isValidCron('30 2 * * 7'), true);
  });

  test('returns false for invalid cron expressions', () => {
    assert.strictEqual(isValidCron(''), false);
    assert.strictEqual(isValidCron('invalid'), false);
    assert.strictEqual(isValidCron('* * * *'), false); // Only 4 parts
    assert.strictEqual(isValidCron('* * * * * *'), false); // 6 parts
    assert.strictEqual(isValidCron('60 * * * *'), false); // Invalid minute
    assert.strictEqual(isValidCron('0 24 * * *'), false); // Invalid hour
    assert.strictEqual(isValidCron('0 0 32 * *'), false); // Invalid day of month
    assert.strictEqual(isValidCron('0 0 * 13 *'), false); // Invalid month
    assert.strictEqual(isValidCron('0 0 * * 8'), false); // Invalid day of week
  });
});

describe('matchesCron', () => {
  test('correctly matches date against weekly Sunday midnight cron (0 0 * * 0)', () => {
    // 2026-03-01 is a Sunday (00:00 UTC)
    const sundayMidnight = new Date('2026-03-01T00:00:00Z');
    assert.strictEqual(matchesCron('0 0 * * 0', sundayMidnight), true);

    // 2026-03-02 is a Monday (00:00 UTC)
    const mondayMidnight = new Date('2026-03-02T00:00:00Z');
    assert.strictEqual(matchesCron('0 0 * * 0', mondayMidnight), false);
  });

  test('matches step expressions like */15', () => {
    const min15 = new Date('2026-01-01T12:15:00Z');
    const min10 = new Date('2026-01-01T12:10:00Z');
    assert.strictEqual(matchesCron('*/15 * * * *', min15), true);
    assert.strictEqual(matchesCron('*/15 * * * *', min10), false);
  });

  test('matches range step expressions like 10-20/2', () => {
    const day10 = new Date('2026-01-10T12:00:00Z');
    const day11 = new Date('2026-01-11T12:00:00Z');
    const day12 = new Date('2026-01-12T12:00:00Z');
    assert.strictEqual(matchesCron('0 12 10-20/2 * *', day10), true);
    assert.strictEqual(matchesCron('0 12 10-20/2 * *', day11), false);
    assert.strictEqual(matchesCron('0 12 10-20/2 * *', day12), true);
  });

  test('matches range expressions like 1-5 for weekdays', () => {
    // 2026-03-02 is Monday (dow 1)
    const monday = new Date('2026-03-02T10:00:00Z');
    // 2026-03-01 is Sunday (dow 0)
    const sunday = new Date('2026-03-01T10:00:00Z');

    assert.strictEqual(matchesCron('0 10 * * 1-5', monday), true);
    assert.strictEqual(matchesCron('0 10 * * 1-5', sunday), false);
  });

  test('matches Sunday with dow 7 or 0', () => {
    const sunday = new Date('2026-03-01T00:00:00Z');
    assert.strictEqual(matchesCron('0 0 * * 7', sunday), true);
    assert.strictEqual(matchesCron('0 0 * * 0', sunday), true);
  });
});

describe('ReleaseScheduler', () => {
  test('initializes with default weekly schedule', () => {
    const scheduler = new ReleaseScheduler();
    assert.strictEqual(scheduler.getSchedule(), '0 0 * * 0');
    assert.strictEqual(scheduler.isEnabled(), true);
    assert.strictEqual(scheduler.getLastReleaseDate(), null);
  });

  test('throws error when initializing or setting invalid cron', () => {
    assert.throws(() => new ReleaseScheduler({ cronSchedule: 'invalid' }), /Invalid cron schedule/);
    const scheduler = new ReleaseScheduler();
    assert.throws(() => scheduler.setSchedule('bad cron'), /Invalid cron schedule/);
  });

  test('shouldRelease evaluates schedule correctly', () => {
    const scheduler = new ReleaseScheduler({ cronSchedule: '0 0 * * 0' });
    const sunday = new Date('2026-03-01T00:00:00Z');
    const monday = new Date('2026-03-02T00:00:00Z');

    assert.strictEqual(scheduler.shouldRelease(sunday), true);
    assert.strictEqual(scheduler.shouldRelease(monday), false);

    // Disable scheduler
    scheduler.setEnabled(false);
    assert.strictEqual(scheduler.shouldRelease(sunday), false);
  });

  test('prevents duplicate release within same minute window', () => {
    const scheduler = new ReleaseScheduler({ cronSchedule: '0 0 * * 0' });
    const sunday = new Date('2026-03-01T00:00:00Z');

    const result1 = scheduler.triggerRelease({ now: sunday });
    assert.strictEqual(result1.success, true);
    assert.strictEqual(scheduler.getLastReleaseDate()?.getTime(), sunday.getTime());

    // Attempting another trigger 30 seconds later
    const sundayPlus30s = new Date('2026-03-01T00:00:30Z');
    assert.strictEqual(scheduler.shouldRelease(sundayPlus30s), false);

    const result2 = scheduler.triggerRelease({ now: sundayPlus30s });
    assert.strictEqual(result2.success, false);
  });

  test('force flag overrides schedule and enabled status', () => {
    const scheduler = new ReleaseScheduler({ cronSchedule: '0 0 * * 0', enabled: false });
    const monday = new Date('2026-03-02T00:00:00Z');

    assert.strictEqual(scheduler.shouldRelease(monday), false);

    const forceResult = scheduler.triggerRelease({ force: true, now: monday });
    assert.strictEqual(forceResult.success, true);
    assert.strictEqual(forceResult.reason, 'Release triggered forcibly.');
  });
});

describe('CLI runCli', () => {
  test('handles --help option', () => {
    const code = runCli(['--help']);
    assert.strictEqual(code, 0);
  });

  test('handles --check-schedule option', () => {
    const code = runCli(['--check-schedule', '--cron', '0 0 * * 0']);
    assert.strictEqual(code, 0);
  });

  test('returns exit code 1 for invalid cron option', () => {
    const code = runCli(['--cron', 'invalid']);
    assert.strictEqual(code, 1);
  });

  test('handles --trigger --force options', () => {
    const code = runCli(['--cron', '0 0 * * 0', '--trigger', '--force']);
    assert.strictEqual(code, 0);
  });
});
