import { describe, expect, it, vi } from 'vitest';
import {
  DefaultGitTagManager,
  MockNotificationChannel,
  PublishStep,
  ReleaseOrchestrator,
  WebhookNotificationChannel,
} from '../src/index.js';

describe('ReleaseOrchestrator', () => {
  it('should complete release successfully when publish step succeeds', async () => {
    const mockPublishStep: PublishStep = {
      name: 'npm-publish',
      execute: vi.fn().mockResolvedValue({ success: true, details: { pkg: 'my-lib' } }),
    };

    const mockTagManager = new DefaultGitTagManager(async () => ({
      stdout: '',
      stderr: '',
    }));
    vi.spyOn(mockTagManager, 'revertTag');

    const mockNotifier = new MockNotificationChannel();

    const orchestrator = new ReleaseOrchestrator({
      publishStep: mockPublishStep,
      tagManager: mockTagManager,
      notificationChannel: mockNotifier,
    });

    const result = await orchestrator.release('v1.0.0');

    expect(result.success).toBe(true);
    expect(result.published).toBe(true);
    expect(result.rolledBack).toBe(false);
    expect(result.notificationSent).toBe(true);
    expect(mockTagManager.revertTag).not.toHaveBeenCalled();

    expect(mockNotifier.notifications.length).toBe(1);
    expect(mockNotifier.notifications[0]).toMatchObject({
      event: 'PUBLISH_SUCCESS',
      tagName: 'v1.0.0',
      stepName: 'npm-publish',
    });
  });

  it('should automatically revert Git tag and send error notification when publish fails', async () => {
    const mockPublishStep: PublishStep = {
      name: 'npm-publish',
      execute: vi.fn().mockResolvedValue({ success: false, message: 'npm registry error 500' }),
    };

    const mockTagManager = new DefaultGitTagManager(async () => ({
      stdout: '',
      stderr: '',
    }));
    vi.spyOn(mockTagManager, 'revertTag').mockResolvedValue({
      success: true,
      tagName: 'v1.0.0',
      localDeleted: true,
      remoteDeleted: true,
    });

    const mockNotifier = new MockNotificationChannel();

    const orchestrator = new ReleaseOrchestrator({
      publishStep: mockPublishStep,
      tagManager: mockTagManager,
      notificationChannel: mockNotifier,
    });

    const result = await orchestrator.release('v1.0.0');

    expect(result.success).toBe(false);
    expect(result.published).toBe(false);
    expect(result.rolledBack).toBe(true);
    expect(result.notificationSent).toBe(true);
    expect(result.error?.message).toBe('npm registry error 500');

    expect(mockTagManager.revertTag).toHaveBeenCalledWith('v1.0.0', {
      deleteRemote: true,
      remoteName: 'origin',
    });

    expect(mockNotifier.notifications.length).toBe(1);
    const notification = mockNotifier.notifications[0];
    expect(notification.event).toBe('PUBLISH_FAILED');
    expect(notification.tagName).toBe('v1.0.0');
    expect(notification.stepName).toBe('npm-publish');
    expect(notification.error?.message).toBe('npm registry error 500');
    expect(notification.rollbackStatus).toEqual({
      attempted: true,
      reverted: true,
      details: 'Local tag deleted: true, Remote tag deleted: true',
    });
  });

  it('should handle publish step throwing an unhandled exception', async () => {
    const mockPublishStep: PublishStep = {
      name: 'pypi-publish',
      execute: vi.fn().mockRejectedValue(new Error('Network timeout')),
    };

    const mockTagManager = new DefaultGitTagManager(async () => ({
      stdout: '',
      stderr: '',
    }));
    vi.spyOn(mockTagManager, 'revertTag').mockResolvedValue({
      success: true,
      tagName: 'v2.0.0',
      localDeleted: true,
      remoteDeleted: true,
    });

    const mockNotifier = new MockNotificationChannel();

    const orchestrator = new ReleaseOrchestrator({
      publishStep: mockPublishStep,
      tagManager: mockTagManager,
      notificationChannel: mockNotifier,
    });

    const result = await orchestrator.release('v2.0.0');

    expect(result.success).toBe(false);
    expect(result.published).toBe(false);
    expect(result.rolledBack).toBe(true);
    expect(result.error?.message).toBe('Network timeout');

    expect(mockNotifier.notifications[0].event).toBe('PUBLISH_FAILED');
    expect(mockNotifier.notifications[0].error?.message).toBe('Network timeout');
  });

  it('should skip rollback when autoRollbackOnFailure is disabled', async () => {
    const mockPublishStep: PublishStep = {
      name: 'npm-publish',
      execute: vi.fn().mockResolvedValue({ success: false, message: 'Build failed' }),
    };

    const mockTagManager = new DefaultGitTagManager(async () => ({
      stdout: '',
      stderr: '',
    }));
    vi.spyOn(mockTagManager, 'revertTag');

    const mockNotifier = new MockNotificationChannel();

    const orchestrator = new ReleaseOrchestrator({
      publishStep: mockPublishStep,
      tagManager: mockTagManager,
      notificationChannel: mockNotifier,
      autoRollbackOnFailure: false,
    });

    const result = await orchestrator.release('v1.2.3');

    expect(result.success).toBe(false);
    expect(result.rolledBack).toBe(false);
    expect(mockTagManager.revertTag).not.toHaveBeenCalled();

    expect(mockNotifier.notifications[0].rollbackStatus).toEqual({
      attempted: false,
      reverted: false,
      details: 'Rollback disabled',
    });
  });

  it('should handle notification channel failures gracefully', async () => {
    const mockPublishStep: PublishStep = {
      name: 'npm-publish',
      execute: vi.fn().mockResolvedValue({ success: false, message: 'Publish error' }),
    };

    const mockTagManager = new DefaultGitTagManager(async () => ({
      stdout: '',
      stderr: '',
    }));
    vi.spyOn(mockTagManager, 'revertTag').mockResolvedValue({
      success: true,
      tagName: 'v1.0.0',
      localDeleted: true,
      remoteDeleted: true,
    });

    const failingNotifier = new MockNotificationChannel('failing', true);

    const orchestrator = new ReleaseOrchestrator({
      publishStep: mockPublishStep,
      tagManager: mockTagManager,
      notificationChannel: failingNotifier,
    });

    const result = await orchestrator.release('v1.0.0');

    expect(result.success).toBe(false);
    expect(result.rolledBack).toBe(true);
    expect(result.notificationSent).toBe(false);
    expect(result.notificationError?.message).toContain('failed to deliver message');
  });
});

