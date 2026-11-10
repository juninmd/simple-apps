import type { CompletionOptions, LLMProvider, OpenAIConfig } from "../types.js";

export interface OpenAIChatCompletionResponse {
  id?: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
}

export class OpenAIProvider implements LLMProvider {
  public readonly name = "openai";
  private apiKey: string;
  private model: string;
  private baseUrl: string;

  constructor(config: OpenAIConfig) {
    if (!config.apiKey) {
      throw new Error("OpenAIProvider requires an apiKey.");
    }
    this.apiKey = config.apiKey;
    this.model = config.model ?? "gpt-4o";
    this.baseUrl = (config.baseUrl ?? "https://api.openai.com/v1").replace(/\/+$/, "");
  }

  public async complete(options: CompletionOptions): Promise<string> {
    const url = `${this.baseUrl}/chat/completions`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: options.messages,
        temperature: options.temperature ?? 0.2,
        max_tokens: options.maxTokens ?? 2000,
      }),
      signal: options.signal,
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      throw new Error(`OpenAI HTTP error ${response.status}: ${errText.slice(0, 300)}`);
    }

    const data = (await response.json()) as OpenAIChatCompletionResponse;
    const choice = data.choices?.[0];
    if (!choice || !choice.message?.content) {
      throw new Error("OpenAI returned an empty response.");
    }

    return choice.message.content;
  }
}
