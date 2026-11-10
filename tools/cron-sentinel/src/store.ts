import { mkdirSync } from "node:fs";

export type Status = "new" | "up" | "late" | "down";

export interface Check {
  id: string;
  name: string;
  periodSec: number; // expected interval between pings
  graceSec: number; // slack before declaring down
  lastPing: number | null;
  pings: number;
  status: Status;
  createdAt: number;
}

// Pure status computation — the core the whole service hangs on.
export function computeStatus(c: Pick<Check, "lastPing" | "periodSec" | "graceSec">, now: number): Status {
  if (c.lastPing === null) return "new";
  const age = (now - c.lastPing) / 1000;
  if (age <= c.periodSec) return "up";
  if (age <= c.periodSec + c.graceSec) return "late";
  return "down";
}

const DATA_DIR = process.env.DATA_DIR ?? "data";
const FILE = `${DATA_DIR}/checks.json`;

function randomId(): string {
  const buf = crypto.getRandomValues(new Uint8Array(9));
  return btoa(String.fromCharCode(...buf)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export class CheckStore {
  private map = new Map<string, Check>();

  constructor(private persist = true) {
    if (this.persist) {
      mkdirSync(DATA_DIR, { recursive: true });
      this.load();
    }
  }

  private async load(): Promise<void> {
    try {
      const raw = await Bun.file(FILE).json();
      this.map = new Map(Object.entries(raw));
    } catch {}
  }

  private async flush(): Promise<void> {
    if (!this.persist) return;
    await Bun.write(FILE, JSON.stringify(Object.fromEntries(this.map)));
  }

  async create(name: string, periodSec: number, graceSec: number): Promise<Check> {
    const id = randomId();
    const c: Check = {
      id,
      name,
      periodSec,
      graceSec,
      lastPing: null,
      pings: 0,
      status: "new",
      createdAt: Date.now(),
    };
    this.map.set(id, c);
    await this.flush();
    return c;
  }

  async ping(id: string, now = Date.now()): Promise<boolean> {
    const c = this.map.get(id);
    if (!c) return false;
    c.lastPing = now;
    c.pings += 1;
    await this.flush();
    return true;
  }

  async remove(id: string): Promise<boolean> {
    const ok = this.map.delete(id);
    if (ok) await this.flush();
    return ok;
  }

  list(now = Date.now()): Check[] {
    return [...this.map.values()].map((c) => ({ ...c, status: computeStatus(c, now) }));
  }

  // Recompute persisted status, returning transitions for alerting.
  async reconcile(now = Date.now()): Promise<Array<{ check: Check; from: Status; to: Status }>> {
    const changes: Array<{ check: Check; from: Status; to: Status }> = [];
    for (const c of this.map.values()) {
      const to = computeStatus(c, now);
      if (to !== c.status) {
        changes.push({ check: { ...c, status: to }, from: c.status, to });
        c.status = to;
      }
    }
    if (changes.length) await this.flush();
    return changes;
  }
}
