import { GatewayError } from "./client.ts";
import { TASKS } from "./tasks.ts";
import type { Attempt, Config, GatewayClient, RunResult, Task } from "./types.ts";
import { rank, summarize } from "./stats.ts";

export interface BenchDeps {
  client: GatewayClient;
  config: Config;
  log?: (msg: string) => void;
  now?: () => Date;
  tasks?: Task[];
}

/** Executa uma tarefa contra um modelo. Erro de gateway vira dado, não exceção. */
export async function attempt(
  model: string,
  task: Task,
  deps: BenchDeps,
): Promise<Attempt> {
  const started = performance.now();
  const base = { model, task: task.id, skill: task.skill };
  try {
    const res = await deps.client.chat({
      model,
      system: task.system,
      prompt: task.prompt,
      maxTokens: task.maxTokens,
    });
    return {
      ...base,
      ok: task.check(res.text),
      latencyMs: Math.round(performance.now() - started),
      promptTokens: res.promptTokens,
      completionTokens: res.completionTokens,
      costUsd: res.costUsd,
      error: null,
      empty: res.text.trim() === "",
      output: res.text.slice(0, 500),
    };
  } catch (err) {
    const message =
      err instanceof GatewayError
        ? err.message
        : ((err as Error).name === "TimeoutError" ? "timeout" : (err as Error).message);
    return {
      ...base,
      ok: false,
      latencyMs: Math.round(performance.now() - started),
      promptTokens: null,
      completionTokens: null,
      costUsd: null,
      error: message,
      empty: false,
      output: "",
    };
  }
}

/** Roda `jobs` com no máximo `limit` em voo — o gateway não é infinito. */
export async function pool<T>(jobs: (() => Promise<T>)[], limit: number): Promise<T[]> {
  const out: T[] = new Array(jobs.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.max(1, Math.min(limit, jobs.length)) }, async () => {
    for (;;) {
      const index = cursor++;
      const job = jobs[index];
      if (!job) return;
      out[index] = await job();
    }
  });
  await Promise.all(workers);
  return out;
}

export async function benchmark(models: string[], deps: BenchDeps): Promise<RunResult> {
  const log = deps.log ?? (() => {});
  const now = deps.now ?? (() => new Date());
  const tasks = deps.tasks ?? TASKS;
  const startedAt = now().toISOString();

  const attempts: Attempt[] = [];
  for (const model of models) {
    const jobs = tasks.flatMap((task) =>
      Array.from({ length: deps.config.repeats }, () => () => attempt(model, task, deps)),
    );
    const results = await pool(jobs, deps.config.concurrency);
    attempts.push(...results);
    const summary = summarize(model, results);
    log(
      summary.alive
        ? `  ${model}: ${summary.passed}/${summary.attempts} · p50 ${Math.round(summary.p50)}ms`
        : `  ${model}: NÃO RESPONDE (${Object.entries(summary.errors)
            .map(([k, v]) => `${k}×${v}`)
            .join(", ")})`,
    );
  }

  const summaries = rank(models.map((m) => summarize(m, attempts)));
  return { startedAt, finishedAt: now().toISOString(), models: summaries, attempts };
}
