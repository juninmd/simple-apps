import { describe, expect, test } from "bun:test";
import { attempt, benchmark, pool } from "../src/bench.ts";
import { GatewayError } from "../src/client.ts";
import { loadConfig, selectModels } from "../src/config.ts";
import { markdownReport, telegramReport, verdict } from "../src/report.ts";
import { percentile, rank, summarize, vanished } from "../src/stats.ts";
import { createStore, regressions } from "../src/store.ts";
import type { ChatRequest, ChatResponse, GatewayClient, Task } from "../src/types.ts";

const config = loadConfig({ repeats: 1, concurrency: 2, dbPath: ":memory:" }, {});

const tasks: Task[] = [
  {
    id: "eco",
    skill: "instrucao",
    prompt: "diga OK",
    check: (out) => out.trim() === "OK",
    why: "não obedece",
  },
  {
    id: "conta",
    skill: "raciocinio",
    prompt: "2+2",
    check: (out) => out.includes("4"),
    why: "erra conta",
  },
];

function fakeClient(
  behavior: (req: ChatRequest) => Promise<ChatResponse> | ChatResponse,
  models: string[] = ["bom", "ruim"],
): GatewayClient {
  return {
    listModels: async () => models,
    chat: async (req) => behavior(req),
  };
}

const answer = (text: string, completion = 10): ChatResponse => ({
  text,
  promptTokens: 5,
  completionTokens: completion,
  costUsd: 0.0001,
});

describe("attempt", () => {
  test("acerto vira ok com latência medida", async () => {
    const client = fakeClient(() => answer("OK"));
    const a = await attempt("bom", tasks[0] as Task, { client, config });
    expect(a.ok).toBe(true);
    expect(a.error).toBeNull();
    expect(a.latencyMs).toBeGreaterThanOrEqual(0);
  });

  test("resposta errada é falha de conteúdo, não erro", async () => {
    const client = fakeClient(() => answer("claro, OK!"));
    const a = await attempt("bom", tasks[0] as Task, { client, config });
    expect(a.ok).toBe(false);
    expect(a.error).toBeNull();
    expect(a.output).toBe("claro, OK!");
  });

  test("erro de gateway vira dado, não exceção", async () => {
    const client = fakeClient(() => {
      throw new GatewayError(404, "404: model not found");
    });
    const a = await attempt("sumido", tasks[0] as Task, { client, config });
    expect(a.ok).toBe(false);
    expect(a.error).toContain("404");
  });

  test("output longo é truncado para não inflar o histórico", async () => {
    const client = fakeClient(() => answer("x".repeat(2000)));
    const a = await attempt("bom", tasks[0] as Task, { client, config });
    expect(a.output.length).toBe(500);
  });
});

describe("pool", () => {
  test("respeita o limite de chamadas em voo", async () => {
    let inFlight = 0;
    let peak = 0;
    const jobs = Array.from({ length: 10 }, () => async () => {
      inFlight++;
      peak = Math.max(peak, inFlight);
      await new Promise((r) => setTimeout(r, 5));
      inFlight--;
      return 1;
    });
    const out = await pool(jobs, 3);
    expect(out).toHaveLength(10);
    expect(peak).toBeLessThanOrEqual(3);
  });

  test("preserva a ordem dos resultados", async () => {
    const jobs = [1, 2, 3].map((n) => async () => n);
    expect(await pool(jobs, 2)).toEqual([1, 2, 3]);
  });
});

describe("benchmark", () => {
  test("modelo que acerta tudo pontua 100%", async () => {
    const client = fakeClient((req) => answer(req.prompt === "2+2" ? "4" : "OK"));
    const run = await benchmark(["bom"], { client, config, tasks });
    expect(run.models[0]?.score).toBe(1);
    expect(run.models[0]?.alive).toBe(true);
  });

  test("modelo morto é marcado como não vivo e vai para o fim do placar", async () => {
    const client: GatewayClient = {
      listModels: async () => ["bom", "morto"],
      chat: async (req) => {
        if (req.model === "morto") throw new GatewayError(404, "404: not found");
        return answer(req.prompt === "2+2" ? "4" : "OK");
      },
    };
    const run = await benchmark(["morto", "bom"], { client, config, tasks });
    expect(run.models[0]?.model).toBe("bom");
    expect(run.models[1]?.alive).toBe(false);
    expect(vanished(run.models).map((m) => m.model)).toEqual(["morto"]);
  });

  test("placar separa acerto por capacidade", async () => {
    const client = fakeClient(() => answer("OK")); // acerta "eco", erra "conta"
    const run = await benchmark(["meio"], { client, config, tasks });
    expect(run.models[0]?.bySkill.instrucao).toEqual({ passed: 1, total: 1 });
    expect(run.models[0]?.bySkill.raciocinio).toEqual({ passed: 0, total: 1 });
  });

  test("timeout é registrado como erro de transporte", async () => {
    const client = fakeClient(() => {
      const e = new Error("The operation timed out.");
      e.name = "TimeoutError";
      throw e;
    });
    const run = await benchmark(["lento"], { client, config, tasks });
    expect(run.attempts[0]?.error).toBe("timeout");
  });
});

