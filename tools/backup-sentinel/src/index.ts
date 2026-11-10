#!/usr/bin/env bun
import { join } from "node:path";
import { backupTarget, previousTables, prune, realIO } from "./backup.ts";
import { loadConfig, loadTargets } from "./config.ts";
import { createRunner } from "./kubectl.ts";
import { telegramReport, textReport, worstVerdict } from "./report.ts";
import type { Snapshot } from "./types.ts";
import { verifySqlite } from "./verify.ts";

const HELP = `
backup-sentinel — copia o SQLite dos pods e PROVA que a cópia abre

  backup-sentinel run              faz backup de todos os alvos e verifica
  backup-sentinel run --target x   só um alvo
  backup-sentinel drill <alvo>     reabre o último snapshot e re-verifica
  backup-sentinel list             o que existe em disco

opções:
  --targets <arquivo>   catálogo (padrão ./targets.json)
  --dir <caminho>       onde guardar (padrão ./data/backups)
  --keep <n>            snapshots por alvo (padrão 7)
  --telegram            manda o resumo
  --json                saída crua
  --strict              exit 2 se qualquer alvo não ficar "ok"
  -h, --help

exit: 0 tudo ok · 1 algum aviso · 2 falha/corrupção (ou --strict) · 3 erro
`;

interface Args {
  cmd: "run" | "drill" | "list";
  arg?: string;
  target?: string;
  targets?: string;
  dir?: string;
  keep?: number;
  telegram: boolean;
  json: boolean;
  strict: boolean;
  help: boolean;
}

export function parseArgs(argv: string[]): Args {
  const a: Args = { cmd: "run", telegram: false, json: false, strict: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i] as string;
    const next = () => argv[++i];
    switch (arg) {
      case "run":
      case "drill":
      case "list":
        a.cmd = arg;
        break;
      case "--target":
        a.target = next();
        break;
      case "--targets":
        a.targets = next();
        break;
      case "--dir":
        a.dir = next();
        break;
      case "--keep":
        a.keep = Number(next());
        break;
      case "--telegram":
        a.telegram = true;
        break;
      case "--json":
        a.json = true;
        break;
      case "--strict":
        a.strict = true;
        break;
      case "-h":
      case "--help":
        a.help = true;
        break;
      default:
        if (arg.startsWith("-")) throw new Error(`opção desconhecida: ${arg}`);
        a.arg ??= arg;
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

const codeFor = (snapshots: Snapshot[], strict: boolean): number => {
  const worst = worstVerdict(snapshots);
  if (worst === "falhou" || worst === "corrompido") return 2;
  if (worst === "ok") return 0;
  return strict ? 2 : 1;
};

async function main(): Promise<number> {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(HELP);
    return 0;
  }

  const config = loadConfig({
    ...(args.targets ? { targetsFile: args.targets } : {}),
    ...(args.dir ? { backupDir: args.dir } : {}),
    ...(args.keep ? { keep: args.keep } : {}),
    ...(args.strict ? { strict: true } : {}),
  });
  const io = realIO(createRunner());

  if (args.cmd === "list") {
    const targets = await loadTargets(config.targetsFile);
    for (const t of targets) {
      const dirs = io.listDirs(join(config.backupDir, t.name)).sort();
      console.log(`${t.name.padEnd(20)} ${dirs.length} snapshot(s)  último: ${dirs.at(-1) ?? "—"}`);
    }
    return 0;
  }

  if (args.cmd === "drill") {
    const name = args.arg ?? args.target;
    if (!name) throw new Error("informe o alvo: backup-sentinel drill <alvo>");
    const targets = await loadTargets(config.targetsFile);
    const target = targets.find((t) => t.name === name);
    if (!target) throw new Error(`alvo "${name}" não está no catálogo`);
    const targetDir = join(config.backupDir, name);
    const last = io.listDirs(targetDir).sort().at(-1);
    if (!last) throw new Error(`nenhum snapshot de "${name}" em ${targetDir}`);
    const file = join(targetDir, last, target.path.split("/").pop() as string);
    const result = verifySqlite(file, target.tables ?? []);
    console.log(
      args.json
        ? JSON.stringify({ file, ...result }, null, 2)
        : `\n  ${file}\n  integridade: ${result.integrity}\n  ${result.tables
            .map((t) => `${t.table}=${t.rows}`)
            .join(" · ")}\n`,
    );
    return result.integrity === "ok" && !result.error ? 0 : 2;
  }

  const all = await loadTargets(config.targetsFile);
  const targets = args.target ? all.filter((t) => t.name === args.target) : all;
  if (!targets.length) throw new Error(`nenhum alvo${args.target ? ` chamado "${args.target}"` : ""}`);

  console.log(`[backup] ${targets.length} alvo(s)`);
  const snapshots: Snapshot[] = [];
  for (const target of targets) {
    const previous = previousTables(io, join(config.backupDir, target.name));
    const snapshot = await backupTarget(target, config, { ...io, log: (m) => console.log(m) }, previous);
    await Bun.write(join(snapshot.dir, "manifest.json"), `${JSON.stringify(snapshot, null, 2)}\n`);
    // Snapshot ruim não pode empurrar um bom para fora da retenção.
    if (snapshot.verdict === "ok") prune(target, config, io);
    snapshots.push(snapshot);
  }

  console.log(args.json ? JSON.stringify(snapshots, null, 2) : textReport(snapshots));
  if (args.telegram) {
    await notify(telegramReport(snapshots), config.telegramToken, config.telegramChatIds);
  }
  return codeFor(snapshots, config.strict);
}

if (import.meta.main) {
  try {
    process.exit(await main());
  } catch (err) {
    console.error(`\n  ✖ ${(err as Error).message}`);
    process.exit(3);
  }
}
