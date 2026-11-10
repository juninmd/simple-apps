export interface Target {
  /** nome curto do backup, usado no diretório e no relatório */
  name: string;
  namespace: string;
  /** selector do pod dono do volume */
  selector: string;
  container?: string;
  /** caminho do arquivo SQLite dentro do container */
  path: string;
  /** tabelas cuja contagem de linhas é acompanhada entre snapshots */
  tables?: string[];
  /** quantos snapshots manter (padrão global se ausente) */
  keep?: number;
}

export interface RunResult {
  code: number;
  stdout: string;
  stderr: string;
  /** bytes crus, para quando a saída é binária */
  bytes?: Uint8Array;
}

export interface RunOptions {
  /** captura stdout binário em vez de texto */
  binary?: boolean;
  display?: string;
}

/** Executor de processo. Injetável: nos testes nada roda de verdade. */
export type Runner = (cmd: string[], opts?: RunOptions) => Promise<RunResult>;

export interface TableCount {
  table: string;
  rows: number;
}

export type Verdict = "ok" | "vazio" | "corrompido" | "encolheu" | "falhou";

export interface Snapshot {
  target: string;
  takenAt: string;
  pod: string;
  /** diretório local onde os arquivos ficaram */
  dir: string;
  bytes: number;
  /** resultado do PRAGMA integrity_check */
  integrity: string;
  tables: TableCount[];
  verdict: Verdict;
  /** o que mudou em relação ao snapshot anterior */
  deltas: { table: string; before: number; after: number }[];
  error: string | null;
  durationMs: number;
}

export interface Config {
  targetsFile: string;
  backupDir: string;
  keep: number;
  kubeContext: string;
  telegramToken: string;
  telegramChatIds: string[];
  /** falha o processo quando algum alvo não passa na verificação */
  strict: boolean;
}
