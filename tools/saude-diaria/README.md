# 🩺 Saúde Diária

Agente autônomo que coleta feeds RSS sobre **saúde, bem-estar e nutrição baseada em evidências**, cura com IA e envia um **digest diário em pt-BR** via Telegram. Estado local em SQLite. Inspirado em `evo-agent` / `fast-news`.

## Como funciona

```
RSS (cron) ─▶ SQLite (dedupe) ─▶ IA (curadoria pt-BR) ─▶ Telegram (digest diário)
```

## Rodar

```bash
cp .env.example .env      # configure TELEGRAM_* e o provider de IA
bun install
bun run dev               # um ciclo (ingest + digest) e sai
bun start                 # modo loop com cron (ingestão + digest diário)
```

Comandos avulsos:

```bash
bun run ingest            # só coleta feeds
bun run digest            # só gera e envia o digest do que está pendente
bun run typecheck         # tsc --noEmit
```

Sem `TELEGRAM_BOT_TOKEN`, o digest é impresso no console (útil pra testar).
Provider de IA padrão: **Ollama local** (grátis). Troque para `openai`/`anthropic`/`google` no `.env`.

## Config

- Feeds e prompt: `src/config/topic.ts`
- Agendamento e limites: `.env` (`CRON_*`, `DIGEST_MAX_ITEMS`, ...)

## Stack

Runtime **Bun** (TS nativo, sem build step), `bun:sqlite` para estado, `node-cron` para agendamento, `rss-parser` para os feeds. O `.env` é carregado automaticamente pelo Bun.
