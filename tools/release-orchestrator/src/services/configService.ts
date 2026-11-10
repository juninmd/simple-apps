export interface ConfigStatus {
  environment: string;
  autoReleaseEnabled: boolean;
  npmPublishingConfigured: boolean;
  pypiPublishingConfigured: boolean;
  notificationWebhookConfigured: boolean;
  monitoredRepository: string;
}

export class ConfigService {
  public getConfigStatus(): ConfigStatus {
    return {
      environment: process.env.NODE_ENV || 'development',
      autoReleaseEnabled: process.env.AUTO_RELEASE_ENABLED === 'true',
      npmPublishingConfigured: Boolean(process.env.NPM_TOKEN),
      pypiPublishingConfigured: Boolean(process.env.PYPI_TOKEN),
      notificationWebhookConfigured: Boolean(process.env.WEBHOOK_URL),
      monitoredRepository: process.env.MONITORED_REPO || 'owner/repo'
    };
  }
}

export const configService = new ConfigService();
