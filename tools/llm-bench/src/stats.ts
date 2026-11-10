import type { Attempt, ModelSummary } from "./types.ts";

/** Percentil por interpolação linear — com 4 amostras, "o maior" não é p95. */
export function percentile(values: number[], p: number): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  if (sorted.length === 1) return sorted[0] as number;
  const rank = (p / 100) * (sorted.length - 1);
  const low = Math.floor(rank);
  const high = Math.ceil(rank);
  const lo = sorted[low] as number;
  const hi = sorted[high] as number;
  return lo + (hi - lo) * (rank - low);
}

const mean = (values: number[]) =>
  values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;

/** Agrupa as tentativas de um modelo em uma linha do placar. */
export function summarize(model: string, attempts: Attempt[]): ModelSummary {
  const mine = attempts.filter((a) => a.model === model);
  const answered = mine.filter((a) => !a.error);
  const latencies = answered.map((a) => a.latencyMs);
  const completions = answered
    .map((a) => a.completionTokens)
    .filter((n): n is number => typeof n === "number");

  const errors: Record<string, number> = {};
  for (const a of mine) {
    if (!a.error) continue;
    const key = /^(\d{3})/.exec(a.error)?.[1] ?? "erro";
    errors[key] = (errors[key] ?? 0) + 1;
  }

  const bySkill: ModelSummary["bySkill"] = {};
  for (const a of mine) {
    const s = (bySkill[a.skill] ??= { passed: 0, total: 0 });
    s.total++;
    if (a.ok) s.passed++;
  }

  const costs = mine.map((a) => a.costUsd).filter((n): n is number => typeof n === "number");
  const avgCompletion = mean(completions);
  const avgLatency = mean(latencies);

  return {
    model,
    attempts: mine.length,
    passed: mine.filter((a) => a.ok).length,
    score: mine.length ? mine.filter((a) => a.ok).length / mine.length : 0,
    p50: percentile(latencies, 50),
    p95: percentile(latencies, 95),
    avgCompletionTokens: avgCompletion,
    tokensPerSecond:
      avgCompletion && avgLatency ? (avgCompletion / avgLatency) * 1000 : null,
    totalCostUsd: costs.length ? costs.reduce((a, b) => a + b, 0) : null,
    errors,
    bySkill,
    alive: answered.length > 0,
    emptyRate: answered.length
      ? answered.filter((a) => a.empty).length / answered.length
      : 0,
  };
}

/**
 * Ordem do placar: vivo primeiro, depois acerto, depois latência.
 * Modelo rápido que erra tudo não pode ficar no topo.
 */
export function rank(summaries: ModelSummary[]): ModelSummary[] {
  return [...summaries].sort((a, b) => {
    if (a.alive !== b.alive) return a.alive ? -1 : 1;
    if (b.score !== a.score) return b.score - a.score;
    return a.p50 - b.p50;
  });
}

/** Modelos que o gateway lista mas que não respondem: o free tier tirou embaixo. */
export function vanished(summaries: ModelSummary[]): ModelSummary[] {
  return summaries.filter((s) => !s.alive);
}
