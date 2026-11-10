import { NotificationChannel, NotificationPayload } from '../types.js';

export class ConsoleNotificationChannel implements NotificationChannel {
  name: string;

  constructor(name = 'console') {
    this.name = name;
  }

  async notify(payload: NotificationPayload): Promise<boolean> {
    if (payload.event === 'PUBLISH_FAILED') {
      console.error(`[RELEASE ERROR] Release publish failed for tag ${payload.tagName}:`, {
        step: payload.stepName,
        error: payload.error?.message,
        rollback: payload.rollbackStatus,
        timestamp: payload.timestamp,
      });
    } else {
      console.log(`[RELEASE SUCCESS] Release publish succeeded for tag ${payload.tagName}`, {
        timestamp: payload.timestamp,
      });
    }
    return true;
  }
}

export class MockNotificationChannel implements NotificationChannel {
  name: string;
  public notifications: NotificationPayload[] = [];
  private shouldFail: boolean;

  constructor(name = 'mock', shouldFail = false) {
    this.name = name;
    this.shouldFail = shouldFail;
  }

  async notify(payload: NotificationPayload): Promise<boolean> {
    if (this.shouldFail) {
      throw new Error(`Notification channel ${this.name} failed to deliver message`);
    }
    this.notifications.push(payload);
    return true;
  }

  clear(): void {
    this.notifications = [];
  }
}

export interface WebhookOptions {
  timeoutMs?: number;
  allowInsecure?: boolean;
}

export class WebhookError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'WebhookError';
    this.status = status;
  }
}

export class WebhookNotificationChannel implements NotificationChannel {
  name: string;
  private webhookUrl: string;
  private fetchFn: typeof fetch;
  private timeoutMs: number;
  private allowInsecure: boolean;

  constructor(
    webhookUrl: string,
    nameOrOptions: string | WebhookOptions = 'webhook',
    fetchFn = globalThis.fetch,
    options: WebhookOptions = {}
  ) {
    let opts: WebhookOptions = options;
    if (typeof nameOrOptions === 'object' && nameOrOptions !== null) {
      opts = nameOrOptions;
      this.name = 'webhook';
    } else {
      this.name = nameOrOptions || 'webhook';
    }

    this.fetchFn = fetchFn;
    this.timeoutMs = opts.timeoutMs ?? 5000;
    this.allowInsecure = opts.allowInsecure ?? false;
    this.webhookUrl = this.validateAndSanitizeUrl(webhookUrl);
  }

  private validateAndSanitizeUrl(webhookUrl: string): string {
    let urlObj: URL;
    try {
      urlObj = new URL(webhookUrl);
    } catch {
      throw new Error(`Invalid webhook URL: '${webhookUrl}'`);
    }

    const protocol = urlObj.protocol.toLowerCase();
    const hostname = urlObj.hostname.toLowerCase();

    if (protocol !== 'https:' && protocol !== 'http:') {
      throw new Error(`Invalid webhook URL protocol '${protocol}'. Only HTTPS is allowed (or HTTP for localhost).`);
    }

    const isLocalhost =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname === '[::1]';

    if (protocol === 'http:') {
      if (!isLocalhost || !this.allowInsecure) {
        throw new Error(`HTTP is not allowed for webhook URL '${this.maskUrl(urlObj)}'. HTTPS is required.`);
      }
    }

    if (this.isPrivateOrLinkLocalIp(hostname, isLocalhost)) {
      throw new Error(`Private or link-local IP addresses are not allowed for webhook URL.`);
    }

    return urlObj.toString();
  }

  private isPrivateOrLinkLocalIp(hostname: string, isLocalhost: boolean): boolean {
    if (isLocalhost) {
      return !this.allowInsecure;
    }

    const cleanHost = hostname.replace(/^\[|\]$/g, '');

    const ipv4Match = cleanHost.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipv4Match) {
      const [, a, b, c, d] = ipv4Match.map(Number);
      if (a > 255 || b > 255 || c > 255 || d > 255) {
        return true;
      }
      if (a === 127) return true;
      if (a === 10) return true;
      if (a === 172 && b >= 16 && b <= 31) return true;
      if (a === 192 && b === 168) return true;
      if (a === 169 && b === 254) return true;
      if (a === 0) return true;
    }

    if (cleanHost.includes(':')) {
      const lower = cleanHost.toLowerCase();
      if (lower.startsWith('fe8') || lower.startsWith('fe9') || lower.startsWith('fea') || lower.startsWith('feb')) {
        return true;
      }
      if (lower.startsWith('fc') || lower.startsWith('fd')) {
        return true;
      }
      if (lower === '::1' || lower === '0:0:0:0:0:0:0:1') {
        return true;
      }
      if (lower.includes('::ffff:')) {
        const ipv4Part = lower.split('::ffff:')[1];
        if (ipv4Part && this.isPrivateOrLinkLocalIp(ipv4Part, false)) {
          return true;
        }
      }
    }

    return false;
  }

  private maskUrl(url: URL | string): string {
    try {
      const u = typeof url === 'string' ? new URL(url) : url;
      return `${u.protocol}//${u.host}/***`;
    } catch {
      return '[masked-url]';
    }
  }

  async notify(payload: NotificationPayload): Promise<boolean> {
    const controller = new AbortController();
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        controller.abort();
        reject(new WebhookError(`Webhook request timed out after ${this.timeoutMs}ms`));
      }, this.timeoutMs);

      if (timeoutId && typeof timeoutId === 'object' && 'unref' in timeoutId) {
        (timeoutId as any).unref();
      }
    });

    try {
      let signal = controller.signal;
      if (typeof AbortSignal !== 'undefined' && typeof (AbortSignal as any).timeout === 'function') {
        try {
          signal = (AbortSignal as any).timeout(this.timeoutMs);
        } catch {
          // Fallback to controller.signal
        }
      }

      const fetchPromise = (async () => {
        const response = await this.fetchFn(this.webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal,
        });

        if (!response.ok) {
          throw new WebhookError(`Webhook delivery failed with status ${response.status}`, response.status);
        }

        return true;
      })();

      return await Promise.race([fetchPromise, timeoutPromise]);
    } catch (err) {
      controller.abort();
      if (err instanceof WebhookError) {
        throw err;
      }
      const errorMsg = err instanceof Error ? err.message : String(err);
      throw new WebhookError(`Webhook delivery failed for ${this.maskUrl(this.webhookUrl)}: ${errorMsg}`);
    } finally {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
    }
  }
}

export class CompositeNotificationChannel implements NotificationChannel {
  name: string;
  private channels: NotificationChannel[];

  constructor(channels: NotificationChannel[], name = 'composite') {
    this.channels = channels;
    this.name = name;
  }

  async notify(payload: NotificationPayload): Promise<boolean> {
    const results = await Promise.allSettled(
      this.channels.map((channel) => channel.notify(payload))
    );
    return results.some((r) => r.status === 'fulfilled' && r.value === true);
  }
}
