export const config = {
  port: Number(process.env.PORT ?? 3000),
  password: process.env.GATE_PASSWORD ?? "",
  // HMAC secret for the session cookie. Defaults to the password if unset (set both in prod).
  secret: process.env.GATE_SECRET || process.env.GATE_PASSWORD || "change-me",
  totpSecret: process.env.GATE_TOTP_SECRET ?? "", // base32; empty disables 2FA
  cookieName: process.env.GATE_COOKIE_NAME ?? "gate_session",
  cookieDomain: process.env.GATE_COOKIE_DOMAIN ?? "", // e.g. .antonio-code.duckdns.org for SSO
  sessionTtlSec: Number(process.env.GATE_SESSION_TTL_SEC ?? 7 * 86400),
  title: process.env.GATE_TITLE ?? "Área protegida",
};
