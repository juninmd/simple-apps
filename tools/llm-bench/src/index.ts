#!/usr/bin/env bun
import { benchmark } from "./bench.ts";
import { createClient } from "./client.ts";
import { loadConfig, selectModels } from "./config.ts";
import { markdownReport, telegramReport } from "./report.ts";
import { createStore, regressions } from "./store.ts";
import { TASKS } from "./tasks.ts";

const HELP = `
llm-bench — placar determinístico dos modelos do seu gateway

  llm-bench run              roda a suíte e imprime o relatório
  llm-bench models           lista o que o gateway expõe
  llm-bench tasks            mostra a suíte

opções:
  --models a,b               só estes modelos (padrão: todos do gateway)
  --skip a,b                 pula estes
  --repeats <n>              repetições por tarefa (padrão 2)
  --concurrency <n>          chamadas simultâneas (padrão 2)
  --out <arquivo.md>         grava o relatório em Markdown
  --telegram                 envia o resumo curto para o Telegram
  --json                     saída JSON crua
  --no-save                  não grava histórico
  -h, --help

exit: 0 tudo respondeu · 1 alguém regrediu · 2 modelo listado não responde · 3 erro
`;

interface Args {
  cmd: "run" | "models" | "tasks";
  models?: string;
  skip?: string;
  repeats?: number;
  concurrency?: number;
  out?: string;
  telegram: boolean;
  json: boolean;
  save: boolean;
  help: boolean;
}

export function parseArgs(argv: string[]): Args {
  const a: Args = { cmd: "run", telegram: false, json: false, save: true, help: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i] as string;
    const next = () => argv[++i];
    switch (arg) {
      case "run":
      case "models":
      case "tasks":
        a.cmd = arg;
        break;
      case "--models":
        a.models = next();
        break;
      case "--skip":
        a.skip = next();
        break;
      case "--repeats":
        a.repeats = Number(next());
        break;
      case "--concurrency":
        a.concurrency = Number(next());
        break;
      case "--out":
        a.out = next();
        break;
      case "--telegram":
        a.telegram = true;
        break;
      case "--json":
        a.json = true;
        break;
      case "--no-save":
        a.save = false;
        break;
      case "-h":
      case "--help":
        a.help = true;
        break;
      default:
        throw new Error(`opção desconhecida: ${arg}`);
    }
  }
  return a;
}

async function notify(text: string, token: string, chatIds: string[]): Promise<void> {
  if (!token || !chatIds.length) {
    console.log(`[telegram] não configurado:\n${text}`);
    return;
  }
  for (const chatId of chatIds) {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: text.slice(0, 3800),
        parse_mode: "Markdown",
        disable_web_page_preview: true,
      }),
    });
    if (!res.ok) console.error(`[telegram] ${res.status}`);
  }
}

async function main(): Promise<number> {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(HELP);
    return 0;
  }

  const config = loadConfig({
    ...(args.models ? { models: args.models.split(",").map((s) => s.trim()) } : {}),
    ...(args.skip ? { skipModels: args.skip.split(",").map((s) => s.trim()) } : {}),
    ...(args.repeats ? { repeats: args.repeats } : {}),
    ...(args.concurrency ? { concurrency: args.concurrency } : {}),
  });

  if (args.cmd === "tasks") {
    for (const t of TASKS) console.log(`${t.id.padEnd(24)} ${t.skill.padEnd(12)} ${t.why}`);
    return 0;
  }

  const client = createClient(config);

  if (args.cmd === "models") {
    const models = await client.listModels();
    console.log(args.json ? JSON.stringify(models, null, 2) : models.join("\n"));
    return 0;
  }

  const available = config.models.length ? config.models : await client.listModels();
  const models = selectModels(available, config);
  if (!models.length) throw new Error("nenhum modelo para testar");

  console.log(
    `[bench] ${models.length} modelo(s) × ${TASKS.length} tarefas × ${config.repeats} repetição(ões)`,
  );
  const run = await benchmark(models, { client, config, log: (m) => console.log(m) });

  const store = args.save ? createStore(config.dbPath) : null;
  const previous = store?.lastRunModels() ?? null;
  const changed = regressions(previous, run.models);
  store?.save(run);
  store?.close();

  const report = markdownReport(run);
  if (args.json) console.log(JSON.stringify(run, null, 2));
  else console.log(`\n${report}`);

  if (changed.length) {
    console.log("## Mudanças desde a última corrida\n");
    for (const c of changed) console.log(`- ${c.model}: ${c.change}`);
  }

  if (args.out) await Bun.write(args.out, report);
  if (args.telegram) {
    const extra = changed.length
      ? `\n\n*mudou:* ${changed.map((c) => `${c.model} (${c.change})`).join("; ")}`
      : "";
    await notify(telegramReport(run) + extra, config.telegramToken, config.telegramChatIds);
  }

  if (run.models.some((m) => !m.alive)) return 2;
  return changed.length ? 1 : 0;
}

if (import.meta.main) {
  try {
    process.exit(await main());
  } catch (err) {
    console.error(`\n  ✖ ${(err as Error).message}`);
    process.exit(3);
  }
}
