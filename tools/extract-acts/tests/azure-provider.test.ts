import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AzureOpenAIProvider } from "../src/providers/azure.js";

describe("AzureOpenAIProvider", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("constructs correct deployment URL from resourceName and deploymentName", () => {
    const provider = new AzureOpenAIProvider({
      apiKeys: ["key-1234567890"],
      resourceName: "my-eastus-res",
      deploymentName: "gpt-4o-deploy",
      apiVersion: "2024-02-15-preview",
    });

    expect(provider.getDeploymentUrl()).toBe(
      "https://my-eastus-res.openai.azure.com/openai/deployments/gpt-4o-deploy/chat/completions?api-version=2024-02-15-preview",
    );
  });

  it("constructs correct deployment URL when custom endpoint is provided", () => {
    const provider = new AzureOpenAIProvider({
      apiKeys: ["key-1234567890"],
      endpoint: "https://custom-domain.openai.azure.com/",
      deploymentName: "my-deploy",
    });

    expect(provider.getDeploymentUrl()).toBe(
      "https://custom-domain.openai.azure.com/openai/deployments/my-deploy/chat/completions?api-version=2024-02-15-preview",
    );
  });

  it("sends api-key header and returns completion content", async () => {
    const mockResponse = {
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: '{"actionItems": []}',
          },
          finish_reason: "stop",
        },
      ],
    };

    let capturedHeaders: Record<string, string> = {};
    let capturedUrl = "";

    global.fetch = vi.fn().mockImplementation((url, init) => {
      capturedUrl = String(url);
      capturedHeaders = init.headers as Record<string, string>;
      return Promise.resolve(
        new Response(JSON.stringify(mockResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    });

    const provider = new AzureOpenAIProvider({
      apiKeys: ["test-key-12345678"],
      resourceName: "my-res",
      deploymentName: "test-deploy",
    });

    const result = await provider.complete({
      messages: [{ role: "user", content: "hello" }],
    });

    expect(result).toBe('{"actionItems": []}');
    expect(capturedUrl).toContain("my-res.openai.azure.com");
    expect(capturedHeaders["api-key"]).toBe("test-key-12345678");
  });

  it("automatically rotates key when receiving 401 Unauthorized", async () => {
    const keysUsed: string[] = [];

    global.fetch = vi.fn().mockImplementation((_url, init) => {
      const key = (init.headers as Record<string, string>)["api-key"];
      keysUsed.push(key);

      if (key === "key-11111111") {
        return Promise.resolve(
          new Response(JSON.stringify({ error: { message: "Invalid API key" } }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }),
        );
      }

      return Promise.resolve(
        new Response(
          JSON.stringify({
            choices: [{ message: { content: "Success on rotated key" } }],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );
    });

    const provider = new AzureOpenAIProvider({
      apiKeys: ["key-11111111", "key-22222222"],
      resourceName: "my-res",
      deploymentName: "test-deploy",
    });

    const result = await provider.complete({
      messages: [{ role: "user", content: "test rotation" }],
    });

    expect(result).toBe("Success on rotated key");
    expect(keysUsed).toEqual(["key-11111111", "key-22222222"]);
  });

  it("automatically rotates key on 429 rate limit and retries with next key", async () => {
    const keysUsed: string[] = [];

    global.fetch = vi.fn().mockImplementation((_url, init) => {
      const key = (init.headers as Record<string, string>)["api-key"];
      keysUsed.push(key);

      if (key === "key-primary") {
        return Promise.resolve(
          new Response(JSON.stringify({ error: { message: "Rate limited" } }), {
            status: 429,
            headers: { "Content-Type": "application/json", "retry-after": "30" },
          }),
        );
      }

      return Promise.resolve(
        new Response(
          JSON.stringify({
            choices: [{ message: { content: "Recovered from 429" } }],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );
    });

    const provider = new AzureOpenAIProvider({
      apiKeys: ["key-primary", "key-secondary"],
      resourceName: "my-res",
      deploymentName: "test-deploy",
    });

    const result = await provider.complete({
      messages: [{ role: "user", content: "test 429" }],
    });

    expect(result).toBe("Recovered from 429");
    expect(keysUsed).toEqual(["key-primary", "key-secondary"]);
  });

  it("throws exhaustion error if all keys fail with 401", async () => {
    global.fetch = vi.fn().mockImplementation(() => {
      return Promise.resolve(
        new Response(JSON.stringify({ error: { message: "Unauthorized" } }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }),
      );
    });

    const provider = new AzureOpenAIProvider({
      apiKeys: ["bad-key-1", "bad-key-2"],
      resourceName: "my-res",
      deploymentName: "test-deploy",
    });

    await expect(
      provider.complete({
        messages: [{ role: "user", content: "test exhaustion" }],
      }),
    ).rejects.toThrow(/Key rotation exhausted/);
  });
});
