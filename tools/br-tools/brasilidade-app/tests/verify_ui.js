const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 900 });

  console.log('Navigating to http://localhost:8080 ...');
  await page.goto('http://localhost:8080');

  // Wait for state cards to render
  await page.waitForSelector('.state-card');

  // Verify cards for major states exist
  const cardCount = await page.locator('.state-card').count();
  console.log(`Rendered state cards: ${cardCount}`);

  // Take screenshot of main page galleries
  const screenshotPath = path.join(__dirname, '..', 'gallery_screenshot.png');
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log(`Saved screenshot to ${screenshotPath}`);

  // Test opening a gallery item lightbox
  console.log('Testing lightbox modal...');
  const firstItem = page.locator('.gallery-item').first();
  await firstItem.click();

  await page.waitForSelector('.modal.show');
  console.log('Modal opened successfully.');

  const modalScreenshotPath = path.join(__dirname, '..', 'modal_screenshot.png');
  await page.screenshot({ path: modalScreenshotPath });

  await browser.close();
  console.log('UI verification complete!');
})();
