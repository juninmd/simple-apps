export interface ExtractedItem {
  id: string;
  description: string;
  assignee?: string;
  dueDate?: string;
  completed: boolean;
}

export interface ExtractionResult {
  transcriptHash: string;
  extractedAt: string; // ISO 8601 string
  model: string;
  items: ExtractedItem[];
  title?: string;
  summary?: string;
  rawText?: string;
}

export interface CacheEntry {
  version: number;
  data: ExtractionResult;
}

export interface ResponseCache {
  get(transcriptHash: string): Promise<ExtractionResult | null>;
  set(transcriptHash: string, result: ExtractionResult): Promise<void>;
  has(transcriptHash: string): Promise<boolean>;
  clear(): Promise<void>;
}

export interface LLMClient {
  extract(transcript: string): Promise<{ model: string; items: ExtractedItem[] }>;
}

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface CompletionOptions {
  messages: LLMMessage[];
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

export interface LLMProvider {
  readonly name: string;
  complete(options: CompletionOptions): Promise<string>;
}

export type ProviderType = "openai" | "azure";

export interface OpenAIConfig {
  apiKey: string;
  model?: string;
  baseUrl?: string;
}

export interface AzureOpenAIConfig {
  /**
   * One or more Azure OpenAI API keys.
   * KeyRotator automatically rotates across these keys.
   */
  apiKeys: string[];
  /**
   * The Azure resource name, e.g. "my-eastus-resource".
   * Alternatively, a full endpoint URL can be provided.
   */
  resourceName?: string;
  endpoint?: string;
  /**
   * Deployment name / ID in Azure OpenAI Studio.
   */
  deploymentName: string;
  /**
   * Azure API version, defaults to "2024-02-15-preview".
   */
  apiVersion?: string;
  /**
   * Cooldown in milliseconds after a key hits 429/rate-limit.
   * Defaults to 60000 (1 minute).
   */
  cooldownMs?: number;
}

export interface ActionItem {
  task: string;
  assignee?: string;
  dueDate?: string;
  priority?: "high" | "medium" | "low";
  context?: string;
}

export interface ExtractorOptions {
  noCache?: boolean;
  offlineReplay?: boolean;
}
