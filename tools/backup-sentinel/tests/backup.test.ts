import { describe, expect, test } from "bun:test";
import { backupTarget, prune, stampFor } from "../src/backup.ts";
import type { BackupIO } from "../src/backup.ts";
import { loadConfig, parseTargets } from "../src/config.ts";
import { telegramReport, textReport, worstVerdict } from "../src/report.ts";
import type { RunResult, Snapshot, TableCount, Target } from "../src/types.ts";
import type { VerifyResult } from "../src/verify.ts";

const config = loadConfig({ backupDir: "/tmp/bk", keep: 3, kubeContext: "" }, {});

const [target] = parseTargets([
  {
    name: "cve-radar",
    namespace: "bots",
    selector: "app=cve-radar",
    path: "/data/store.db",
    tables: ["items"],
  },
]) as [Target];

interface Harness {
  io: BackupIO;
  cmds: string[][];
  written: string[];
  removed: string[];
  logs: string[];
}

function harness(over: {
  pods?: string;
  files?: Record<string, string>;
  verify?: VerifyResult;
  dirs?: string[];
  execFails?: boolean;
} = {}): Harness {
  const cmds: string[][] = [];
  const written: string[] = [];
  const removed: string[] = [];
  const logs: string[] = [];
  const files = over.files ?? { "/data/store.db": "conteudo-do-banco" };

  const io: BackupIO = {
    run: async (cmd): Promise<RunResult> => {
      cmds.push(cmd);
      if (cmd.includes("get")) {
        return { code: 0, stdout: over.pods ?? "cve-radar-abc123", stderr: "" };
      }
      if (over.execFails) return { code: 1, stdout: "", stderr: "container not found" };
      const script = cmd.at(-1) ?? "";
      const path = /\[ -f (\S+) \]/.exec(script)?.[1] ?? "";
      const content = files[path];
      return {
        code: 0,
        stdout: "",
        stderr: "",
        bytes: content ? new TextEncoder().encode(content) : new Uint8Array(),
      };
    },
    write: async (path) => {
      written.push(path.replace(/\\/g, "/"));
    },
    verify: () => over.verify ?? { integrity: "ok", tables: [{ table: "items", rows: 42 }], error: null },
    listDirs: () => over.dirs ?? [],
    remove: (dir) => removed.push(dir.replace(/\\/g, "/")),
    sizeOf: () => 1024,
    log: (m) => logs.push(m),
    now: () => new Date("2026-08-21T03:00:00Z"),
  };
  return { io, cmds, written, removed, logs };
}

describe("backupTarget", () => {
  test("acha o pod pelo selector e copia o banco", async () => {
    const h = harness();
    const snap = await backupTarget(target, config, h.io, null);
    expect(snap.pod).toBe("cve-radar-abc123");
    expect(snap.verdict).toBe("ok");
    expect(h.written.some((p) => p.endsWith("store.db"))).toBe(true);
  });

  test("leva -wal e -shm junto quando existem", async () => {
    const h = harness({
      files: {
        "/data/store.db": "banco",
        "/data/store.db-wal": "wal",
        "/data/store.db-shm": "shm",
      },
    });
    await backupTarget(target, config, h.io, null);
    expect(h.written.some((p) => p.endsWith("store.db-wal"))).toBe(true);
    expect(h.written.some((p) => p.endsWith("store.db-shm"))).toBe(true);
  });

  test("ausência de -wal e -shm é normal e não falha", async () => {
    const h = harness();
    const snap = await backupTarget(target, config, h.io, null);
    expect(snap.verdict).toBe("ok");
    expect(h.written.filter((p) => p.includes("store.db")).length).toBe(1);
  });

  test("banco principal ausente é falha, não sucesso silencioso", async () => {
    const h = harness({ files: {} });
    const snap = await backupTarget(target, config, h.io, null);
    expect(snap.verdict).toBe("falhou");
    expect(snap.error).toContain("não existe ou está vazio");
  });

  test("pod inexistente vira erro explicativo", async () => {
    const h = harness({ pods: "" });
    const snap = await backupTarget(target, config, h.io, null);
    expect(snap.verdict).toBe("falhou");
    expect(snap.error).toContain("nenhum pod Running");
  });

  test("exec que falha não deixa o snapshot passar por bom", async () => {
    const h = harness({ execFails: true });
    const snap = await backupTarget(target, config, h.io, null);
    expect(snap.verdict).toBe("falhou");
    expect(snap.error).toContain("exec falhou");
  });

  test("cópia corrompida é reprovada mesmo com bytes em disco", async () => {
    const h = harness({
      verify: { integrity: "database disk image is malformed", tables: [], error: null },
    });
    const snap = await backupTarget(target, config, h.io, null);
    expect(snap.verdict).toBe("corrompido");
  });

  test("compara com o snapshot anterior e registra o delta", async () => {
    const h = harness();
    const previous: TableCount[] = [{ table: "items", rows: 30 }];
    const snap = await backupTarget(target, config, h.io, previous);
    expect(snap.deltas).toEqual([{ table: "items", before: 30, after: 42 }]);
  });

  test("usa o container quando o alvo especifica", async () => {
    const h = harness();
    const [withContainer] = parseTargets([{ ...target, container: "app" }]) as [Target];
    await backupTarget(withContainer, config, h.io, null);
    const exec = h.cmds.find((c) => c.includes("exec")) ?? [];
    expect(exec).toContain("-c");
    expect(exec).toContain("app");
  });

  test("o diretório do snapshot é ordenável por data", () => {
    expect(stampFor(new Date("2026-08-21T03:04:05.678Z"))).toBe("2026-08-21T03-04-05-678Z");
    expect(stampFor(new Date("2026-08-02T00:00:00Z")) < stampFor(new Date("2026-08-10T00:00:00Z"))).toBe(
      true,
    );
  });
});

