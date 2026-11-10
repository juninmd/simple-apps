import { describe, beforeEach, afterAll, it, expect, vi } from 'vitest';
import { ConfigService } from '../src/services/configService';

describe('ConfigService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should return default config when environment variables are unset', () => {
    delete process.env.NODE_ENV;
    delete process.env.AUTO_RELEASE_ENABLED;
    delete process.env.NPM_TOKEN;
    delete process.env.PYPI_TOKEN;
    delete process.env.WEBHOOK_URL;
    delete process.env.MONITORED_REPO;

    const service = new ConfigService();
    const config = service.getConfigStatus();

    expect(config).toEqual({
      environment: 'development',
      autoReleaseEnabled: false,
      npmPublishingConfigured: false,
      pypiPublishingConfigured: false,
      notificationWebhookConfigured: false,
      monitoredRepository: 'owner/repo'
    });
  });

  it('should reflect env variables when set', () => {
    process.env.NODE_ENV = 'production';
    process.env.AUTO_RELEASE_ENABLED = 'true';
    process.env.NPM_TOKEN = 'secret-npm-token';
    process.env.PYPI_TOKEN = 'secret-pypi-token';
    process.env.WEBHOOK_URL = 'https://discord.com/api/webhooks/123';
    process.env.MONITORED_REPO = 'myorg/myrepo';

    const service = new ConfigService();
    const config = service.getConfigStatus();

    expect(config).toEqual({
      environment: 'production',
      autoReleaseEnabled: true,
      npmPublishingConfigured: true,
      pypiPublishingConfigured: true,
      notificationWebhookConfigured: true,
      monitoredRepository: 'myorg/myrepo'
    });
  });
});
