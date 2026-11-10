import { StatusAnnouncer, AccessibleModal, ReceiptItem } from './popup.ts';

document.addEventListener('DOMContentLoaded', () => {
  const announcer = new StatusAnnouncer('status-announcer');
  const modal = new AccessibleModal('dialog-backdrop', 'receipt-dialog', announcer);

  // Application state
  let participants: string[] = ['Alice', 'Bob'];
  let items: ReceiptItem[] = [];

  // DOM Elements
  const openBtn = document.getElementById('open-scanner-btn') as HTMLButtonElement;
  const closeBtn = document.getElementById('close-dialog-btn') as HTMLButtonElement;
  const dismissBtn = document.getElementById('dismiss-dialog-btn') as HTMLButtonElement;
  const scanBtn = document.getElementById('scan-receipt-btn') as HTMLButtonElement;
  const resetBtn = document.getElementById('reset-receipt-btn') as HTMLButtonElement;
  const addParticipantBtn = document.getElementById('add-participant-btn') as HTMLButtonElement;
  const participantInput = document.getElementById('participant-name-input') as HTMLInputElement;
  const chipsContainer = document.getElementById('participants-chips') as HTMLElement;
  const itemsTbody = document.getElementById('items-tbody') as HTMLElement;
  const calcBtn = document.getElementById('calculate-split-btn') as HTMLButtonElement;
  const summaryContent = document.getElementById('summary-content') as HTMLElement;

  // Open/Close bindings
  openBtn.addEventListener('click', () => {
    modal.open(openBtn);
  });

  closeBtn.addEventListener('click', () => {
    modal.close();
  });

  dismissBtn.addEventListener('click', () => {
    modal.close();
  });

  // Render participants
  function renderParticipants(): void {
    chipsContainer.innerHTML = '';
    participants.forEach((name) => {
      const chip = document.createElement('div');
      chip.className = 'chip';
      chip.innerHTML = `
        <span>${escapeHtml(name)}</span>
        <button
          type="button"
          class="chip-remove-btn"
          aria-label="Remove ${escapeHtml(name)} from bill"
          data-name="${escapeHtml(name)}"
        >
          &times;
        </button>
      `;
      chipsContainer.appendChild(chip);
    });

    // Re-attach remove listeners
    const removeBtns = chipsContainer.querySelectorAll<HTMLButtonElement>('.chip-remove-btn');
    removeBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const nameToRemove = btn.getAttribute('data-name');
        if (nameToRemove) {
          participants = participants.filter((p) => p !== nameToRemove);
          renderParticipants();
          renderItems();
          announcer.announce(`Removed ${nameToRemove}. ${participants.length} participants remaining.`);
        }
      });
    });
  }

  // Add participant
  addParticipantBtn.addEventListener('click', () => {
    const name = participantInput.value.trim();
    if (!name) {
      announcer.announce('Please enter a participant name.');
      participantInput.focus();
      return;
    }
    if (participants.map((p) => p.toLowerCase()).includes(name.toLowerCase())) {
      announcer.announce(`Participant ${name} already added.`);
      participantInput.focus();
      return;
    }

    participants.push(name);
    participantInput.value = '';
    renderParticipants();
    renderItems();
    announcer.announce(`Added participant ${name}. Total participants: ${participants.length}.`);
  });

  // Handle Enter on participant input
  participantInput.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addParticipantBtn.click();
    }
  });

  // Render items
  function renderItems(): void {
    if (items.length === 0) {
      itemsTbody.innerHTML = `
        <tr>
          <td colspan="3" class="empty-state">No receipt scanned yet. Click "Scan Receipt" to load receipt data.</td>
        </tr>
      `;
      return;
    }

    itemsTbody.innerHTML = '';
    items.forEach((item, index) => {
      const tr = document.createElement('tr');
      const selectId = `assign-select-${index}`;

      const options = ['all', ...participants]
        .map((p) => {
          const label = p === 'all' ? 'Everyone (Shared)' : p;
          const selected = item.assignedTo === p ? 'selected' : '';
          return `<option value="${escapeHtml(p)}" ${selected}>${escapeHtml(label)}</option>`;
        })
        .join('');

      tr.innerHTML = `
        <td><strong>${escapeHtml(item.name)}</strong></td>
        <td>$${item.price.toFixed(2)}</td>
        <td>
          <label for="${selectId}" class="sr-only">Assign ${escapeHtml(item.name)} to</label>
          <select id="${selectId}" class="item-assign-select" data-id="${item.id}">
            ${options}
          </select>
        </td>
      `;
      itemsTbody.appendChild(tr);
    });

    // Attach select change listeners
    const selects = itemsTbody.querySelectorAll<HTMLSelectElement>('.item-assign-select');
    selects.forEach((select) => {
      select.addEventListener('change', () => {
        const itemId = select.getAttribute('data-id');
        const found = items.find((i) => i.id === itemId);
        if (found) {
          found.assignedTo = select.value;
          const assignedText = select.value === 'all' ? 'Everyone' : select.value;
          announcer.announce(`Assigned ${found.name} to ${assignedText}.`);
        }
      });
    });
  }

  // Scan receipt simulation
  scanBtn.addEventListener('click', () => {
    items = [
      { id: '1', name: 'Artisan Sourdough Pizza', price: 18.5, assignedTo: 'all' },
      { id: '2', name: 'Craft IPA Beer', price: 7.0, assignedTo: 'Alice' },
      { id: '3', name: 'Sparkling Mineral Water', price: 4.5, assignedTo: 'Bob' },
      { id: '4', name: 'Tiramisu Dessert', price: 9.0, assignedTo: 'all' },
    ];
    renderItems();
    announcer.announce(`Receipt scanned successfully. 4 items found. Total $39.00.`);
  });

  // Reset items
  resetBtn.addEventListener('click', () => {
    items = [];
    renderItems();
    summaryContent.innerHTML = `<p>Scan a receipt and assign participants to see the per-person split breakdown.</p>`;
    announcer.announce('Receipt items have been reset.');
  });

  // Calculate split
  calcBtn.addEventListener('click', () => {
    if (items.length === 0) {
      announcer.announce('Cannot calculate bill split: No items in receipt.');
      return;
    }
    if (participants.length === 0) {
      announcer.announce('Cannot calculate bill split: Please add at least one participant.');
      return;
    }

    const totals: Record<string, number> = {};
    participants.forEach((p) => {
      totals[p] = 0;
    });

    let receiptTotal = 0;
    items.forEach((item) => {
      receiptTotal += item.price;
      if (item.assignedTo === 'all') {
        const perPerson = item.price / participants.length;
        participants.forEach((p) => {
          totals[p] += perPerson;
        });
      } else if (totals[item.assignedTo] !== undefined) {
        totals[item.assignedTo] += item.price;
      } else {
        // Fallback to everyone if participant was removed
        const perPerson = item.price / participants.length;
        participants.forEach((p) => {
          totals[p] += perPerson;
        });
      }
    });

    const listItems = Object.entries(totals)
      .map(([name, amount]) => `<li><span>${escapeHtml(name)}:</span> <strong>$${amount.toFixed(2)}</strong></li>`)
      .join('');

    summaryContent.innerHTML = `
      <p><strong>Total Bill:</strong> $${receiptTotal.toFixed(2)}</p>
      <ul>
        ${listItems}
      </ul>
    `;

    announcer.announce(`Split calculation complete. Bill total is $${receiptTotal.toFixed(2)}.`);
  });

  // Helper escape
  function escapeHtml(str: string): string {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Initial render
  renderParticipants();
});
