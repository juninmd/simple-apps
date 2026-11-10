import { describe, expect, it } from "vitest";
import { parseArgs } from "../src/config.js";

describe("parseArgs", () => {
  it("parses Azure CLI flags with key rotation list", () => {
    const argv = [
      "--provider",
      "azure",
      "--azure-keys",
      "key1,key2,key3",
      "--azure-resource",
      "res-east",
      "--azure-deployment",
      "dep-gpt4",
      "transcript.txt",
    ];

    const opts = parseArgs(argv);
    expect(opts.provider).toBe("azure");
    expect(opts.azure?.apiKeys).toEqual(["key1", "key2", "key3"]);
    expect(opts.azure?.resourceName).toBe("res-east");
    expect(opts.azure?.deploymentName).toBe("dep-gpt4");
    expect(opts.filePath).toBe("transcript.txt");
  });

  it("parses OpenAI CLI flags", () => {
    const argv = ["--provider", "openai", "--openai-key", "sk-test", "--model", "gpt-4o", "--json"];

    const opts = parseArgs(argv);
    expect(opts.provider).toBe("openai");
    expect(opts.openai?.apiKey).toBe("sk-test");
    expect(opts.openai?.model).toBe("gpt-4o");
    expect(opts.format).toBe("json");
  });

  it("throws on invalid provider argument", () => {
    expect(() => parseArgs(["--provider", "unknown"])).toThrow(/Invalid provider/);
  });
});
