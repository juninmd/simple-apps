import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { Database } from "bun:sqlite";
import type { ModelSummary, RunResult } from "./types.ts";

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS runs (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    started_at   TEXT NOT NULL,
    finished_at  TEXT NOT NULL,
    models       INTEGER NOT NULL,
    attempts     INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS model_runs (
    run_id       INTEGER NOT NULL,
    model        TEXT NOT NULL,
    alive        INTEGER NOT NULL,
    score        REAL NOT NULL,
    p50          REAL NOT NULL,
    p95          REAL NOT NULL,
    tokens_per_s REAL,
    cost_usd     REAL,
    PRIMARY KEY (run_id, model)
  );
  CREATE INDEX IF NOT EXISTS idx_model_runs_model ON model_runs(model, run_id);
`;

export interface HistoryPoint {
  startedAt: string;
  score: number;
  p50: number;
  alive: number;
}

export interface Store {
  save(run: RunResult): number;
  history(model: string, limit: number): HistoryPoint[];
  lastRunModels(): ModelSummary[] | null;
  close(): void;
}

export function createStore(dbPath: string): Store {
  if (dbPath !== ":memory:") mkdirSync(dirname(dbPath), { recursive: true });
  const db = new Database(dbPath, { create: true });
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec(SCHEMA);

  const insertRun = db.prepare(
    "INSERT INTO runs (started_at, finished_at, models, attempts) VALUES (?, ?, ?, ?)",
  );
  const insertModel = db.prepare(
    `INSERT OR REPLACE INTO model_runs
     (run_id, model, alive, score, p50, p95, tokens_per_s, cost_usd)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  return {
    save(run: RunResult): number {
      const tx = db.transaction((): number => {
        insertRun.run(run.startedAt, run.finishedAt, run.models.length, run.attempts.length);
        const id = Number(
          (db.query<{ id: number }, []>("SELECT last_insert_rowid() AS id").get() ?? { id: 0 }).id,
        );
        for (const m of run.models) {
          insertModel.run(
            id,
            m.model,
            m.alive ? 1 : 0,
            m.score,
            m.p50,
            m.p95,
            m.tokensPerSecond,
            m.totalCostUsd,
          );
        }
        return id;
      });
      return tx();
    },

    history(model: string, limit: number): HistoryPoint[] {
      return db
        .query<HistoryPoint, [string, number]>(
          `SELECT r.started_at AS startedAt, m.score, m.p50, m.alive
           FROM model_runs m JOIN runs r ON r.id = m.run_id
           WHERE m.model = ? ORDER BY r.id DESC LIMIT ?`,
        )
        .all(model, limit);
    },

    lastRunModels(): ModelSummary[] | null {
      const last = db.query<{ id: number }, []>("SELECT id FROM runs ORDER BY id DESC LIMIT 1").get();
      if (!last) return null;
      const rows = db
        .query<
          { model: string; alive: number; score: number; p50: number; p95: number },
          [number]
        >("SELECT model, alive, score, p50, p95 FROM model_runs WHERE run_id = ?")
        .all(last.id);
      return rows.map((r) => ({
        model: r.model,
        attempts: 0,
        passed: 0,
        score: r.score,
        p50: r.p50,
        p95: r.p95,
        avgCompletionTokens: null,
        tokensPerSecond: null,
        totalCostUsd: null,
        errors: {},
        bySkill: {},
        alive: r.alive === 1,
        emptyRate: 0,
      }));
    },

    close() {
      db.close();
    },
  };
}

/**
 * Compara a corrida atual com a anterior e devolve o que mudou de status.
 * É o alerta que importa: o modelo que funcionava ontem e sumiu hoje.
 */
export function regressions(
  previous: ModelSummary[] | null,
  current: ModelSummary[],
): { model: string; change: string }[] {
  if (!previous) return [];
  const before = new Map(previous.map((m) => [m.model, m]));
  const out: { model: string; change: string }[] = [];
  for (const now of current) {
    const then = before.get(now.model);
    if (!then) {
      out.push({ model: now.model, change: "novo no gateway" });
      continue;
    }
    if (then.alive && !now.alive) {
      out.push({ model: now.model, change: "parou de responder" });
    } else if (!then.alive && now.alive) {
      out.push({ model: now.model, change: "voltou a responder" });
    } else if (then.score - now.score >= 0.25) {
      out.push({
        model: now.model,
        change: `acerto caiu de ${Math.round(then.score * 100)}% para ${Math.round(now.score * 100)}%`,
      });
    } else if (then.p50 > 0 && now.p50 > then.p50 * 2) {
      out.push({
        model: now.model,
        change: `ficou ${(now.p50 / then.p50).toFixed(1)}x mais lento`,
      });
    }
  }
  for (const old of previous) {
    if (!current.some((c) => c.model === old.model)) {
      out.push({ model: old.model, change: "sumiu da lista do gateway" });
    }
  }
  return out;
}
