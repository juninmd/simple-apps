import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  shareReceipt,
  canShareReceiptWithFiles,
  ShareResult
} from '../src/share';
import { Receipt } from '../src/receipt';

describe('Web Share API service', () => {
  const sampleReceipt: Receipt = {
    id: 'rec-001',
    title: 'Receipt',
    storeName: 'Bakery Co.',
    date: '2026-11-04T10:00:00Z',
    items: [{ id: '1', name: 'Croissant', quantity: 1, unitPrice: 3.5, totalPrice: 3.5 }],
    totalAmount: 3.5
  };

  const originalNavigator = globalThis.navigator;

  afterEach(() => {
    Object.defineProperty(globalThis, 'navigator', {
      value: originalNavigator,
      configurable: true,
      writable: true
    });
    vi.restoreAllMocks();
  });

  it('shares receipt with title, text, and files when navigator.canShare supports files', async () => {
    const mockShare = vi.fn().mockResolvedValue(undefined);
    const mockCanShare = vi.fn().mockReturnValue(true);

    Object.defineProperty(globalThis, 'navigator', {
      value: {
        share: mockShare,
        canShare: mockCanShare
      },
      configurable: true,
      writable: true
    });

    expect(canShareReceiptWithFiles(sampleReceipt)).toBe(true);

    const result: ShareResult = await shareReceipt(sampleReceipt);

    expect(result.success).toBe(true);
    expect(result.method).toBe('web-share-files');
    expect(mockShare).toHaveBeenCalledTimes(1);

    const shareData = mockShare.mock.calls[0][0];
    expect(shareData.title).toBe('Receipt');
    expect(typeof shareData.text).toBe('string');
    expect(JSON.parse(shareData.text).id).toBe('rec-001');
    expect(shareData.files).toHaveLength(1);
    expect(shareData.files[0].name).toBe('receipt-rec-001.csv');
  });

  it('shares receipt without files if canShare returns false for files but share is available', async () => {
    const mockShare = vi.fn().mockResolvedValue(undefined);
    const mockCanShare = vi.fn().mockImplementation((data) => {
      // Accepts data without files, rejects data with files
      return !data.files;
    });

    Object.defineProperty(globalThis, 'navigator', {
      value: {
        share: mockShare,
        canShare: mockCanShare
      },
      configurable: true,
      writable: true
    });

    const result = await shareReceipt(sampleReceipt);

    expect(result.success).toBe(true);
    expect(result.method).toBe('web-share-text');
    expect(mockShare).toHaveBeenCalledTimes(1);
    const shareData = mockShare.mock.calls[0][0];
    expect(shareData.title).toBe('Receipt');
    expect(shareData.files).toBeUndefined();
  });

  it('handles user cancellation (AbortError) gracefully without reporting failure error', async () => {
    const abortError = new Error('Share cancelled');
    abortError.name = 'AbortError';

    const mockShare = vi.fn().mockRejectedValue(abortError);
    const mockCanShare = vi.fn().mockReturnValue(true);

    Object.defineProperty(globalThis, 'navigator', {
      value: {
        share: mockShare,
        canShare: mockCanShare
      },
      configurable: true,
      writable: true
    });

    const result = await shareReceipt(sampleReceipt);

    expect(result.success).toBe(false);
    expect(result.userCancelled).toBe(true);
    expect(result.method).toBe('web-share-files');
  });

  it('triggers fallback download when navigator.share is completely unsupported', async () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: {},
      configurable: true,
      writable: true
    });

    const mockFallback = vi.fn();
    const result = await shareReceipt(sampleReceipt, { onFallbackDownload: mockFallback });

    expect(result.success).toBe(true);
    expect(result.method).toBe('download-fallback');
    expect(mockFallback).toHaveBeenCalledTimes(1);
    expect(mockFallback.mock.calls[0][0].name).toBe('receipt-rec-001.csv');
  });
});
