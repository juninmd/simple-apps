export interface Task {
  id: string;
  /** para que serve na prática: o placar é por capacidade, não uma nota só */
  skill: "instrucao" | "formato" | "raciocinio" | "idioma" | "extracao";
  system?: string;
  prompt: string;
  /** determinístico de propósito: nada de LLM julgando LLM */
  check: (output: string) => boolean;
  /** o que a falha significa, mostrado no relatório */
  why: string;
  maxTokens?: number;
}

export interface Attempt {
  model: string;
  task: string;
  skill: Task["skill"];
  ok: boolean;
  latencyMs: number;
  promptTokens: number | null;
  completionTokens: number | null;
  costUsd: number | null;
  /** erro de transporte/gateway; `ok` falso sem erro = respondeu, mas errado */
  error: string | null;
  /** respondeu com corpo vazio — modelo de raciocínio costuma gastar o orçamento pensando */
  empty: boolean;
  output: string;
}

export interface ChatResponse {
  text: string;
  promptTokens: number | null;
  completionTokens: number | null;
  costUsd: number | null;
}

export interface ChatRequest {
  model: string;
  system?: string;
  prompt: string;
  maxTokens?: number;
}

/** Cliente do gateway. Injetável: os testes não tocam a rede. */
export interface GatewayClient {
  listModels(): Promise<string[]>;
  chat(req: ChatRequest): Promise<ChatResponse>;
}

export interface ModelSummary {
  model: string;
  attempts: number;
  passed: number;
  score: number;
  p50: number;
  p95: number;
  avgCompletionTokens: number | null;
  tokensPerSecond: number | null;
  totalCostUsd: number | null;
  /** erros de transporte por tipo: 404 = modelo sumiu do free tier */
  errors: Record<string, number>;
  bySkill: Record<string, { passed: number; total: number }>;
  /** respondeu a alguma chamada? modelo listado que nunca responde é pior que ausente */
  alive: boolean;
  /** fração das respostas que vieram vazias */
  emptyRate: number;
}

export interface RunResult {
  startedAt: string;
  finishedAt: string;
  models: ModelSummary[];
  attempts: Attempt[];
}

export interface Config {
  baseUrl: string;
  apiKey: string;
  /** vazio = pergunta ao gateway quais modelos existem */
  models: string[];
  skipModels: string[];
  repeats: number;
  concurrency: number;
  timeoutMs: number;
  maxTokens: number;
  dbPath: string;
  telegramToken: string;
  telegramChatIds: string[];
}
