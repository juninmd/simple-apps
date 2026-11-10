# 🔒 gate

A tiny **Traefik forward-auth** service. Put it in front of any ingress and it demands a **password (+ optional TOTP 2FA)** before Traefik lets the request through. On success it sets a **signed session cookie** that works as **SSO across all your subdomains**.

Protect the dashboards that have no auth of their own (cluster-pulse, hookrelay, cron-sentinel…) without touching their code.

## How it plugs into Traefik
```yaml
# Middleware
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata: { name: gate-auth, namespace: gate }
spec:
  forwardAuth:
    address: http://gate.gate.svc.cluster.local:3000/auth
```
Then add `gate-gate-auth@kubernetescrd` to the target ingress's `router.middlewares`. Unauthenticated requests get 302'd to gate's own login, then bounced back to where they were going.

## Security
- Session cookie is `HMAC-SHA256`-signed with an expiry; tampering or expiry ⇒ rejected (constant-time compare).
- TOTP is RFC-6238 (SHA-1/6-digit/30s, ±1 step skew) — works with Google Authenticator / Aegis.
- Cookie is `HttpOnly; Secure; SameSite=Lax`; `Domain` set for subdomain SSO.
- Open-redirect guard: post-login `rd` must be relative or under `GATE_COOKIE_DOMAIN`.

## Run
```bash
bun install && GATE_PASSWORD=hunter2 bun start   # http://localhost:3000/login
bun test
```

## Config (env)
| var | default | meaning |
|-----|---------|---------|
| `GATE_PASSWORD` | — | the shared password (required) |
| `GATE_SECRET` | =password | cookie-signing HMAC key (set your own) |
| `GATE_TOTP_SECRET` | — | base32 secret; empty = 2FA off |
| `GATE_COOKIE_DOMAIN` | — | e.g. `.antonio-code.duckdns.org` for SSO |
| `GATE_SESSION_TTL_SEC` | `604800` | session lifetime |

## Deploy
GHCR `ghcr.io/juninmd/gate:latest` → ArgoCD `app-charts/gate` → `https://gate.antonio-code.duckdns.org`. Secrets (`GATE_PASSWORD`, `GATE_SECRET`, `GATE_TOTP_SECRET`) via ExternalSecret. Stateless — no PVC.

MIT.
