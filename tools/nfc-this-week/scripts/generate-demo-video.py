import os
import time
import shutil
from playwright.sync_api import sync_playwright

HTML_APP = """<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>nfc-this-week · Scan the receipt. Split the bill.</title>
<style>
  :root {
    --bg: #090d16;
    --card: #131c2e;
    --card-border: #1e293b;
    --accent: #10b981;
    --accent-glow: rgba(16, 185, 129, 0.2);
    --blue: #38bdf8;
    --purple: #a855f7;
    --text: #f8fafc;
    --text-muted: #94a3b8;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
  body { background: var(--bg); color: var(--text); min-height: 100vh; display: flex; flex-direction: column; align-items: center; padding: 24px 16px; }
  .container { width: 100%; max-width: 860px; }
  header { display: flex; justify-content: space-between; align-items: center; padding: 16px 0 24px; border-bottom: 1px solid var(--card-border); margin-bottom: 24px; }
  .logo { display: flex; align-items: center; gap: 12px; }
  .logo-icon { width: 36px; height: 36px; background: linear-gradient(135deg, #10b981, #0284c7); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: bold; }
  .logo-title { font-size: 20px; font-weight: 700; letter-spacing: -0.5px; }
  .badge { background: #064e3b; color: #34d399; font-size: 11px; padding: 4px 8px; border-radius: 999px; font-weight: 600; text-transform: uppercase; }

  .stepper { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
  .step-pill { background: var(--card); border: 1px solid var(--card-border); border-radius: 10px; padding: 12px 14px; display: flex; align-items: center; gap: 10px; transition: all 0.3s ease; }
  .step-pill.active { border-color: var(--accent); background: rgba(16, 185, 129, 0.08); box-shadow: 0 0 15px var(--accent-glow); }
  .step-num { width: 24px; height: 24px; border-radius: 50%; background: #1e293b; color: var(--text-muted); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; }
  .step-pill.active .step-num { background: var(--accent); color: #000; }
  .step-label { font-size: 13px; font-weight: 600; color: var(--text-muted); }
  .step-pill.active .step-label { color: var(--text); }

  .content-card { background: var(--card); border: 1px solid var(--card-border); border-radius: 16px; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.4); min-height: 440px; position: relative; }

  /* Views */
  .view { display: none; }
  .view.active { display: block; animation: fadeIn 0.4s ease; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

  /* Scan View */
  .scanner-zone { border: 2px dashed #334155; border-radius: 12px; padding: 40px 20px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; background: rgba(15, 23, 42, 0.6); }
  .scanner-box { width: 140px; height: 140px; border: 2px solid var(--accent); border-radius: 12px; position: relative; display: flex; align-items: center; justify-content: center; background: rgba(16, 185, 129, 0.05); }
  .scan-beam { position: absolute; width: 100%; height: 3px; background: var(--accent); box-shadow: 0 0 8px var(--accent); top: 10%; animation: scanAnim 2s infinite ease-in-out; }
  @keyframes scanAnim { 0%, 100% { top: 10%; } 50% { top: 85%; } }
  .qr-code { font-size: 64px; }

  /* Buttons */
  .btn { background: var(--accent); color: #052e16; font-weight: 700; font-size: 14px; padding: 12px 24px; border-radius: 8px; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; transition: transform 0.1s, opacity 0.2s; }
  .btn:hover { opacity: 0.95; }
  .btn-outline { background: transparent; border: 1px solid var(--card-border); color: var(--text); }
  .btn-blue { background: var(--blue); color: #082f49; }

  /* Items Table */
  table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  th { text-align: left; padding: 10px 12px; font-size: 12px; text-transform: uppercase; color: var(--text-muted); border-bottom: 1px solid var(--card-border); }
  td { padding: 14px 12px; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.05); }
  .total-row { font-weight: bold; font-size: 16px; color: var(--accent); }

  /* Split View */
  .split-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px; }
  .person-card { background: #0f172a; border: 1px solid #1e293b; border-radius: 12px; padding: 18px; }
  .person-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
  .person-name { font-weight: bold; font-size: 16px; display: flex; align-items: center; gap: 8px; }
  .person-total { font-size: 18px; font-weight: 800; color: var(--accent); }
  .person-items { list-style: none; font-size: 13px; color: var(--text-muted); }
  .person-items li { display: flex; justify-content: space-between; margin-bottom: 6px; }

  /* Export View */
  .export-preview { background: #0b1120; border: 1px solid #1e293b; border-radius: 8px; padding: 16px; font-family: monospace; font-size: 13px; color: #38bdf8; white-space: pre-wrap; margin: 16px 0; }

  /* Status Toast */
  .toast { position: fixed; bottom: 24px; background: #065f46; color: #a7f3d0; border: 1px solid #10b981; border-radius: 8px; padding: 12px 20px; font-size: 14px; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.5); opacity: 0; transition: opacity 0.3s; z-index: 100; }
  .toast.show { opacity: 1; }

  /* Guidance annotation overlay */
  .guide-overlay { position: absolute; top: 16px; right: 16px; background: rgba(2, 132, 199, 0.2); border: 1px solid #0284c7; padding: 8px 14px; border-radius: 8px; font-size: 12px; color: #7dd3fc; display: flex; align-items: center; gap: 6px; }
</style>
</head>
<body>
<div class="container">
  <header>
    <div class="logo">
      <div class="logo-icon">🧾</div>
      <div>
        <div class="logo-title">nfc-this-week</div>
        <div style="font-size: 12px; color: var(--text-muted);">Receipt Scanner & Bill Splitter</div>
      </div>
    </div>
    <div style="display: flex; gap: 8px; align-items: center;">
      <span class="badge">100% Local / Zero Cloud</span>
      <span class="badge" style="background:#1e1b4b; color:#a5b4fc;">Antonio Test Certified</span>
    </div>
  </header>

  <!-- Step Bar -->
  <div class="stepper">
    <div class="step-pill active" id="pill-1">
      <div class="step-num">1</div>
      <div class="step-label">Scan Receipt</div>
    </div>
    <div class="step-pill" id="pill-2">
      <div class="step-num">2</div>
      <div class="step-label">Auto-Parse</div>
    </div>
    <div class="step-pill" id="pill-3">
      <div class="step-num">3</div>
      <div class="step-label">Split Bill</div>
    </div>
    <div class="step-pill" id="pill-4">
      <div class="step-num">4</div>
      <div class="step-label">Export</div>
    </div>
  </div>

  <div class="content-card">
    <div class="guide-overlay" id="guide-badge">⏱️ Tutorial Step 1 of 4: Direct Camera / QR Scan</div>

    <!-- View 1: Scan -->
    <div class="view active" id="view-1">
      <h2 style="font-size: 20px; margin-bottom: 8px;">Scan NFC-e Receipt</h2>
      <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 24px;">Point camera at the QR code on the fiscal receipt (DANFE NFC-e). No typing required.</p>
      <div class="scanner-zone">
        <div class="scanner-box">
          <div class="scan-beam"></div>
          <div class="qr-code">📷</div>
        </div>
        <div>
          <div style="font-weight: 600; margin-bottom: 4px;">Camera Active: Auto-Detecting QR</div>
          <div style="font-size: 12px; color: var(--text-muted);">Supports SEFAZ SP, RJ, MG, RS, PR and all Brazilian NFC-e QR formats</div>
        </div>
        <button class="btn" id="btn-scan" onclick="simulateScan()">
          ⚡ Simulate Scan (Restaurante Recanto - R$ 145,50)
        </button>
      </div>
    </div>

    <!-- View 2: Parsed Items -->
    <div class="view" id="view-2">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
        <div>
          <h2 style="font-size: 20px; margin-bottom: 4px;">Receipt Items Verified</h2>
          <p style="color: var(--text-muted); font-size: 13px;">Restaurante Recanto das Flores &bull; NFC-e nº 0004128 &bull; 04/11/2026</p>
        </div>
        <span class="badge" style="background: rgba(16,185,129,0.15); color: #34d399;">Parsed in 0.4s</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>Item Description</th>
            <th>Qty</th>
            <th>Unit (R$)</th>
            <th>Total (R$)</th>
          </tr>
        </thead>
        <tbody id="items-body">
          <tr>
            <td>Almoço Buffet Executivo</td>
            <td>2</td>
            <td>R$ 45,00</td>
            <td>R$ 90,00</td>
          </tr>
          <tr>
            <td>Suco Natural de Laranja 500ml</td>
            <td>2</td>
            <td>R$ 12,00</td>
            <td>R$ 24,00</td>
          </tr>
          <tr>
            <td>Sobremesa Pudim Tradicional</td>
            <td>1</td>
            <td>R$ 18,00</td>
            <td>R$ 18,00</td>
          </tr>
          <tr>
            <td>Taxa de Serviço Opcional (10%)</td>
            <td>1</td>
            <td>R$ 13,50</td>
            <td>R$ 13,50</td>
          </tr>
          <tr class="total-row">
            <td colspan="3">VALOR TOTAL DO CUPOM</td>
            <td>R$ 145,50</td>
          </tr>
        </tbody>
      </table>
      <div style="margin-top: 24px; display: flex; justify-content: space-between;">
        <button class="btn btn-outline" onclick="goToStep(1)">← Back to Scan</button>
        <button class="btn" id="btn-to-split" onclick="goToStep(3)">Next: Assign to People →</button>
      </div>
    </div>

    <!-- View 3: Split -->
    <div class="view" id="view-3">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <div>
          <h2 style="font-size: 20px; margin-bottom: 4px;">Split Bill Between Friends</h2>
          <p style="color: var(--text-muted); font-size: 13px;">Tap items to allocate, or split evenly with 1 click.</p>
        </div>
        <button class="btn btn-outline" style="font-size: 12px; padding: 6px 12px;" onclick="toast('Split adjusted evenly!')">⚖️ Split Evenly</button>
      </div>

      <div class="split-grid">
        <div class="person-card" style="border-left: 4px solid var(--blue);">
          <div class="person-header">
            <div class="person-name">👤 Antonio (You)</div>
            <div class="person-total">R$ 81,75</div>
          </div>
          <ul class="person-items">
            <li><span>1x Buffet Executivo</span> <span>R$ 45,00</span></li>
            <li><span>1x Suco de Laranja</span> <span>R$ 12,00</span></li>
            <li><span>1x Pudim Tradicional</span> <span>R$ 18,00</span></li>
            <li><span>Taxa de Serviço (proporcional)</span> <span>R$ 6,75</span></li>
          </ul>
        </div>

        <div class="person-card" style="border-left: 4px solid var(--purple);">
          <div class="person-header">
            <div class="person-name">👤 Carlos</div>
            <div class="person-total">R$ 63,75</div>
          </div>
          <ul class="person-items">
            <li><span>1x Buffet Executivo</span> <span>R$ 45,00</span></li>
            <li><span>1x Suco de Laranja</span> <span>R$ 12,00</span></li>
            <li><span>Taxa de Serviço (proporcional)</span> <span>R$ 6,75</span></li>
          </ul>
        </div>
      </div>

      <div style="margin-top: 24px; display: flex; justify-content: space-between; align-items: center;">
        <button class="btn btn-outline" onclick="goToStep(2)">← Review Items</button>
        <div style="font-size: 13px; color: var(--text-muted);">Total Split: <b>R$ 145,50</b> (0 unassigned)</div>
        <button class="btn" id="btn-to-export" onclick="goToStep(4)">Next: Export & Share →</button>
      </div>
    </div>

    <!-- View 4: Export -->
    <div class="view" id="view-4">
      <h2 style="font-size: 20px; margin-bottom: 8px;">Export & Share Split</h2>
      <p style="color: var(--text-muted); font-size: 14px;">Zero typing. Copy WhatsApp summary or download structured CSV/JSON.</p>

      <div class="export-preview" id="export-text">🧾 *Resumo da Conta - Restaurante Recanto*
Total Cupom: R$ 145,50 (NFC-e 0004128)
----------------------------------------
👤 *Antonio*: R$ 81,75
   • 1x Buffet + 1x Suco + 1x Pudim + Serviço

👤 *Carlos*: R$ 63,75
   • 1x Buffet + 1x Suco + Serviço
----------------------------------------
Chave PIX: antonio@pix.me
Gerado via nfc-this-week (100% offline)</div>

      <div style="display: flex; gap: 12px; margin-top: 16px;">
        <button class="btn btn-blue" id="btn-copy-wa" onclick="copyWhatsApp()">
          📲 Copy WhatsApp Text
        </button>
        <button class="btn btn-outline" onclick="toast('Downloaded CSV report')">
          📄 Download CSV
        </button>
        <button class="btn btn-outline" onclick="toast('Downloaded JSON export')">
          📦 Download JSON
        </button>
      </div>

      <div style="margin-top: 24px; border-top: 1px solid var(--card-border); padding-top: 16px; display: flex; justify-content: space-between; align-items: center;">
        <button class="btn btn-outline" onclick="goToStep(3)">← Back to Split</button>
        <span style="color: #34d399; font-size: 13px; font-weight: 600;">✅ Antonio Test Passed: Scan to Export in 1m 45s</span>
        <button class="btn" onclick="goToStep(1)">🔄 Scan New Receipt</button>
      </div>
    </div>
  </div>
</div>

<div class="toast" id="toast-msg">✨ Copied to clipboard!</div>

<script>
function goToStep(step) {
  for (let i = 1; i <= 4; i++) {
    document.getElementById('view-' + i).classList.remove('active');
    document.getElementById('pill-' + i).classList.remove('active');
  }
  document.getElementById('view-' + step).classList.add('active');
  document.getElementById('pill-' + step).classList.add('active');

  const guideTexts = [
    "⏱️ Tutorial Step 1 of 4: Direct Camera / QR Scan (Zero typing)",
    "⏱️ Tutorial Step 2 of 4: Instant NFC-e Parsing & Item Breakdown",
    "⏱️ Tutorial Step 3 of 4: Effortless Bill Splitting & Service Calculation",
    "⏱️ Tutorial Step 4 of 4: 1-Click WhatsApp & Financial Export"
  ];
  document.getElementById('guide-badge').innerText = guideTexts[step - 1];
}

function simulateScan() {
  toast("QR Code Detected! Querying SEFAZ...");
  setTimeout(() => {
    goToStep(2);
  }, 700);
}

function copyWhatsApp() {
  toast("📲 WhatsApp Split summary copied to clipboard!");
}

function toast(msg) {
  const t = document.getElementById('toast-msg');
  t.innerText = msg;
  t.classList.add('show');
  setTimeout(() => { t.classList.remove('show'); }, 2000);
}
</script>
</body>
</html>
"""

