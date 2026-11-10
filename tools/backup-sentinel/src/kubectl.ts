import type { RunOptions, RunResult, Runner } from "./types.ts";

export function createRunner(timeoutMs = 300_000): Runner {
  return async (cmd: string[], opts: RunOptions = {}): Promise<RunResult> => {
    const proc = Bun.spawn(cmd, { stdout: "pipe", stderr: "pipe", stdin: "ignore" });
    const timer = setTimeout(() => proc.kill(), timeoutMs);
    try {
      if (opts.binary) {
        const [buffer, stderr, code] = await Promise.all([
          new Response(proc.stdout).arrayBuffer(),
          new Response(proc.stderr).text(),
          proc.exited,
        ]);
        return { code, stdout: "", stderr, bytes: new Uint8Array(buffer) };
      }
      const [stdout, stderr, code] = await Promise.all([
        new Response(proc.stdout).text(),
        new Response(proc.stderr).text(),
        proc.exited,
      ]);
      return { code, stdout, stderr };
    } finally {
      clearTimeout(timer);
    }
  };
}

const ctx = (kubeContext: string) => (kubeContext ? ["--context", kubeContext] : []);

/** Nome do primeiro pod pronto que bate no selector. */
export async function findPod(
  run: Runner,
  kubeContext: string,
  namespace: string,
  selector: string,
): Promise<string> {
  const res = await run([
    "kubectl",
    ...ctx(kubeContext),
    "-n",
    namespace,
    "get",
    "pods",
    "-l",
    selector,
    "--field-selector",
    "status.phase=Running",
    "-o",
    "jsonpath={.items[*].metadata.name}",
  ]);
  if (res.code !== 0) throw new Error(`kubectl get pods falhou: ${res.stderr.trim().slice(0, 200)}`);
  const pod = res.stdout.trim().split(/\s+/).filter(Boolean)[0];
  if (!pod) throw new Error(`nenhum pod Running com selector "${selector}" em ${namespace}`);
  return pod;
}

/** Lê um arquivo do container como bytes. Vazio quando o arquivo não existe. */
export async function readRemoteFile(
  run: Runner,
  kubeContext: string,
  namespace: string,
  pod: string,
  container: string | undefined,
  path: string,
): Promise<Uint8Array | null> {
  const res = await run(
    [
      "kubectl",
      ...ctx(kubeContext),
      "-n",
      namespace,
      "exec",
      pod,
      ...(container ? ["-c", container] : []),
      "--",
      "sh",
      "-c",
      // `cat` de arquivo ausente não pode derrubar o backup: -wal e -shm são opcionais.
      `[ -f ${path} ] && cat ${path} || true`,
    ],
    { binary: true },
  );
  if (res.code !== 0) {
    throw new Error(`exec falhou em ${pod}:${path} — ${res.stderr.trim().slice(0, 200)}`);
  }
  const bytes = res.bytes ?? new Uint8Array();
  return bytes.length ? bytes : null;
}
