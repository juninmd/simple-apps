/**
 * Status announcer for screen readers.
 * Uses a pre-mounted empty aria-live region to ensure assistive technologies detect the change.
 */
export class StatusAnnouncer {
  private announcerEl: HTMLElement | null;

  constructor(announcerId = 'status-announcer') {
    this.announcerEl = document.getElementById(announcerId);
  }

  /**
   * Announces a message to screen readers.
   * Clears existing message and updates textContent so screen readers re-announce if same or new message.
   */
  announce(message: string): void {
    if (!this.announcerEl) {
      return;
    }
    // Briefly clear and set message so consecutive identical announcements trigger properly
    this.announcerEl.textContent = '';
    window.setTimeout(() => {
      if (this.announcerEl) {
        this.announcerEl.textContent = message;
      }
    }, 50);
  }
}

export interface ReceiptItem {
  id: string;
  name: string;
  price: number;
  assignedTo: string; // 'all' or participant name
}

/**
 * Accessible Modal Dialog Controller
 * Implements WCAG 2.1 AA keyboard navigation, focus trap, Esc key closing,
 * and focus restoration.
 */
export class AccessibleModal {
  private backdropEl: HTMLElement;
  private dialogEl: HTMLElement;
  private triggerEl: HTMLElement | null = null;
  private announcer: StatusAnnouncer;
  private isOpen = false;

  private focusableSelector = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  constructor(backdropId: string, dialogId: string, announcer: StatusAnnouncer) {
    const backdrop = document.getElementById(backdropId);
    const dialog = document.getElementById(dialogId);
    if (!backdrop || !dialog) {
      throw new Error(`Modal elements ${backdropId} or ${dialogId} not found.`);
    }
    this.backdropEl = backdrop;
    this.dialogEl = dialog;
    this.announcer = announcer;

    this.bindEvents();
  }

  private bindEvents(): void {
    // Handle Escape key to close dialog
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (this.isOpen && e.key === 'Escape') {
        e.preventDefault();
        this.close();
      }
    });

    // Handle Tab focus trap inside modal dialog
    this.dialogEl.addEventListener('keydown', (e: KeyboardEvent) => {
      if (!this.isOpen || e.key !== 'Tab') {
        return;
      }
      this.handleFocusTrap(e);
    });

    // Handle backdrop click to close if clicked outside dialog
    this.backdropEl.addEventListener('click', (e: MouseEvent) => {
      if (e.target === this.backdropEl) {
        this.close();
      }
    });
  }

  private getFocusableElements(): HTMLElement[] {
    const nodes = this.dialogEl.querySelectorAll<HTMLElement>(this.focusableSelector);
    return Array.from(nodes).filter((el) => {
      return el.offsetParent !== null && !el.hasAttribute('disabled');
    });
  }

  private handleFocusTrap(e: KeyboardEvent): void {
    const focusable = this.getFocusableElements();
    if (focusable.length === 0) {
      e.preventDefault();
      this.dialogEl.focus();
      return;
    }

    const firstElement = focusable[0];
    const lastElement = focusable[focusable.length - 1];

    if (e.shiftKey) {
      // Shift + Tab: if on first element, wrap to last
      if (document.activeElement === firstElement || document.activeElement === this.dialogEl) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab: if on last element, wrap to first
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  }

  public open(trigger?: HTMLElement): void {
    if (this.isOpen) return;

    this.triggerEl = trigger || (document.activeElement as HTMLElement);
    this.isOpen = true;
    this.backdropEl.removeAttribute('hidden');

    if (this.triggerEl) {
      this.triggerEl.setAttribute('aria-expanded', 'true');
    }

    // Set initial focus to the first focusable element or the dialog card itself
    window.setTimeout(() => {
      const focusable = this.getFocusableElements();
      if (focusable.length > 0) {
        focusable[0].focus();
      } else {
        this.dialogEl.focus();
      }
    }, 20);

    this.announcer.announce('Receipt splitter dialog opened.');
  }

  public close(): void {
    if (!this.isOpen) return;

    this.isOpen = false;
    this.backdropEl.setAttribute('hidden', '');

    if (this.triggerEl) {
      this.triggerEl.setAttribute('aria-expanded', 'false');
      // Restore focus to trigger element that opened the dialog
      this.triggerEl.focus();
    }

    this.announcer.announce('Receipt splitter dialog closed.');
  }

  public getDialogElement(): HTMLElement {
    return this.dialogEl;
  }
}
