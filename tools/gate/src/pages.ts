import { config } from "./config";

export function loginPage(rd: string, error = ""): string {
  const totpField = config.totpSecret
    ? `<input name="totp" inputmode="numeric" autocomplete="one-time-code" placeholder="Código 2FA (6 dígitos)" />`
    : "";
  const err = error ? `<div class="err">${error}</div>` : "";
  return /* html */ `<!doctype html><html lang="pt-BR"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${config.title}</title><style>
:root{color-scheme:dark}*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:grid;place-items:center;font:15px/1.5 ui-sans-serif,system-ui,sans-serif;background:#0b0f17;color:#e5e7eb}
form{width:100%;max-width:360px;background:#111827;border:1px solid #1f2937;border-radius:16px;padding:28px}
h1{margin:0 0 20px;font-size:18px}
input{width:100%;background:#0b0f17;border:1px solid #374151;color:#e5e7eb;border-radius:10px;padding:12px;font:inherit;margin-bottom:10px}
button{width:100%;background:#2563eb;border:0;color:#fff;padding:12px;border-radius:10px;font:inherit;font-weight:600;cursor:pointer}
button:hover{background:#1d4ed8}.err{color:#ef4444;margin-bottom:12px;font-size:13px}
.lock{font-size:26px;margin-bottom:6px}
</style></head><body>
<form method="POST" action="/login">
  <div class="lock">🔒</div><h1>${config.title}</h1>
  ${err}
  <input type="password" name="password" placeholder="Senha" autofocus autocomplete="current-password" />
  ${totpField}
  <input type="hidden" name="rd" value="${rd.replace(/"/g, "&quot;")}" />
  <button type="submit">Entrar</button>
</form></body></html>`;
}
