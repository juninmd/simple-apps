# 🏁 llm-bench

Placar **determinístico** dos modelos do seu gateway OpenAI-compatible: quem ainda responde,
quem acerta o quê, quanto demora e quanto custa.

Nasceu de dois problemas reais: free tier remove modelo sem avisar (e o bot quebra em silêncio),
e a escolha de "qual modelo usar para qual tarefa" costuma ser folclore em vez de dado.

```
| modelo             | acerto | p50    | p95     | tok/s | custo  | veredito                                    |
|--------------------|--------|--------|---------|-------|--------|---------------------------------------------|
| `qwen128k:latest`  | 13%    | 2910ms | 12549ms | 11.4  | grátis | responde vazio — modelo de raciocínio       |
|                    |        |        |         |       |        | estourando o max_tokens; suba LLM_MAX_TOKENS|
| `modelo-inexistente`| —     | —      | —       | —     | —      | fora do ar — remova do gateway              |

## Sumiram
- `modelo-inexistente` — 404 ×8
> Free tier remove modelo sem avisar. Quem depende desses nomes quebra em silêncio.
```

## Uso

```bash
bun install
cp .env.example .env      # LLM_BASE_URL, LLM_API_KEY

bun run src/index.ts models                       # o que o gateway expõe
bun run src/index.ts tasks                        # a suíte
bun run src/index.ts run                          # testa todos os modelos
bun run src/index.ts run --models a,b --repeats 3
bun run src/index.ts run --out placar.md --telegram
```

| flag | efeito |
|---|---|
| `--models a,b` | só estes (padrão: tudo que o gateway lista) |
| `--skip a,b` | pula estes |
| `--repeats <n>` | repetições por tarefa (padrão 2) |
| `--concurrency <n>` | chamadas simultâneas (padrão 2) |
| `--out <arquivo.md>` | grava o relatório |
| `--telegram` | manda o resumo curto |
| `--json` | saída crua |
| `--no-save` | não grava histórico |

Exit: `0` tudo respondeu · `1` alguém regrediu · `2` modelo listado não responde · `3` erro.
O `2` é o que você quer num CronJob: alguém sumiu.

## A suíte

Oito tarefas, **checagem determinística** — nada de LLM julgando LLM, porque juiz não
determinístico não serve para comparar corridas ao longo do tempo.

| tarefa | capacidade | reprova quem |
|---|---|---|
| `obedece-formato-curto` | instrução | enfeita quando pediram uma palavra só |
| `json-valido` | formato | não devolve JSON parseável (aceita cerca de código e texto ao redor) |
| `lista-markdown` | formato | não respeita "3 linhas começando com `- `" |
| `extrai-campo` | extração | confunde números do contexto |
| `aritmetica` | raciocínio | erra 17×23 |
| `raciocinio-ordem` | raciocínio | erra ordenação de três eventos |
| `responde-em-portugues` | idioma | responde em inglês quando o system pediu pt-BR |
| `recusa-inventar` | instrução | alucina em vez de dizer "NAO SEI" |

O placar sai **por capacidade**, não como nota única: um modelo pode ser ótimo para chat e
inútil para saída estruturada, e é essa diferença que decide onde usar cada um.

## Três coisas que ele separa

**Modelo morto ≠ modelo ruim.** Erro de transporte (404, 500, timeout) vira a seção *Sumiram*,
com o código e a contagem. Modelo que responde e erra vira *Falhas de conteúdo*, com o que ele
efetivamente respondeu.

**Corpo vazio ≠ resposta errada.** Modelo de raciocínio gasta o orçamento de tokens pensando e
devolve conteúdo vazio. Isso é configuração de quem chamou, não incompetência do modelo — o
veredito manda subir o `LLM_MAX_TOKENS` antes de julgar. (Esse caso apareceu no primeiro
benchmark real, contra um Qwen3 local.)

**Regressão ≠ estado.** Cada corrida é comparada com a anterior: quem parou de responder, quem
voltou, quem caiu de acerto, quem ficou 2× mais lento. É o alerta que importa.

## Configuração

| var | padrão | o quê |
|---|---|---|
| `LLM_BASE_URL` | `http://localhost:4000/v1` | LiteLLM, vLLM, Ollama, Groq, OpenRouter |
| `LLM_API_KEY` | — | |
| `LLM_MODELS` | vazio | vazio = pergunta ao gateway |
| `LLM_SKIP_MODELS` | vazio | |
| `LLM_REPEATS` | `2` | |
| `LLM_CONCURRENCY` | `2` | |
| `LLM_TIMEOUT_MS` | `60000` | |
| `LLM_MAX_TOKENS` | `200` | suba para modelos de raciocínio |
| `DB_PATH` | `./data/bench.db` | histórico |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_IDS` | — | |

Toda chamada usa `temperature: 0` — o placar precisa ser comparável entre execuções.

## Testes

```bash
bun test          # 51 testes
bunx tsc --noEmit
```

O `GatewayClient` é injetado: a suíte inteira roda sem rede. Estão cobertos os checkers de cada
tarefa (inclusive as formas que um modelo real usa para enrolar: cerca de código, preâmbulo,
resposta em inglês), o limite de concorrência, erro de gateway virando dado, corpo vazio,
percentil por interpolação e a detecção de regressão entre corridas.

## Limitações

- Mede **capacidade instrumental**, não qualidade de prosa. Um modelo pode passar em tudo aqui e
  escrever mal.
- Custo depende do gateway reportar (`x-litellm-response-cost` ou `usage.response_cost`); sem
  isso a coluna fica vazia.
- Suíte curta de propósito: roda em minutos e cabe num CronJob diário.
