# ⏱️ cron-sentinel

Self-hosted **dead-man's switch** for scheduled jobs (a tiny healthchecks.io). Every job pings a URL when it finishes successfully. If a ping doesn't arrive inside `period + grace`, the check goes **down** and you get a Telegram alert. Recovery is reported too.

Catches the silent failure that logs never show: the cron that simply *stopped running* — suspended CronJob, crashed sidecar, expired token.

## Wire a job in one line
```bash
# at the end of your job / CronJob command:
curl -fsS https://cron-sentinel.antonio-code.duckdns.org/ping/<id> || true
```
For dinheirama's daily notifier, steam-key-watcher cycles, backups — anything on a schedule.

## Status model
`new` (never pinged) · `up` (pinged within period) · `late` (within grace) · `down` (past grace → alert).

## Run
```bash
bun install && bun start   # http://localhost:3000
bun test
```

## Config (env)
| var | default | meaning |
|-----|---------|---------|
| `RECONCILE_INTERVAL_MS` | `30000` | how often statuses are recomputed |
| `DATA_DIR` | `data` | JSON persistence (PVC in prod) |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` | — | alerts |

## API
- `GET /` dashboard · `GET /api/checks` list
- `POST /api/checks` `{name, periodSec, graceSec}` → check + `pingUrl`
- `GET|POST /ping/:id` record a heartbeat · `DELETE /api/checks/:id`
- `GET /health`

## Deploy
GHCR `ghcr.io/juninmd/cron-sentinel:latest` → ArgoCD `app-charts/cron-sentinel` → `https://cron-sentinel.antonio-code.duckdns.org`. Small PVC for `data/`.

MIT.
