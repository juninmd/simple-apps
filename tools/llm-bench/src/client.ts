import type { ChatRequest, ChatResponse, Config, GatewayClient } from "./types.ts";

/** Erro de transporte/gateway, separado de "respondeu mas errou a tarefa". */
export class GatewayError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

interface ModelsPayload {
  data?: { id?: string }[];
}

interface ChatPayload {
  choices?: { message?: { content?: string } }[];
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    /** LiteLLM devolve o custo aqui em algumas versões */
    response_cost?: number;
  };
}

/** Corpo de erro pode ecoar a chave enviada — nunca propague cru. */
export function redact(text: string): string {
  return text
    .replace(/(sk-|Bearer\s+)[A-Za-z0-9_-]{8,}/g, "$1***")
    .replace(/("?api[_-]?key"?\s*[:=]\s*"?)[^"',\s]+/gi, "$1***")
    .slice(0, 300);
}

/** Cliente OpenAI-compatible: serve LiteLLM, vLLM, Ollama, Groq, OpenRouter. */
export function createClient(config: Config, fetchImpl: typeof fetch = fetch): GatewayClient {
  const headers = {
    "content-type": "application/json",
    authorization: `Bearer ${config.apiKey}`,
  };

  const call = async (path: string, init?: RequestInit): Promise<Response> => {
    const res = await fetchImpl(`${config.baseUrl}${path}`, {
      ...init,
      headers,
      signal: AbortSignal.timeout(config.timeoutMs),
    });
    if (!res.ok) {
      throw new GatewayError(res.status, `${res.status}: ${redact(await res.text())}`);
    }
    return res;
  };

  return {
    async listModels(): Promise<string[]> {
      const res = await call("/models");
      const json = (await res.json()) as ModelsPayload;
      return (json.data ?? []).map((m) => m.id).filter((id): id is string => Boolean(id));
    },

    async chat(req: ChatRequest): Promise<ChatResponse> {
      const messages = [
        ...(req.system ? [{ role: "system", content: req.system }] : []),
        { role: "user", content: req.prompt },
      ];
      const res = await call("/chat/completions", {
        method: "POST",
        body: JSON.stringify({
          model: req.model,
          messages,
          max_tokens: req.maxTokens ?? config.maxTokens,
          // Determinismo: o placar precisa ser comparável entre execuções.
          temperature: 0,
        }),
      });
      const headerCost = Number(res.headers.get("x-litellm-response-cost"));
      const json = (await res.json()) as ChatPayload;
      return {
        text: json.choices?.[0]?.message?.content ?? "",
        promptTokens: json.usage?.prompt_tokens ?? null,
        completionTokens: json.usage?.completion_tokens ?? null,
        costUsd: Number.isFinite(headerCost) ? headerCost : (json.usage?.response_cost ?? null),
      };
    },
  };
}
