import { describe, it, expect } from 'vitest';
import { runPipeline } from '../src/pipeline.js';

describe('Pipeline Dry-Run Mode', () => {
  it('should run all steps in simulation mode when dryRun is true', async () => {
    const result = await runPipeline({
      dryRun: true,
      config: {
        targetVersion: '1.2.3',
        announcementUrl: 'https://example.com/webhook',
        pypiPublish: true,
      },
    });

    expect(result.success).toBe(true);
    expect(result.dryRun).toBe(true);
    expect(result.steps.length).toBe(5);

    for (const step of result.steps) {
      expect(step.status).toBe('simulated');
      expect(step.details).toContain('[DRY-RUN]');
    }

    const tagStep = result.steps.find((s) => s.step === 'git-tag');
    expect(tagStep?.details).toContain('v1.2.3');

    const publishStep = result.steps.find((s) => s.step === 'publish');
    expect(publishStep?.details).toContain('npm, pypi');

    const announcementStep = result.steps.find((s) => s.step === 'announcement');
    expect(announcementStep?.details).toContain('https://example.com/webhook');
  });

  it('should run steps in executed mode when dryRun is false', async () => {
    const result = await runPipeline({
      dryRun: false,
      config: {
        targetVersion: '2.0.0',
        announcementUrl: 'https://example.com/webhook',
      },
    });

    expect(result.success).toBe(true);
    expect(result.dryRun).toBe(false);

    const tagStep = result.steps.find((s) => s.step === 'git-tag');
    expect(tagStep?.status).toBe('executed');
    expect(tagStep?.details).not.toContain('[DRY-RUN]');
  });

  it('should skip announcement if no URL is provided', async () => {
    const result = await runPipeline({
      dryRun: true,
    });

    const announcementStep = result.steps.find((s) => s.step === 'announcement');
    expect(announcementStep?.status).toBe('skipped');
  });
});
