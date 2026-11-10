# 📣 notify-hub

One notification endpoint for your whole homelab. Define **topics**, each with a set of **sinks** (Telegram chat, Discord webhook, generic webhook), and publish with a per-topic token. notify-hub **fans the message out** and logs every delivery.

Stop copy-pasting bot tokens into every app: give each app a topic token instead. One Telegram bot secret lives here; nowhere else.

## Publish
```bash
curl -H "Authorization: Bearer <topic-token>" \
     -d '{"title":"deploy","message":"steam-key-watcher live ✅"}' \
     https://notify-hub.antonio-code.duckdns.org/pub/deploys
```

## Sinks
- `telegram` → `target` is a chat_id; the bot token is `NOTIFY_TELEGRAM_BOT_TOKEN` (one for all).
- `discord` → `target` is a Discord webhook URL.
- `webhook` → `target` is any URL; receives `{title, message, ts}`.

## Run
```bash
bun install && bun start   # http://localhost:3000
bun test
```

## Config (env)
| var | default | meaning |
|-----|---------|---------|
| `NOTIFY_TELEGRAM_BOT_TOKEN` | — | shared bot for telegram sinks |
| `PORT` | `3000` | HTTP listen port |
| `SINK_TIMEOUT_MS` | `8000` | per-sink request timeout |
| `MESSAGE_RING` | `30` | messages kept per topic |
| `DATA_DIR` | `data` | JSON persistence (PVC in prod) |

## API
- `POST /api/topics` `{name, sinks[]}` → `{name, token, publishUrl}`
- `POST /pub/:name` (Bearer token) `{title, message}` → fan-out
- `GET /api/topics` · `DELETE /api/topics/:name` · `GET /health`

## Deploy
GHCR `ghcr.io/juninmd/notify-hub:latest` → ArgoCD `app-charts/notify-hub` → `https://notify-hub.antonio-code.duckdns.org`. Small PVC for `data/`; bot token via ExternalSecret (`global_secrets_telegram_bot_token`).

MIT.
