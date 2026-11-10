# 🪝 hookrelay

Self-hosted **webhook inspector + relay**. Give any producer (GitHub, Stripe, a CI job) a URL, and hookrelay will **capture** every request (method, headers, body), **verify its HMAC-SHA256 signature**, show it in a live inspector, and **fan it out** to one or more targets with exponential-backoff retries.

Part `webhook.site`, part relay/proxy — for a homelab where you want one stable ingress that inspects and re-delivers.

## Flow
```
producer ──POST──▶ /h/<token> ──(verify HMAC)──▶ inspect + fan-out ──retry──▶ target A, target B
```
- HMAC mismatch → stored for inspection, **not relayed** (401).
- Each target retried up to 3× (0.5s → 1s → 2s backoff); per-target status shown in the UI.
- Caller gets a fast `200` — relay happens in the background.

## Run
```bash
bun install && bun start   # http://localhost:3000
bun test
```

## Config (env)
| var | default | meaning |
|-----|---------|---------|
| `MAX_BODY_BYTES` | `16384` | stored body cap |
| `DELIVERY_TIMEOUT_MS` | `10000` | per-attempt timeout when relaying to a target (retryable) |
| `REQUEST_RING` | `50` | requests kept per endpoint |
| `DATA_DIR` | `data` | JSON persistence (PVC in prod) |

## API
- `POST /api/endpoints` `{name, targets[], hmacSecret?}` → `{token, url}`
- `GET /api/endpoints` · `GET /api/endpoints/:token` · `DELETE /api/endpoints/:token`
- `ALL /h/:token` — ingest + relay
- `GET /health`

## Deploy
GHCR `ghcr.io/juninmd/hookrelay:latest` → ArgoCD `app-charts/hookrelay` → `https://hookrelay.antonio-code.duckdns.org`. Small PVC for `data/`.

MIT.
