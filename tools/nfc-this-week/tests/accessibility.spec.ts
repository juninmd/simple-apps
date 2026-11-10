import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility & WCAG 2.1 AA Conformance', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Main page has zero axe-core accessibility violations', async ({ page }) => {
    const axeResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(axeResults.violations).toEqual([]);
  });

  test('Open modal dialog has zero axe-core accessibility violations', async ({ page }) => {
    // Open the popup modal
    await page.click('#open-scanner-btn');
    await expect(page.locator('#receipt-dialog')).toBeVisible();

    // Verify axe-core violations on the full page including open dialog
    const axeResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(axeResults.violations).toEqual([]);
  });

  test('Modal dialog with scanned receipt and calculated split has zero axe-core violations', async ({ page }) => {
    await page.click('#open-scanner-btn');
    await page.click('#scan-receipt-btn');
    await page.click('#calculate-split-btn');

    // Run axe on full loaded state
    const axeResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(axeResults.violations).toEqual([]);
  });

  test('Popup dialog follows WAI-ARIA modal dialog specifications', async ({ page }) => {
    const openBtn = page.locator('#open-scanner-btn');
    await expect(openBtn).toHaveAttribute('aria-haspopup', 'dialog');
    await expect(openBtn).toHaveAttribute('aria-expanded', 'false');

    await openBtn.click();
    await expect(openBtn).toHaveAttribute('aria-expanded', 'true');

    const dialog = page.locator('#receipt-dialog');
    await expect(dialog).toHaveAttribute('role', 'dialog');
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    await expect(dialog).toHaveAttribute('aria-labelledby', 'dialog-title');
    await expect(dialog).toHaveAttribute('aria-describedby', 'dialog-desc');
  });

  test('Keyboard navigation: Tab, Shift+Tab focus trapping within modal dialog', async ({ page }) => {
    const openBtn = page.locator('#open-scanner-btn');
    await openBtn.focus();
    await page.keyboard.press('Enter'); // Open with keyboard

    const dialog = page.locator('#receipt-dialog');
    await expect(dialog).toBeVisible();

    // The first focusable element inside the dialog is the close button
    const closeBtn = page.locator('#close-dialog-btn');
    await expect(closeBtn).toBeFocused();

    // Press Shift+Tab on the first focusable element -> wraps around to the last focusable element (dismiss button)
    await page.keyboard.press('Shift+Tab');
    const dismissBtn = page.locator('#dismiss-dialog-btn');
    await expect(dismissBtn).toBeFocused();

    // Press Tab on the last element -> wraps back to the first element
    await page.keyboard.press('Tab');
    await expect(closeBtn).toBeFocused();
  });

  test('Keyboard navigation: Escape key dismisses dialog and restores focus to trigger button', async ({ page }) => {
    const openBtn = page.locator('#open-scanner-btn');
    await openBtn.focus();
    await page.keyboard.press('Space'); // Open with Space key

    const dialog = page.locator('#receipt-dialog');
    await expect(dialog).toBeVisible();

    // Press Escape
    await page.keyboard.press('Escape');

    // Dialog should be hidden
    await expect(page.locator('#dialog-backdrop')).toHaveAttribute('hidden', '');
    // Focus must be restored to trigger button
    await expect(openBtn).toBeFocused();
    await expect(openBtn).toHaveAttribute('aria-expanded', 'false');
  });

  test('Screen-reader live region status announcements exist and update properly', async ({ page }) => {
    const announcer = page.locator('#status-announcer');
    await expect(announcer).toHaveAttribute('role', 'status');
    await expect(announcer).toHaveAttribute('aria-live', 'polite');
    await expect(announcer).toHaveAttribute('aria-atomic', 'true');

    // Open dialog -> status announced
    await page.click('#open-scanner-btn');
    await expect(announcer).toHaveText('Receipt splitter dialog opened.');

    // Scan receipt -> status announced
    await page.click('#scan-receipt-btn');
    await expect(announcer).toHaveText('Receipt scanned successfully. 4 items found. Total $39.00.');

    // Add participant -> status announced
    await page.fill('#participant-name-input', 'Charlie');
    await page.click('#add-participant-btn');
    await expect(announcer).toHaveText('Added participant Charlie. Total participants: 3.');

    // Calculate split -> status announced
    await page.click('#calculate-split-btn');
    await expect(announcer).toHaveText('Split calculation complete. Bill total is $39.00.');

    // Close dialog -> status announced
    await page.keyboard.press('Escape');
    await expect(announcer).toHaveText('Receipt splitter dialog closed.');
  });

  test('High-contrast forced-colors mode styles are applied and valid', async ({ page }) => {
    // Emulate forced-colors: active
    await page.emulateMedia({ forcedColors: 'active' });
    await page.click('#open-scanner-btn');
    const dialog = page.locator('#receipt-dialog');
    await expect(dialog).toBeVisible();

    // Verify dialog border rule under forced colors
    const borderWidth = await dialog.evaluate((el) => {
      return window.getComputedStyle(el).borderWidth;
    });
    expect(borderWidth).toBe('3px');

    // Run axe rules that apply under forced colors (excluding synthetic color-contrast since forced-colors is an OS override)
    const axeResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .disableRules(['color-contrast'])
      .analyze();

    expect(axeResults.violations).toEqual([]);
  });
});
