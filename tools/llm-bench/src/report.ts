import { TASKS } from "./tasks.ts";
import type { ModelSummary, RunResult } from "./types.ts";
import { vanished } from "./stats.ts";

const pct = (n: number) => `${Math.round(n * 100)}%`;
const ms = (n: number) => `${Math.round(n)}ms`;
const usd = (n: number | null) => (n === null ? "—" : n === 0 ? "grátis" : `$${n.toFixed(5)}`);

const SKILLS = ["instrucao", "formato", "raciocinio", "idioma", "extracao"] as const;

const skillCell = (s: ModelSummary, skill: string) => {
  const cell = s.bySkill[skill];
  if (!cell) return "—";
  return `${cell.passed}/${cell.total}`;
};

/** Recomendação em uma linha: para que serve este modelo, se é que serve. */
export function verdict(s: ModelSummary): string {
  if (!s.alive) return "fora do ar — remova do gateway ou do código que o chama";
  // Modelo de raciocínio gasta o orçamento de tokens pensando e devolve corpo vazio:
  // isso não é "errou a tarefa", é configuração errada de quem chamou.
  if (s.emptyRate >= 0.5) {
    return "responde vazio — modelo de raciocínio estourando o max_tokens; suba LLM_MAX_TOKENS antes de julgar";
  }
  if (s.score < 0.5) return "não confie: erra mais da metade da suíte";
  const fast = s.p50 < 2500;
  const solidFormat = (s.bySkill.formato?.passed ?? 0) === (s.bySkill.formato?.total ?? 0);
  const solidPt = (s.bySkill.idioma?.passed ?? 0) === (s.bySkill.idioma?.total ?? 0);
  if (s.score === 1 && fast) return "uso interativo: acerta tudo e responde rápido";
  if (fast && !solidFormat) return "interativo sim, saída estruturada não";
  if (!fast && s.score >= 0.85) return "batch/cron: bom, mas lento demais para chat";
  if (!solidPt) return "cuidado com pt-BR: ignorou o idioma pedido";
  return "uso geral com verificação";
}

export function markdownReport(run: RunResult): string {
  const lines: string[] = [];
  const date = run.startedAt.slice(0, 10);
  lines.push(`# llm-bench — ${date}`);
  lines.push("");
  lines.push(
    `${run.models.length} modelo(s) · ${run.attempts.length} chamadas · suíte de ${TASKS.length} tarefas determinísticas`,
  );
  lines.push("");
  lines.push("| modelo | acerto | p50 | p95 | tok/s | custo | veredito |");
  lines.push("|---|---|---|---|---|---|---|");
  for (const s of run.models) {
    lines.push(
      `| \`${s.model}\` | ${s.alive ? pct(s.score) : "—"} | ${s.alive ? ms(s.p50) : "—"} | ${
        s.alive ? ms(s.p95) : "—"
      } | ${s.tokensPerSecond ? s.tokensPerSecond.toFixed(1) : "—"} | ${usd(s.totalCostUsd)} | ${verdict(s)} |`,
    );
  }

  lines.push("");
  lines.push("## Por capacidade");
  lines.push("");
  lines.push(`| modelo | ${SKILLS.join(" | ")} |`);
  lines.push(`|---|${SKILLS.map(() => "---").join("|")}|`);
  for (const s of run.models.filter((m) => m.alive)) {
    lines.push(`| \`${s.model}\` | ${SKILLS.map((k) => skillCell(s, k)).join(" | ")} |`);
  }

  const gone = vanished(run.models);
  if (gone.length) {
    lines.push("");
    lines.push("## Sumiram");
    lines.push("");
    for (const s of gone) {
      const detail = Object.entries(s.errors)
        .map(([k, v]) => `${k} ×${v}`)
        .join(", ");
      lines.push(`- \`${s.model}\` — ${detail || "sem resposta"}`);
    }
    lines.push("");
    lines.push(
      "> Free tier remove modelo sem avisar. Quem depende desses nomes quebra em silêncio.",
    );
  }

  const failures = run.attempts.filter((a) => !a.ok && !a.error);
  if (failures.length) {
    lines.push("");
    lines.push("## Falhas de conteúdo (respondeu, mas errado)");
    lines.push("");
    const seen = new Set<string>();
    for (const f of failures) {
      const key = `${f.model}|${f.task}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const task = TASKS.find((t) => t.id === f.task);
      lines.push(`- \`${f.model}\` · **${f.task}** — ${task?.why ?? ""}`);
      lines.push(
        `  > ${
          f.empty
            ? "(corpo vazio — o modelo provavelmente gastou o max_tokens raciocinando)"
            : f.output.replace(/\n/g, " ").slice(0, 140)
        }`,
      );
    }
  }

  lines.push("");
  return lines.join("\n");
}

/** Versão curta para Telegram: só o topo e o que quebrou. */
export function telegramReport(run: RunResult): string {
  const top = run.models.filter((m) => m.alive).slice(0, 5);
  const gone = vanished(run.models);
  const lines = [`*🏁 llm-bench — ${run.startedAt.slice(0, 10)}*`, ""];
  for (const [i, s] of top.entries()) {
    lines.push(`${i + 1}. \`${s.model}\` — ${pct(s.score)} · ${ms(s.p50)}`);
  }
  if (gone.length) {
    lines.push("");
    lines.push(`⚠️ sem resposta: ${gone.map((g) => `\`${g.model}\``).join(", ")}`);
  }
  return lines.join("\n");
}
