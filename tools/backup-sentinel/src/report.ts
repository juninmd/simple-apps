import type { Snapshot, Verdict } from "./types.ts";

const ICON: Record<Verdict, string> = {
  ok: "✅",
  vazio: "⚠️",
  encolheu: "⚠️",
  corrompido: "❌",
  falhou: "❌",
};

const EXPLAIN: Record<Verdict, string> = {
  ok: "cópia abre, integridade ok",
  vazio: "abre, mas não tem linha nenhuma — o volume certo está sendo copiado?",
  encolheu: "alguma tabela perdeu linhas desde o último snapshot",
  corrompido: "integrity_check reprovou: esta cópia não serve para restaurar",
  falhou: "não deu para copiar ou abrir",
};

const kb = (bytes: number) =>
  bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;

export const worstVerdict = (snapshots: Snapshot[]): Verdict => {
  const order: Verdict[] = ["falhou", "corrompido", "encolheu", "vazio", "ok"];
  for (const v of order) if (snapshots.some((s) => s.verdict === v)) return v;
  return "ok";
};

export function textReport(snapshots: Snapshot[]): string {
  const lines: string[] = [""];
  for (const s of snapshots) {
    lines.push(`  ${ICON[s.verdict]} ${s.target} — ${EXPLAIN[s.verdict]}`);
    if (s.error) lines.push(`     erro: ${s.error}`);
    if (s.tables.length) {
      lines.push(`     ${kb(s.bytes)} · ${s.tables.map((t) => `${t.table}=${t.rows}`).join(" · ")}`);
    }
    for (const d of s.deltas) {
      const sign = d.after >= d.before ? "+" : "";
      lines.push(`     ${d.table}: ${d.before} → ${d.after} (${sign}${d.after - d.before})`);
    }
    if (s.verdict === "ok" && !s.deltas.length && s.tables.length) {
      // Nenhuma linha nova desde o último snapshot costuma ser bot parado.
      lines.push("     nada mudou desde o snapshot anterior");
    }
    lines.push(`     ${s.dir}`);
    lines.push("");
  }
  return lines.join("\n");
}

export function telegramReport(snapshots: Snapshot[]): string {
  const bad = snapshots.filter((s) => s.verdict !== "ok");
  const head = bad.length
    ? `*🛟 backup-sentinel* — ${bad.length} de ${snapshots.length} com problema`
    : `*🛟 backup-sentinel* — ${snapshots.length} backup(s) verificados, tudo ok`;
  const lines = [head, ""];
  for (const s of bad) {
    lines.push(`${ICON[s.verdict]} \`${s.target}\` — ${EXPLAIN[s.verdict]}`);
    if (s.error) lines.push(`   \`${s.error.slice(0, 150)}\``);
  }
  if (!bad.length) {
    for (const s of snapshots) {
      const total = s.tables.reduce((n, t) => n + t.rows, 0);
      lines.push(`• \`${s.target}\` — ${kb(s.bytes)}, ${total} linha(s)`);
    }
  }
  return lines.join("\n");
}
