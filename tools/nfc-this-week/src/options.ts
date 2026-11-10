import { Receipt, formatReceiptJson } from './receipt';
import { shareReceipt, ShareResult } from './share';

export const defaultReceipt: Receipt = {
  id: 'rec-20261104-01',
  title: 'Receipt',
  storeName: 'Padaria & Mercearia São José',
  date: '2026-11-04',
  items: [
    { id: '1', name: 'Pão de Queijo Tradicional', quantity: 6, unitPrice: 2.5, totalPrice: 15.0 },
    { id: '2', name: 'Café Expresso Duplo', quantity: 2, unitPrice: 6.0, totalPrice: 12.0 },
    { id: '3', name: 'Queijo Minas Frescal, Kg', quantity: 0.45, unitPrice: 38.0, totalPrice: 17.1 },
    { id: '4', name: 'Manteiga da Fazenda 200g', quantity: 1, unitPrice: 4.4, totalPrice: 4.4 }
  ],
  totalAmount: 48.5,
  currency: 'BRL',
  taxAmount: 3.2
};

export function renderReceipt(receipt: Receipt): void {
  const storeEl = document.getElementById('storeName');
  const dateEl = document.getElementById('receiptDate');
  const totalEl = document.getElementById('totalAmount');
  const tbodyEl = document.getElementById('itemsTableBody');
  const jsonEl = document.getElementById('jsonPreview');

  if (storeEl) storeEl.textContent = receipt.storeName;
  if (dateEl) dateEl.textContent = receipt.date;
  if (totalEl) totalEl.textContent = `R$ ${receipt.totalAmount.toFixed(2).replace('.', ',')}`;
  if (jsonEl) jsonEl.textContent = formatReceiptJson(receipt);

  if (tbodyEl) {
    tbodyEl.innerHTML = '';
    for (const item of receipt.items) {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${escapeHtml(item.name)}</td>
        <td>${item.quantity}</td>
        <td>R$ ${item.unitPrice.toFixed(2).replace('.', ',')}</td>
        <td>R$ ${item.totalPrice.toFixed(2).replace('.', ',')}</td>
      `;
      tbodyEl.appendChild(row);
    }
  }
}

function escapeHtml(str: string): string {
  const p = document.createElement('p');
  p.textContent = str;
  return p.innerHTML;
}

export function showStatus(message: string, type: 'success' | 'info' | 'warn'): void {
  const statusEl = document.getElementById('statusAlert');
  if (!statusEl) return;
  statusEl.className = `status-alert ${type}`;
  statusEl.textContent = message;
}

export async function handleShareClick(receipt: Receipt): Promise<ShareResult> {
  showStatus('Opening share dialog...', 'info');

  const result = await shareReceipt(receipt);

  if (result.success) {
    if (result.method === 'web-share-files') {
      showStatus('Receipt shared successfully with attached CSV file!', 'success');
    } else if (result.method === 'web-share-text') {
      showStatus('Receipt shared as text (file sharing not supported on this device).', 'info');
    } else if (result.method === 'download-fallback') {
      showStatus('Web Share API not available; receipt CSV downloaded instead.', 'info');
    }
  } else if (result.userCancelled) {
    showStatus('Sharing was cancelled.', 'warn');
  } else {
    showStatus(
      `Failed to share: ${result.error?.message || 'Unknown error occurred'}`,
      'warn'
    );
  }

  return result;
}

export function initOptionsPage(receipt: Receipt = defaultReceipt): void {
  renderReceipt(receipt);

  const shareBtn = document.getElementById('shareBtn');
  if (shareBtn) {
    shareBtn.addEventListener('click', () => {
      handleShareClick(receipt);
    });
  }
}

// Auto-initialize when in browser environment
if (typeof window !== 'undefined' && document.getElementById('shareBtn')) {
  initOptionsPage(defaultReceipt);
}