describe('DefaultGitTagManager', () => {
  it('should execute local and remote delete commands when reverting tag', async () => {
    const executedCommands: string[][] = [];
    const execFn = async (file: string, args: string[]) => {
      executedCommands.push([file, ...args]);
      return { stdout: '', stderr: '' };
    };

    const tagManager = new DefaultGitTagManager(execFn);
    const result = await tagManager.revertTag('v1.0.0', {
      deleteRemote: true,
      remoteName: 'origin',
    });

    expect(result.success).toBe(true);
    expect(result.localDeleted).toBe(true);
    expect(result.remoteDeleted).toBe(true);
    expect(executedCommands).toEqual([
      ['git', 'tag', '-d', 'v1.0.0'],
      ['git', 'push', 'origin', '--delete', 'v1.0.0'],
    ]);
  });

  it('should check if tag exists', async () => {
    const execFn = async (file: string, args: string[]) => {
      if (args.includes('v1.0.0')) {
        return { stdout: 'v1.0.0\n', stderr: '' };
      }
      return { stdout: '', stderr: '' };
    };

    const tagManager = new DefaultGitTagManager(execFn);
    expect(await tagManager.tagExists('v1.0.0')).toBe(true);
    expect(await tagManager.tagExists('v2.0.0')).toBe(false);
  });
});

