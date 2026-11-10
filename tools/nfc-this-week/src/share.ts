import { Receipt, formatReceiptJson, createCsvFile } from './receipt';

export interface ShareOptions {
  filename?: string;
  onFallbackDownload?: (file: File) => void;
}

export interface ShareResult {
  success: boolean;
  method: 'web-share-files' | 'web-share-text' | 'download-fallback' | 'failed';
  userCancelled?: boolean;
  error?: Error;
}

/**
 * Checks whether navigator.canShare is available and supports sharing files.
 */
export function canShareReceiptWithFiles(receipt: Receipt, filename?: string): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.canShare !== 'function') {
    return false;
  }
  try {
    const file = createCsvFile(receipt, filename);
    return navigator.canShare({
      title: receipt.title || 'Receipt',
      text: formatReceiptJson(receipt),
      files: [file]
    });
  } catch {
    return false;
  }
}

/**
 * Checks whether Web Share API is available in current environment.
 */
export function isWebShareSupported(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}

/**
 * Executes receipt sharing:
 * 1. Checks if navigator.share + navigator.canShare supports files:
 *    navigator.share({ title: 'Receipt', text: JSON, files: [csvBlob/file] })
 * 2. If files sharing is not supported by device/browser, attempts text share.
 * 3. If Web Share API is not supported (e.g. desktop non-share browsers), falls back to CSV file download.
 */
export async function shareReceipt(
  receipt: Receipt,
  options?: ShareOptions
): Promise<ShareResult> {
  const title = receipt.title || 'Receipt';
  const text = formatReceiptJson(receipt);
  const csvFile = createCsvFile(receipt, options?.filename);

  if (isWebShareSupported()) {
    // Check if device/browser can share files
    const supportsFiles = canShareReceiptWithFiles(receipt, options?.filename);

    if (supportsFiles) {
      try {
        await navigator.share({
          title,
          text,
          files: [csvFile]
        });
        return { success: true, method: 'web-share-files' };
      } catch (err: unknown) {
        const error = err as Error;
        if (error.name === 'AbortError') {
          return { success: false, method: 'web-share-files', userCancelled: true };
        }
        // Fall back to text share or error
        return { success: false, method: 'web-share-files', error };
      }
    }

    // Attempt text-only share if files cannot be shared via navigator.share
    try {
      await navigator.share({
        title,
        text
      });
      return { success: true, method: 'web-share-text' };
    } catch (err: unknown) {
      const error = err as Error;
      if (error.name === 'AbortError') {
        return { success: false, method: 'web-share-text', userCancelled: true };
      }
      // If text share also failed, proceed to fallback
    }
  }

  // Fallback: trigger CSV download for platforms without Web Share API
  try {
    if (options?.onFallbackDownload) {
      options.onFallbackDownload(csvFile);
    } else if (typeof document !== 'undefined') {
      const url = URL.createObjectURL(csvFile);
      const a = document.createElement('a');
      a.href = url;
      a.download = csvFile.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    return { success: true, method: 'download-fallback' };
  } catch (err: unknown) {
    return { success: false, method: 'failed', error: err as Error };
  }
}
