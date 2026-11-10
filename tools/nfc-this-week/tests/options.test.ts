// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  renderReceipt,
  handleShareClick,
  showStatus,
  defaultReceipt
} from '../src/options';
import * as shareModule from '../src/share';

describe('Options page interactions', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="storeName"></div>
      <div id="receiptDate"></div>
      <div id="totalAmount"></div>
      <table><tbody id="itemsTableBody"></tbody></table>
      <pre id="jsonPreview"></pre>
      <button id="shareBtn"></button>
      <div id="statusAlert"></div>
    `;
  });

  it('renders receipt data onto DOM elements', () => {
    renderReceipt(defaultReceipt);

    expect(document.getElementById('storeName')?.textContent).toBe('Padaria & Mercearia São José');
    expect(document.getElementById('receiptDate')?.textContent).toBe('2026-11-04');
    expect(document.getElementById('totalAmount')?.textContent).toContain('48,50');
    expect(document.getElementById('itemsTableBody')?.children.length).toBe(4);
    expect(document.getElementById('jsonPreview')?.textContent).toContain('rec-20261104-01');
  });

  it('updates status element correctly with showStatus', () => {
    showStatus('Test message', 'success');
    const status = document.getElementById('statusAlert');
    expect(status?.textContent).toBe('Test message');
    expect(status?.className).toBe('status-alert success');
  });

  it('handles share click with successful web-share-files', async () => {
    vi.spyOn(shareModule, 'shareReceipt').mockResolvedValue({
      success: true,
      method: 'web-share-files'
    });

    const res = await handleShareClick(defaultReceipt);
    expect(res.success).toBe(true);
    expect(document.getElementById('statusAlert')?.textContent).toContain('attached CSV file');
  });

  it('handles share cancellation', async () => {
    vi.spyOn(shareModule, 'shareReceipt').mockResolvedValue({
      success: false,
      userCancelled: true,
      method: 'web-share-files'
    });

    const res = await handleShareClick(defaultReceipt);
    expect(res.userCancelled).toBe(true);
    expect(document.getElementById('statusAlert')?.textContent).toBe('Sharing was cancelled.');
  });
});
