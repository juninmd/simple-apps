// @vitest-environment jsdom

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Dashboard Frontend XSS Prevention', () => {
  beforeEach(() => {
    const html = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');
    document.documentElement.innerHTML = html;
  });

  it('escapes XSS payloads from API response and does not inject elements', async () => {
    const xssPayload = '<img src=x onerror=alert(1)>';
    const scriptPayload = '<script>alert("xss")</script>';

    const mockConfig = {
      environment: xssPayload,
      autoReleaseEnabled: true,
      npmPublishingConfigured: true,
      pypiPublishingConfigured: false,
      monitoredRepository: xssPayload
    };

    const mockPending = [
      {
        version: '1.0.0',
        tag: scriptPayload,
        targetBranch: xssPayload,
        changesCount: '5',
        scheduledAt: 'invalid-date'
      }
    ];

    const mockHistory = {
      data: [
        {
          version: '1.0.0',
          status: 'SUCCESS',
          releasedAt: '2026-10-25T12:00:00Z',
          publishedTargets: [xssPayload],
          changelogSummary: scriptPayload
        }
      ],
      page: 1,
      totalPages: 2
    };

    global.fetch = vi.fn((url: string | URL | Request) => {
      const urlStr = url.toString();
      if (urlStr.includes('/api/config')) {
        return Promise.resolve({
          json: () => Promise.resolve(mockConfig)
        } as Response);
      }
      if (urlStr.includes('/api/pending')) {
        return Promise.resolve({
          json: () => Promise.resolve(mockPending)
        } as Response);
      }
      if (urlStr.includes('/api/history')) {
        return Promise.resolve({
          json: () => Promise.resolve(mockHistory)
        } as Response);
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });

    const appJsCode = fs.readFileSync(path.join(__dirname, '../public/app.js'), 'utf8');
    eval(appJsCode);

    document.dispatchEvent(new Event('DOMContentLoaded'));

    await new Promise((resolve) => setTimeout(resolve, 50));

    const imgTags = document.querySelectorAll('#config-content img, #pending-content img, #history-content img');
    expect(imgTags.length).toBe(0);

    const injectedScriptTags = document.querySelectorAll('#config-content script, #pending-content script, #history-content script');
    expect(injectedScriptTags.length).toBe(0);

    const configContainer = document.getElementById('config-content');
    expect(configContainer?.textContent).toContain('<img src=x onerror=alert(1)>');

    const pendingContainer = document.getElementById('pending-content');
    expect(pendingContainer?.textContent).toContain('<script>alert("xss")</script>');
    expect(pendingContainer?.textContent).toContain('5 commits');
    expect(pendingContainer?.textContent).toContain('-');

    const historyContainer = document.getElementById('history-content');
    expect(historyContainer?.textContent).toContain('<script>alert("xss")</script>');

    const paginationControls = document.getElementById('pagination-controls');
    const buttons = paginationControls?.querySelectorAll('button');
    expect(buttons && buttons.length).toBeGreaterThan(0);
    buttons?.forEach((btn) => {
      expect(btn.hasAttribute('onclick')).toBe(false);
    });
  });
});
