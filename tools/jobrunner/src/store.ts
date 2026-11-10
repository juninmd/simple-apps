import { mkdirSync } from "node:fs";

export interface Run {
  ts: number;
  ok: boolean;
  status: number;
  ms: number;
  error?: string;
}

export interface Job {
  id: string;
  name: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
  intervalSec: number;
  enabled: boolean;
  lastRun: number | null;
  lastOk: boolean | null;
  nextRun: number;
  runs: number;
  history: Run[]; // ring, newest first
}

const DATA_DIR = process.env.DATA_DIR ?? "data";
const FILE = `${DATA_DIR}/jobs.json`;
const HIST = Number(process.env.HISTORY_LEN ?? 20);

function id(): string {
  const b = crypto.getRandomValues(new Uint8Array(9));
  return btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// A job is due when it's enabled and its scheduled time has passed.
export function isDue(job: Pick<Job, "enabled" | "nextRun">, now: number): boolean {
  return job.enabled && now >= job.nextRun;
}

export class JobStore {
  private map = new Map<string, Job>();

  constructor(private persist = true) {
    if (this.persist) {
      mkdirSync(DATA_DIR, { recursive: true });
      this.load();
    }
  }

  private async load(): Promise<void> {
    try {
      this.map = new Map(Object.entries(await Bun.file(FILE).json()));
    } catch {}
  }

  async flush(): Promise<void> {
    if (this.persist) await Bun.write(FILE, JSON.stringify(Object.fromEntries(this.map)));
  }

  get(jid: string): Job | undefined {
    return this.map.get(jid);
  }

  list(): Job[] {
    return [...this.map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }

  due(now: number): Job[] {
    return [...this.map.values()].filter((j) => isDue(j, now));
  }

  async create(input: {
    name: string;
    url: string;
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    intervalSec: number;
  }): Promise<Job> {
    const jid = id();
    const job: Job = {
      id: jid,
      name: input.name,
      url: input.url,
      method: (input.method ?? "GET").toUpperCase(),
      headers: input.headers ?? {},
      body: input.body,
      intervalSec: Math.max(5, input.intervalSec),
      enabled: true,
      lastRun: null,
      lastOk: null,
      nextRun: Date.now(),
      runs: 0,
      history: [],
    };
    this.map.set(jid, job);
    await this.flush();
    return job;
  }

  // Applies a completed run to the job, scheduling the next fire.
  async applyRun(jid: string, run: Run, now = Date.now()): Promise<Job | undefined> {
    const job = this.map.get(jid);
    if (!job) return;
    job.lastRun = run.ts;
    job.lastOk = run.ok;
    job.runs += 1;
    job.nextRun = now + job.intervalSec * 1000;
    job.history.unshift(run);
    if (job.history.length > HIST) job.history.length = HIST;
    await this.flush();
    return job;
  }

  async toggle(jid: string): Promise<boolean | null> {
    const job = this.map.get(jid);
    if (!job) return null;
    job.enabled = !job.enabled;
    if (job.enabled) job.nextRun = Date.now();
    await this.flush();
    return job.enabled;
  }

  async remove(jid: string): Promise<boolean> {
    const ok = this.map.delete(jid);
    if (ok) await this.flush();
    return ok;
  }
}
