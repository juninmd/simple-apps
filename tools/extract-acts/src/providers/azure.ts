import type { AzureOpenAIConfig, CompletionOptions, LLMProvider } from "../types.js";
import { KeyRotator } from "./key-rotator.js";

export interface AzureChatCompletionResponse {
  id?: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class AzureOpenAIProvider implements LLMProvider {
  public readonly name = "azure";
  private keyRotator: KeyRotator;
  private endpoint: string;
  private deploymentName: string;
  private apiVersion: string;

  constructor(config: AzureOpenAIConfig) {
    if (!config.apiKeys || config.apiKeys.length === 0) {
      throw new Error("AzureOpenAIProvider requires at least one API key.");
    }
    if (!config.deploymentName) {
      throw new Error("AzureOpenAIProvider requires a deploymentName.");
    }

    this.deploymentName = config.deploymentName;
    this.apiVersion = config.apiVersion ?? "2024-02-15-preview";

    // Build the base endpoint URL
    if (config.endpoint) {
      this.endpoint = config.endpoint.replace(/\/+$/, "");
    } else if (config.resourceName) {
      this.endpoint = `https://${config.resourceName}.openai.azure.com`;
    } else {
      throw new Error(
        'AzureOpenAIProvider requires either a "resourceName" or a full "endpoint" URL.',
      );
    }

    this.keyRotator = new KeyRotator({
      keys: config.apiKeys,
      cooldownMs: config.cooldownMs ?? 60_000,
      onRotate: ({ previousKey, nextKey, reason }) => {
        // Diagnostic stderr output (does not pollute stdout)
        process.stderr.write(
          `[Azure OpenAI] Key rotated from ${previousKey} to ${nextKey} due to: ${reason}\n`,
        );
      },
    });
  }

  public getKeyRotator(): KeyRotator {
    return this.keyRotator;
  }

  public getDeploymentUrl(): string {
    return `${this.endpoint}/openai/deployments/${this.deploymentName}/chat/completions?api-version=${this.apiVersion}`;
  }

  public async complete(options: CompletionOptions): Promise<string> {
    const totalKeys = this.keyRotator.totalKeys;
    let attempts = 0;
    const maxAttempts = Math.max(totalKeys * 2, 3);
    const url = this.getDeploymentUrl();

    while (attempts < maxAttempts) {
      attempts += 1;
      const currentKey = this.keyRotator.getKey();

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": currentKey,
          },
          body: JSON.stringify({
            messages: options.messages,
            temperature: options.temperature ?? 0.2,
            max_tokens: options.maxTokens ?? 2000,
          }),
          signal: options.signal,
        });

        if (response.ok) {
          const data = (await response.json()) as AzureChatCompletionResponse;
          const choice = data.choices?.[0];
          if (!choice || !choice.message?.content) {
            throw new Error("Azure OpenAI returned an empty response choices array.");
          }
          return choice.message.content;
        }

        const status = response.status;
        const errText = await response.text().catch(() => "");

        // 401 Unauthorized or 403 Forbidden: bad key
        // 429 Too Many Requests: rate limited
        if (status === 401 || status === 403 || status === 429) {
          // Check retry-after header if present for 429
          let retryAfterMs: number | undefined;
          if (status === 429) {
            const retryHeader = response.headers.get("retry-after");
            if (retryHeader) {
              const seconds = Number.parseInt(retryHeader, 10);
              if (!Number.isNaN(seconds) && seconds > 0) {
                retryAfterMs = seconds * 1000;
              }
            }
          }

          try {
            this.keyRotator.reportFailure(status, retryAfterMs);
            // If another key is available, loop immediately to retry with the next key
            continue;
          } catch (rotateErr) {
            throw new Error(
              `Azure OpenAI request failed (${status}). Key rotation exhausted: ${
                rotateErr instanceof Error ? rotateErr.message : String(rotateErr)
              }`,
            );
          }
        }

        // For other 5xx server errors, report failure count and retry if we have keys left
        if (status >= 500 && status < 600 && attempts < maxAttempts) {
          try {
            this.keyRotator.reportFailure(status);
            continue;
          } catch {
            // No other key, throw HTTP error
          }
        }

        throw new Error(
          `Azure OpenAI HTTP error ${status}: ${errText.slice(0, 300) || response.statusText}`,
        );
      } catch (err: unknown) {
        // If aborted or exhausted, rethrow
        if (err instanceof Error) {
          if (err.name === "AbortError" || err.name === "KeyRotationExhaustedError") {
            throw err;
          }
          if (err.message.includes("Key rotation exhausted")) {
            throw err;
          }
        }

        // Network error / connection refused
        if (attempts < maxAttempts) {
          try {
            this.keyRotator.reportFailure(503);
            continue;
          } catch {
            // Key rotation failed
          }
        }
        throw err;
      }
    }

    throw new Error(`Azure OpenAI failed after ${attempts} attempts across keys.`);
  }
}
