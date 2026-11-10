import { mkdirSync } from "node:fs";
import type { Sink, SinkResult } from "./sinks";

export interface Message {
  ts: number;
  title: string;
  message: string;
  results: SinkResult[];
}

export interface Topic {
  name: string;
  token: string;
  sinks: Sink[];
  createdAt: number;
  recent: Message[]; // ring, newest first
}

const DATA_DIR = process.env.DATA_DIR ?? "data";
const FILE = `${DATA_DIR}/topics.json`;
const RING = Number(process.env.MESSAGE_RING ?? 30);

function token(): string {
  const b = crypto.getRandomValues(new Uint8Array(18));
  return btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Slug is the public topic key; kept URL-safe.
export function slug(raw: string): string {
  return raw.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
}

export class TopicStore {
  private map = new Map<string, Topic>();

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

  private async flush(): Promise<void> {
    if (this.persist) await Bun.write(FILE, JSON.stringify(Object.fromEntries(this.map)));
  }

  get(name: string): Topic | undefined {
    return this.map.get(name);
  }

  list(): Array<Omit<Topic, "token"> & { token: string }> {
    // Mask tokens in listings.
    return [...this.map.values()].map((t) => ({ ...t, token: t.token.slice(0, 6) + "…" }));
  }

  async create(rawName: string, sinks: Sink[]): Promise<Topic> {
    const name = slug(rawName);
    if (!name) throw new Error("invalid name");
    if (this.map.has(name)) throw new Error("topic exists");
    const topic: Topic = { name, token: token(), sinks, createdAt: Date.now(), recent: [] };
    this.map.set(name, topic);
    await this.flush();
    return topic;
  }

  async remove(name: string): Promise<boolean> {
    const ok = this.map.delete(name);
    if (ok) await this.flush();
    return ok;
  }

  async record(name: string, msg: Message): Promise<void> {
    const t = this.map.get(name);
    if (!t) return;
    t.recent.unshift(msg);
    if (t.recent.length > RING) t.recent.length = RING;
    await this.flush();
  }
}