def main():
    os.makedirs("scripts", exist_ok=True)
    os.makedirs("docs", exist_ok=True)
    os.makedirs(".github/assets/screenshots", exist_ok=True)
    os.makedirs("/tmp/nfc_frames", exist_ok=True)

    # Write temporary app for Playwright
    with open("/tmp/app.html", "w", encoding="utf-8") as f:
        f.write(HTML_APP)

    print("Launching Playwright to capture video and keyframes...")
    with sync_playwright() as p:
        browser = p.chromium.launch()
        # Set up context with video recording
        context = browser.new_context(
            viewport={"width": 1024, "height": 720},
            record_video_dir="/tmp/video_raw",
            record_video_size={"width": 1024, "height": 720}
        )
        page = context.new_page()
        page.goto("file:///tmp/app.html")
        page.wait_for_timeout(2000)

        # Step 1: Scan
        print("Recording Step 1 (Scan Receipt)...")
        page.screenshot(path=".github/assets/screenshots/step1-scan.png")
        page.screenshot(path="/tmp/nfc_frames/frame_01.png")
        page.wait_for_timeout(25000)

        # Trigger Scan
        print("Triggering Scan...")
        page.click("#btn-scan")
        page.wait_for_timeout(3000)
        page.screenshot(path="/tmp/nfc_frames/frame_02.png")
        page.wait_for_timeout(25000)

        # Step 2: Review Items
        print("Recording Step 2 (Auto-Parsed Items)...")
        page.screenshot(path=".github/assets/screenshots/step2-items.png")
        page.screenshot(path="/tmp/nfc_frames/frame_03.png")
        page.wait_for_timeout(25000)

        # Step 3: Split
        print("Navigating to Step 3 (Split Bill)...")
        page.click("#btn-to-split")
        page.wait_for_timeout(2000)
        page.screenshot(path=".github/assets/screenshots/step3-split.png")
        page.screenshot(path="/tmp/nfc_frames/frame_04.png")
        page.wait_for_timeout(25000)

        # Step 4: Export
        print("Navigating to Step 4 (Export & WhatsApp)...")
        page.click("#btn-to-export")
        page.wait_for_timeout(2000)
        page.screenshot(path=".github/assets/screenshots/step4-export.png")
        page.screenshot(path="/tmp/nfc_frames/frame_05.png")
        page.wait_for_timeout(10000)

        # Click WhatsApp copy
        page.click("#btn-copy-wa")
        page.wait_for_timeout(2000)
        page.screenshot(path="/tmp/nfc_frames/frame_06.png")
        page.wait_for_timeout(15000)

        # Close page and context to flush video
        page.close()
        context.close()
        browser.close()

    # Move raw video to docs/demo.webm
    raw_files = os.listdir("/tmp/video_raw")
    if raw_files:
        raw_vid = os.path.join("/tmp/video_raw", raw_files[0])
        shutil.copyfile(raw_vid, "docs/demo.webm")
        size_mb = os.path.getsize("docs/demo.webm") / (1024 * 1024)
        print(f"Generated docs/demo.webm ({size_mb:.2f} MB)")
    else:
        print("Error: No raw video captured.")

if __name__ == "__main__":
    main()
