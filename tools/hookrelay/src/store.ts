import { mkdirSync } from "node:fs";

export interface Delivery {
  target: string;
  ok: boolean;
  status: number;
  attempts: number;
  error?: string;
}

export interface ReceivedRequest {
  id: string;
  method: string;
  headers: Record<string, string>;
  body: string; // truncated
  receivedAt: number;
  hmacValid: boolean | null; // null = no secret configured
  deliveries: Delivery[];
}

export interface Endpoint {
  token: string;
  name: string;
  targets: string[];
  hmacSecret?: string;
  createdAt: number;
  requests: ReceivedRequest[]; // ring buffer, newest first
}

const DATA_DIR = process.env.DATA_DIR ?? "data";
const FILE = `${DATA_DIR}/endpoints.json`;
const RING = Number(process.env.REQUEST_RING ?? 50);

function rand(bytes: number): string {
  const b = crypto.getRandomValues(new Uint8Array(bytes));
  return btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export class EndpointStore {
  private map = new Map<string, Endpoint>();

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

  // Persist after mutating a request object in place (e.g. deliveries filled in async).
  async save(): Promise<void> {
    await this.flush();
  }

  async create(name: string, targets: string[], hmacSecret?: string): Promise<Endpoint> {
    const token = rand(9);
    const ep: Endpoint = { token, name, targets, hmacSecret, createdAt: Date.now(), requests: [] };
    this.map.set(token, ep);
    await this.flush();
    return ep;
  }

  get(token: string): Endpoint | undefined {
    return this.map.get(token);
  }

  list(): Endpoint[] {
    // Strip secrets from listing.
    return [...this.map.values()].map((e) => ({ ...e, hmacSecret: e.hmacSecret ? "***" : undefined }));
  }

  async remove(token: string): Promise<boolean> {
    const ok = this.map.delete(token);
    if (ok) await this.flush();
    return ok;
  }

  newRequestId(): string {
    return rand(6);
  }

  async record(token: string, req: ReceivedRequest): Promise<void> {
    const ep = this.map.get(token);
    if (!ep) return;
    ep.requests.unshift(req);
    if (ep.requests.length > RING) ep.requests.length = RING;
    await this.flush();
  }
}
