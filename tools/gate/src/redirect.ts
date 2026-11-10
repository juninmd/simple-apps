// Open-redirect guard: only same-suffix hosts (or single-slash relative paths) are allowed.
export function safeRedirect(rd: string, cookieDomain = ""): string {
  if (/[\x00-\x1f\x7f]/.test(rd)) return "/";
  if (rd.startsWith("/")) return rd[1] === "/" || rd[1] === "\\" ? "/" : rd;
  try {
    const u = new URL(rd);
    if (u.protocol !== "https:" && u.protocol !== "http:") return "/";
    if (cookieDomain && !u.host.endsWith(cookieDomain.replace(/^\./, ""))) return "/";
    return rd;
  } catch {
    return "/";
  }
}
