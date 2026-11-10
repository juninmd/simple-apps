# ⚙️ jobrunner

Cron-as-a-service. Schedule **HTTP requests on an interval**, keep a **run history** (status, latency, sparkline), trigger runs on demand, pause/resume, and get a **Telegram alert on failure** (and recovery). Consolidates a pile of one-line k8s CronJobs into one dashboard.

Pairs with **cron-sentinel**: jobrunner *fires* the calls; cron-sentinel *watches* that they happened.

## Run
```bash
bun install && bun start   # http://localhost:3000
bun test
```

## Config (env)
| var | default | meaning |
|-----|---------|---------|
| `TICK_MS` | `5000` | scheduler resolution |
| `HISTORY_LEN` | `20` | runs kept per job |
| `DATA_DIR` | `data` | JSON persistence (PVC in prod) |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` | — | failure/recovery alerts |

## API
- `POST /api/jobs` `{name, url, method?, intervalSec, headers?, body?}` → job
- `GET /api/jobs` · `DELETE /api/jobs/:id`
- `POST /api/jobs/:id/run` (run now) · `POST /api/jobs/:id/toggle`
- `GET /health`

Alerts fire only on **transition** (ok→fail, fail→ok), never on every tick.

## Deploy
GHCR `ghcr.io/juninmd/jobrunner:latest` → ArgoCD `app-charts/jobrunner` → `https://jobrunner.antonio-code.duckdns.org`. PVC for `data/`; Telegram via ExternalSecret (`global_secrets_telegram_*`).

MIT.