describe("prune", () => {
  test("remove os excedentes e mantém os mais novos", () => {
    const h = harness({
      dirs: ["2026-08-01T00-00-00-000Z", "2026-08-02T00-00-00-000Z", "2026-08-03T00-00-00-000Z", "2026-08-04T00-00-00-000Z"],
    });
    const removed = prune(target, config, h.io);
    expect(removed).toEqual(["2026-08-01T00-00-00-000Z"]);
    expect(h.removed[0]).toContain("cve-radar/2026-08-01");
  });

  test("keep por alvo vence o global", () => {
    const h = harness({ dirs: ["a", "b", "c", "d"] });
    const removed = prune({ ...target, keep: 1 }, config, h.io);
    expect(removed).toHaveLength(3);
  });
});

describe("catálogo", () => {
  test("recusa path relativo", () => {
    expect(() =>
      parseTargets([{ name: "x", namespace: "n", selector: "a=b", path: "store.db" }]),
    ).toThrow("absoluto");
  });

  test("recusa path com injeção de comando", () => {
    for (const path of ["/data/a;rm -rf /", '/data/a"b', "/data/$(id)", "/data/a b"]) {
      expect(() =>
        parseTargets([{ name: "x", namespace: "n", selector: "a=b", path }]),
      ).toThrow();
    }
  });

  test("recusa nome que escaparia do diretório de backup", () => {
    expect(() =>
      parseTargets([{ name: "../etc", namespace: "n", selector: "a=b", path: "/d/s.db" }]),
    ).toThrow("caractere inválido");
  });

  test("recusa nome duplicado e campos ausentes", () => {
    expect(() =>
      parseTargets([
        { name: "x", namespace: "n", selector: "a=b", path: "/d/s.db" },
        { name: "x", namespace: "n", selector: "a=b", path: "/d/s.db" },
      ]),
    ).toThrow("duplicado");
    expect(() => parseTargets([{ name: "x", selector: "a=b", path: "/d/s.db" }])).toThrow("namespace");
    expect(() => parseTargets([{ name: "x", namespace: "n", path: "/d/s.db" }])).toThrow("selector");
  });

  test("recusa arquivo que não é array", () => {
    expect(() => parseTargets({})).toThrow("array");
  });
});

describe("relatório", () => {
  const snap = (over: Partial<Snapshot>): Snapshot => ({
    target: "cve-radar",
    takenAt: "2026-08-21T03:00:00Z",
    pod: "p",
    dir: "/tmp/bk/cve-radar/2026",
    bytes: 4096,
    integrity: "ok",
    tables: [{ table: "items", rows: 42 }],
    verdict: "ok",
    deltas: [],
    error: null,
    durationMs: 10,
    ...over,
  });

  test("texto explica cada veredito", () => {
    const out = textReport([snap({ verdict: "vazio" })]);
    expect(out).toContain("volume certo");
  });

  test("texto mostra o delta com sinal", () => {
    const out = textReport([snap({ deltas: [{ table: "items", before: 30, after: 42 }] })]);
    expect(out).toContain("items: 30 → 42 (+12)");
  });

  test("texto avisa quando nada mudou desde o snapshot anterior", () => {
    expect(textReport([snap({})])).toContain("nada mudou");
  });

  test("telegram só detalha o que deu problema", () => {
    const out = telegramReport([snap({}), snap({ target: "ruim", verdict: "corrompido" })]);
    expect(out).toContain("1 de 2 com problema");
    expect(out).toContain("ruim");
  });

  test("telegram confirma quando está tudo ok", () => {
    expect(telegramReport([snap({})])).toContain("tudo ok");
  });

  test("worstVerdict prioriza a falha mais grave", () => {
    expect(worstVerdict([snap({}), snap({ verdict: "encolheu" }), snap({ verdict: "falhou" })])).toBe(
      "falhou",
    );
    expect(worstVerdict([snap({}), snap({ verdict: "vazio" })])).toBe("vazio");
    expect(worstVerdict([snap({})])).toBe("ok");
  });
});