describe("stats", () => {
  test("percentil interpola em vez de pegar o maior", () => {
    expect(percentile([10, 20, 30, 40], 50)).toBe(25);
    expect(percentile([100], 95)).toBe(100);
    expect(percentile([], 50)).toBe(0);
  });

  test("summarize calcula tokens por segundo", () => {
    const s = summarize("m", [
      {
        model: "m",
        task: "t",
        skill: "instrucao",
        ok: true,
        latencyMs: 1000,
        promptTokens: 5,
        completionTokens: 50,
        costUsd: 0.01,
        error: null,
        empty: false,
        output: "",
      },
    ]);
    expect(s.tokensPerSecond).toBe(50);
    expect(s.totalCostUsd).toBe(0.01);
  });

  test("rank põe vivo antes de morto e rápido antes de lento no empate", () => {
    const base = {
      attempts: 2,
      passed: 2,
      avgCompletionTokens: null,
      tokensPerSecond: null,
      totalCostUsd: null,
      errors: {},
      bySkill: {},
      emptyRate: 0,
    };
    const out = rank([
      { ...base, model: "lento", score: 1, p50: 5000, p95: 5000, alive: true },
      { ...base, model: "morto", score: 0, p50: 0, p95: 0, alive: false },
      { ...base, model: "rapido", score: 1, p50: 100, p95: 100, alive: true },
    ]);
    expect(out.map((m) => m.model)).toEqual(["rapido", "lento", "morto"]);
  });
});

describe("relatório", () => {
  const build = async () => {
    const client = fakeClient((req) => answer(req.prompt === "2+2" ? "4" : "OK"));
    return benchmark(["bom"], { client, config, tasks });
  };

  test("markdown tem placar e tabela por capacidade", async () => {
    const md = markdownReport(await build());
    expect(md).toContain("| modelo | acerto | p50 |");
    expect(md).toContain("Por capacidade");
    expect(md).toContain("`bom`");
  });

  test("markdown lista quem sumiu com o código do erro", async () => {
    const client = fakeClient(() => {
      throw new GatewayError(404, "404: model not found");
    });
    const md = markdownReport(await benchmark(["sumido"], { client, config, tasks }));
    expect(md).toContain("## Sumiram");
    expect(md).toContain("404");
  });

  test("markdown mostra o que o modelo respondeu quando erra o conteúdo", async () => {
    const client = fakeClient(() => answer("resposta bem errada"));
    const md = markdownReport(await benchmark(["errado"], { client, config, tasks }));
    expect(md).toContain("Falhas de conteúdo");
    expect(md).toContain("resposta bem errada");
  });

  test("telegram é curto e cita quem sumiu", async () => {
    const client: GatewayClient = {
      listModels: async () => [],
      chat: async (req) => {
        if (req.model === "morto") throw new GatewayError(500, "500: erro");
        return answer("OK");
      },
    };
    const short = telegramReport(await benchmark(["bom", "morto"], { client, config, tasks }));
    expect(short).toContain("llm-bench");
    expect(short).toContain("sem resposta");
    expect(short.length).toBeLessThan(500);
  });

  test("resposta vazia é diagnosticada como max_tokens, não como erro do modelo", async () => {
    const client = fakeClient(() => answer(""));
    const run = await benchmark(["pensador"], { client, config, tasks });
    expect(run.models[0]?.emptyRate).toBe(1);
    expect(verdict(run.models[0] as never)).toContain("max_tokens");
    expect(markdownReport(run)).toContain("gastou o max_tokens raciocinando");
  });

  test("veredito reprova modelo que erra mais da metade", () => {
    expect(
      verdict({
        model: "x",
        attempts: 4,
        passed: 1,
        score: 0.25,
        p50: 100,
        p95: 100,
        avgCompletionTokens: null,
        tokensPerSecond: null,
        totalCostUsd: null,
        errors: {},
        bySkill: {},
        alive: true,
        emptyRate: 0,
      }),
    ).toContain("não confie");
  });
});

describe("histórico", () => {
  test("regressions acusa modelo que parou de responder", () => {
    const before = [{ model: "a", alive: true, score: 1, p50: 100 }] as never;
    const now = [{ model: "a", alive: false, score: 0, p50: 0 }] as never;
    expect(regressions(before, now)[0]?.change).toBe("parou de responder");
  });

  test("regressions acusa queda de acerto e lentidão", () => {
    const before = [
      { model: "a", alive: true, score: 1, p50: 100 },
      { model: "b", alive: true, score: 1, p50: 100 },
    ] as never;
    const now = [
      { model: "a", alive: true, score: 0.5, p50: 100 },
      { model: "b", alive: true, score: 1, p50: 500 },
    ] as never;
    const out = regressions(before, now);
    expect(out.find((r) => r.model === "a")?.change).toContain("acerto caiu");
    expect(out.find((r) => r.model === "b")?.change).toContain("mais lento");
  });

  test("regressions acusa modelo que saiu da lista do gateway", () => {
    const before = [{ model: "sumido", alive: true, score: 1, p50: 100 }] as never;
    expect(regressions(before, [])[0]?.change).toBe("sumiu da lista do gateway");
  });

  test("primeira corrida não gera alarme", () => {
    expect(regressions(null, [])).toEqual([]);
  });

  test("store guarda e relê a última corrida", async () => {
    const client = fakeClient((req) => answer(req.prompt === "2+2" ? "4" : "OK"));
    const run = await benchmark(["bom"], { client, config, tasks });
    const store = createStore(":memory:");
    store.save(run);
    expect(store.lastRunModels()?.[0]?.model).toBe("bom");
    expect(store.history("bom", 5)).toHaveLength(1);
    store.close();
  });
});

describe("seleção de modelos", () => {
  test("sem lista explícita usa tudo do gateway", () => {
    expect(selectModels(["a", "b"], loadConfig({}, {}))).toEqual(["a", "b"]);
  });

  test("skip remove o indesejado", () => {
    expect(selectModels(["a", "b"], loadConfig({ skipModels: ["b"] }, {}))).toEqual(["a"]);
  });

  test("lista explícita vence o que o gateway anuncia", () => {
    expect(selectModels(["a", "b"], loadConfig({ models: ["c"] }, {}))).toEqual(["c"]);
  });
});
