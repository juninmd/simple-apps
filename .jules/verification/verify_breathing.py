from playwright.sync_api import Page, expect, sync_playwright

def test_zen_breather(page: Page):
    # 1. Go to the app
    page.goto("http://localhost:8081")

    # 2. Check title
    expect(page.get_by_text("Zen Breather 🧘")).to_be_visible(timeout=30000)

    # 3. Check Start button
    start_btn = page.get_by_role("button", name="Start")
    expect(start_btn).to_be_visible()

    # 4. Click Start
    start_btn.click()

    # 5. Check Stop button appears
    stop_btn = page.get_by_role("button", name="Stop")
    expect(stop_btn).to_be_visible()

    # 6. Check Phase text changes to "Inhale (4s)"
    expect(page.get_by_text("Inhale (4s)")).to_be_visible()

    # 7. Take screenshot
    page.screenshot(path=".jules/verification/verification.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        # Launch browser.
        # Note: In some sandboxes, might need args=['--no-sandbox']
        browser = p.chromium.launch(headless=True, args=['--no-sandbox'])
        page = browser.new_page()
        try:
            test_zen_breather(page)
        finally:
            browser.close()