describe('WebhookNotificationChannel', () => {
  it('should send POST request to webhook url', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    const channel = new WebhookNotificationChannel('https://example.com/webhook', 'webhook', mockFetch as any);

    const success = await channel.notify({
      event: 'PUBLISH_FAILED',
      tagName: 'v1.0.0',
      timestamp: '2026-10-24T12:00:00Z',
    });

    expect(success).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith('https://example.com/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: expect.stringContaining('PUBLISH_FAILED'),
      signal: expect.any(AbortSignal),
    });
  });

  it('should reject http://example.com and accept https://hooks.example/x', () => {
    expect(() => new WebhookNotificationChannel('http://example.com')).toThrow();
    expect(() => new WebhookNotificationChannel('https://hooks.example/x')).not.toThrow();
  });

  it('should reject private IP and SSRF targets', () => {
    expect(() => new WebhookNotificationChannel('http://169.254.169.254/latest/meta-data')).toThrow();
    expect(() => new WebhookNotificationChannel('https://10.0.0.1/webhook')).toThrow();
    expect(() => new WebhookNotificationChannel('http://127.0.0.1/webhook')).toThrow();
  });

  it('should allow http://localhost only when allowInsecure is explicitly true', () => {
    expect(() => new WebhookNotificationChannel('http://localhost:3000/webhook')).toThrow();
    expect(
      () =>
        new WebhookNotificationChannel('http://localhost:3000/webhook', { allowInsecure: true })
    ).not.toThrow();
  });

  it('should time out and reject/return false within timeoutMs when fetchFn never resolves', async () => {
    const neverResolvingFetch = vi.fn().mockReturnValue(new Promise(() => {}));
    const channel = new WebhookNotificationChannel(
      'https://hooks.example/x',
      { timeoutMs: 50 },
      neverResolvingFetch as any
    );

    const start = Date.now();
    await expect(
      channel.notify({
        event: 'PUBLISH_FAILED',
        tagName: 'v1.0.0',
        timestamp: '2026-10-24T12:00:00Z',
      })
    ).rejects.toThrow(/timed out/i);
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(1000);
  });

  it('should result in an error with status 500 accessible to caller on 500 response', async () => {
    const mock500Fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    const channel = new WebhookNotificationChannel(
      'https://hooks.example/x',
      'webhook',
      mock500Fetch as any
    );

    let caughtError: any;
    try {
      await channel.notify({
        event: 'PUBLISH_FAILED',
        tagName: 'v1.0.0',
        timestamp: '2026-10-24T12:00:00Z',
      });
    } catch (err) {
      caughtError = err;
    }

    expect(caughtError).toBeDefined();
    expect(caughtError.status).toBe(500);
  });
});

describe('ReleaseOrchestrator Security & Payload Scrubbing', () => {
  it('should not include error.stack in failure payload by default', async () => {
    const mockPublishStep: PublishStep = {
      name: 'npm-publish',
      execute: vi.fn().mockRejectedValue(new Error('Publish failed with sensitive details')),
    };

    const mockTagManager = new DefaultGitTagManager(async () => ({
      stdout: '',
      stderr: '',
    }));
    vi.spyOn(mockTagManager, 'revertTag').mockResolvedValue({
      success: true,
      tagName: 'v1.0.0',
      localDeleted: true,
      remoteDeleted: true,
    });

    const mockNotifier = new MockNotificationChannel();

    const orchestrator = new ReleaseOrchestrator({
      publishStep: mockPublishStep,
      tagManager: mockTagManager,
      notificationChannel: mockNotifier,
    });

    await orchestrator.release('v1.0.0');

    expect(mockNotifier.notifications.length).toBe(1);
    const payload = mockNotifier.notifications[0];
    expect(payload.error?.message).toBe('Publish failed with sensitive details');
    expect(payload.error?.stack).toBeUndefined();
  });

  it('should include error.stack in failure payload when includeStack: true', async () => {
    const mockPublishStep: PublishStep = {
      name: 'npm-publish',
      execute: vi.fn().mockRejectedValue(new Error('Publish failed')),
    };

    const mockTagManager = new DefaultGitTagManager(async () => ({
      stdout: '',
      stderr: '',
    }));
    vi.spyOn(mockTagManager, 'revertTag').mockResolvedValue({
      success: true,
      tagName: 'v1.0.0',
      localDeleted: true,
      remoteDeleted: true,
    });

    const mockNotifier = new MockNotificationChannel();

    const orchestrator = new ReleaseOrchestrator({
      publishStep: mockPublishStep,
      tagManager: mockTagManager,
      notificationChannel: mockNotifier,
      includeStack: true,
    });

    await orchestrator.release('v1.0.0');

    expect(mockNotifier.notifications.length).toBe(1);
    const payload = mockNotifier.notifications[0];
    expect(payload.error?.stack).toBeDefined();
  });

  it('should truncate error.message to 2000 characters', async () => {
    const longMessage = 'A'.repeat(3000);
    const mockPublishStep: PublishStep = {
      name: 'npm-publish',
      execute: vi.fn().mockRejectedValue(new Error(longMessage)),
    };

    const mockTagManager = new DefaultGitTagManager(async () => ({
      stdout: '',
      stderr: '',
    }));
    vi.spyOn(mockTagManager, 'revertTag').mockResolvedValue({
      success: true,
      tagName: 'v1.0.0',
      localDeleted: true,
      remoteDeleted: true,
    });

    const mockNotifier = new MockNotificationChannel();

    const orchestrator = new ReleaseOrchestrator({
      publishStep: mockPublishStep,
      tagManager: mockTagManager,
      notificationChannel: mockNotifier,
    });

    await orchestrator.release('v1.0.0');

    expect(mockNotifier.notifications.length).toBe(1);
    const payload = mockNotifier.notifications[0];
    expect(payload.error?.message.length).toBe(2000);
  });
});
