import { Hono } from "hono";
import { config } from "./config";
import { signSession, verifySession, safeEqual, verifyTotp } from "./auth";
import { loginPage } from "./pages";
import { safeRedirect as guardRedirect } from "./redirect";

const app = new Hono();

const safeRedirect = (rd: string) => guardRedirect(rd, config.cookieDomain);

// Rebuild the original URL Traefik was guarding, for post-login redirect.
function originalUrl(c: any): string {
  const proto = c.req.header("x-forwarded-proto") ?? "https";
  const host = c.req.header("x-forwarded-host") ?? c.req.header("host") ?? "";
  const uri = c.req.header("x-forwarded-uri") ?? "/";
  return host ? `${proto}://${host}${uri}` : "/";
}

function sessionCookie(): string {
  const value = signSession(Date.now() + config.sessionTtlSec * 1000, config.secret);
  const parts = [
    `${config.cookieName}=${value}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    `Max-Age=${config.sessionTtlSec}`,
  ];
  if (config.cookieDomain) parts.push(`Domain=${config.cookieDomain}`);
  return parts.join("; ");
}

function readCookie(c: any): string | undefined {
  const raw = c.req.header("cookie") ?? "";
  for (const part of raw.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === config.cookieName) return v.join("=");
  }
  return undefined;
}

// Traefik forwardAuth target: 200 = allow, else the response is shown to the user.
app.get("/auth", (c) => {
  if (verifySession(readCookie(c), config.secret)) return c.body(null, 200);
  const rd = originalUrl(c);
  const host = c.req.header("host") ?? "";
  const proto = c.req.header("x-forwarded-proto") ?? "https";
  // Redirect to our own login (this service is reachable un-gated).
  return c.redirect(`${proto}://${host}/login?rd=${encodeURIComponent(rd)}`, 302);
});

app.get("/login", (c) => {
  if (verifySession(readCookie(c), config.secret)) return c.redirect(safeRedirect(c.req.query("rd") ?? "/"), 302);
  return c.html(loginPage(c.req.query("rd") ?? "/"));
});

app.post("/login", async (c) => {
  const form = await c.req.parseBody();
  const password = String(form.password ?? "");
  const totp = String(form.totp ?? "");
  const rd = safeRedirect(String(form.rd ?? "/"));

  if (!config.password || !safeEqual(password, config.password)) {
    return c.html(loginPage(rd, "Senha incorreta."), 401);
  }
  if (config.totpSecret && !verifyTotp(totp, config.totpSecret)) {
    return c.html(loginPage(rd, "Código 2FA inválido."), 401);
  }
  c.header("Set-Cookie", sessionCookie());
  return c.redirect(rd, 302);
});

app.get("/logout", (c) => {
  const parts = [`${config.cookieName}=`, "Path=/", "Max-Age=0"];
  if (config.cookieDomain) parts.push(`Domain=${config.cookieDomain}`);
  c.header("Set-Cookie", parts.join("; "));
  return c.html(loginPage("/", "Sessão encerrada."));
});

app.get("/health", (c) => c.json({ ok: true, totp: !!config.totpSecret }));

if (import.meta.main) {
  if (!config.password) console.warn("[gate] GATE_PASSWORD unset — all logins will fail");
  console.log(`gate on :${config.port} (2fa: ${config.totpSecret ? "on" : "off"})`);
  Bun.serve({ port: config.port, fetch: app.fetch });
}

export { app };
