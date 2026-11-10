# 🛟 backup-sentinel

Copia o SQLite de dentro dos pods **e prova que a cópia abre**.

Backup que nunca foi restaurado não é backup — é um arquivo com esperança dentro. Aqui cada
snapshot é aberto com `PRAGMA integrity_check`, tem as linhas contadas por tabela e é comparado
com o snapshot anterior. Se a cópia não presta, você descobre no dia seguinte, não no dia do
desastre.

```
  ✅ radar-ofertas — cópia abre, integridade ok
     25.8 MB · products=5877 · price_history=343188 · deals=4087
     price_history: 343087 → 343188 (+101)
     ./data/backups/radar-ofertas/2026-08-21T03-00-00-000Z

  ⚠️ cve-radar — abre, mas não tem linha nenhuma — o volume certo está sendo copiado?
```

## Por que copia `.db`, `-wal` e `-shm` juntos

Os agentes usam `bun:sqlite` com WAL ligado. Com WAL, escritas recentes ficam no arquivo
`-wal` e ainda não estão no `.db`. Copiar só o `.db` devolve um banco **íntegro e
desatualizado** — o pior tipo de backup ruim, porque passa em qualquer verificação superficial.

Medido no `radar-ofertas` em produção:

```
== só o .db (sem o -wal) ==       == .db + -wal ==
integridade: ok                   integridade: ok
  price_history = 343087            price_history = 343188   (+101)
```

101 linhas que existiam no pod não existiriam na restauração. Por isso o trio vai junto: o
SQLite recupera o WAL ao abrir e o snapshot fica no estado real.

## Uso

```bash
bun install
cp targets.example.json targets.json
cp .env.example .env

bun run src/index.ts run                  # backup + verificação de todos os alvos
bun run src/index.ts run --target cve-radar
bun run src/index.ts drill cve-radar      # reabre o último snapshot e re-verifica
bun run src/index.ts list                 # o que existe em disco
```

| flag | efeito |
|---|---|
| `--targets <arquivo>` | catálogo (padrão `./targets.json`) |
| `--dir <caminho>` | onde guardar (padrão `./data/backups`) |
| `--keep <n>` | snapshots por alvo (padrão 7) |
| `--telegram` | manda o resumo |
| `--json` | saída crua |
| `--strict` | exit 2 se qualquer alvo não ficar `ok` |

Exit: `0` tudo ok · `1` aviso (vazio/encolheu) · `2` falha ou corrupção · `3` erro de uso.
Num CronJob, `2` é o que acorda você.

## Catálogo (`targets.json`)

```json
[
  {
    "name": "radar-ofertas",
    "namespace": "radar-ofertas",
    "selector": "app=radar-ofertas",
    "container": "radar-ofertas",
    "path": "/data/radar.sqlite",
    "tables": ["products", "price_history", "deals"],
    "keep": 14
  }
]
```

`tables` é opcional: sem ele, conta todas. Serve para acompanhar só o que importa.

## Os vereditos

| veredito | significa | por que existe |
|---|---|---|
| `ok` | abre, íntegro, com linhas | |
| `vazio` | abre, mas nenhuma tabela tem linha | quase sempre é o volume errado ou o path errado |
| `encolheu` | alguma tabela perdeu linhas | base append-only encolhendo é sinal de que algo apagou dados |
| `corrompido` | `integrity_check` reprovou | esta cópia não restaura — o alerta tem que sair hoje |
| `falhou` | não deu para copiar ou abrir | pod sumiu, path errado, exec negado |

Um snapshot que não fica `ok` **não dispara a poda**: backup ruim nunca empurra um backup bom
para fora da retenção.

O relatório também avisa quando **nada mudou** desde o snapshot anterior — em bot que ingere
todo dia, isso normalmente significa que o bot parou, não que o backup falhou.

## Segurança

- O `path` de cada alvo entra num `sh -c` remoto: espaço, aspas, `$` e barra invertida são
  **recusados no parse**, não escapados na hora de executar. Coberto por teste.
- O `name` vira caminho em disco: só `[a-z0-9._-]`, então `../etc` não passa.
- O tool só lê (`kubectl exec -- cat`); nunca escreve dentro do pod.
- Guarde `BACKUP_DIR` **fora do cluster**. Backup no mesmo disco que o dado não é backup.

## Testes

```bash
bun test          # 42 testes
bunx tsc --noEmit
```

O `Runner` (kubectl) é injetado, então a coleta inteira é testada sem cluster. A verificação,
não: ela roda contra **bancos SQLite de verdade** criados no teste — incluindo um arquivo que
não é banco e um arquivo truncado ao meio, que precisam ser reprovados.

Também estão cobertos: ausência de `-wal`/`-shm` (normal), ausência do `.db` (falha), pod não
encontrado, `exec` negado, delta entre snapshots, tabela nova, retenção e a recusa de path com
injeção de comando.

## O que ainda não rodou contra o cluster

O caminho `kubectl exec` end-to-end não foi exercitado: a API do cluster (`:6443`) não responde
da máquina onde isto foi construído. A verificação foi validada contra um SQLite real puxado do
`radar-ofertas` (a medição do WAL acima), mas a primeira execução completa de `run` contra o
cluster é o teste que falta.

## Limitações

- SQLite apenas. Postgres/Mongo pedem `pg_dump`/`mongodump` e outra estratégia de verificação.
- Sem cifragem em repouso: o snapshot vai para o disco como está.
- Sem envio para storage remoto — aponte `BACKUP_DIR` para um volume que já seja replicado.
- Um alvo por vez, serial: bases grandes por `kubectl exec` competem por rede.
