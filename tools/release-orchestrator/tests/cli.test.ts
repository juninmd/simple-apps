import { describe, it, expect, vi } from 'vitest';
import { parseArgs, runCli } from '../src/cli.js';

describe('CLI Argument Parsing', () => {
  it('should parse --dry-run flag correctly', () => {
    const opts = parseArgs(['--dry-run', '--target-version', '1.5.0']);
    expect(opts.dryRun).toBe(true);
    expect(opts.config?.targetVersion).toBe('1.5.0');
  });

  it('should parse -d flag as dry-run', () => {
    const opts = parseArgs(['-d', '-t', '0.9.0']);
    expect(opts.dryRun).toBe(true);
    expect(opts.config?.targetVersion).toBe('0.9.0');
  });

  it('should default dryRun to false when not provided', () => {
    const opts = parseArgs([]);
    expect(opts.dryRun).toBe(false);
  });

  it('should parse announcement URL and publish target flags', () => {
    const opts = parseArgs(['--announcement-url', 'https://discord.com/api/webhooks/123', '--pypi', '--no-npm']);
    expect(opts.config?.announcementUrl).toBe('https://discord.com/api/webhooks/123');
    expect(opts.config?.pypiPublish).toBe(true);
    expect(opts.config?.npmPublish).toBe(false);
  });

  it('should execute main in dry-run mode and log simulated output', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const exitCode = await runCli(['--dry-run', '-t', '3.0.0']);
    expect(exitCode).toBe(0);

    const logCalls = consoleSpy.mock.calls.flat().join('\n');
    expect(logCalls).toContain('DRY-RUN MODE ENABLED');
    expect(logCalls).toContain('[SIMULATED]');
    expect(logCalls).toContain('DRY-RUN SIMULATION COMPLETE');

    consoleSpy.mockRestore();
  });
});
