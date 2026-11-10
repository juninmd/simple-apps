import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OpenAIProvider } from "../src/providers/openai.js";

describe("OpenAIProvider", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("sends Authorization bearer header and parses response", async () => {
    let capturedHeaders: Record<string, string> = {};

    global.fetch = vi.fn().mockImplementation((_url, init) => {
      capturedHeaders = init.headers as Record<string, string>;
      return Promise.resolve(
        new Response(
          JSON.stringify({
            choices: [{ message: { content: "OpenAI result" } }],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );
    });

    const provider = new OpenAIProvider({
      apiKey: "sk-test-key-123",
      model: "gpt-4o",
    });

    const result = await provider.complete({
      messages: [{ role: "user", content: "test" }],
    });

    expect(result).toBe("OpenAI result");
    expect(capturedHeaders.Authorization).toBe("Bearer sk-test-key-123");
  });

  it("throws HTTP error on failure", async () => {
    global.fetch = vi.fn().mockImplementation(() => {
      return Promise.resolve(
        new Response("Invalid key", {
          status: 401,
        }),
      );
    });

    const provider = new OpenAIProvider({
      apiKey: "sk-bad-key",
    });

    await expect(
      provider.complete({
        messages: [{ role: "user", content: "test" }],
      }),
    ).rejects.toThrow(/OpenAI HTTP error 401/);
  });
});
