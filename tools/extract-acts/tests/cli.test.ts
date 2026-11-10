import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { runCli } from "../src/cli";
import type { LLMClient } from "../src/types";

describe("CLI Integration", () => {
  let tempDir: string;
  let cacheDir: string;
  let transcriptFile: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "extract-acts-cli-test-"));
    cacheDir = join(tempDir, "cache");
    transcriptFile = join(tempDir, "meeting.txt");
    await writeFile(
      transcriptFile,
      "Alice: We must build caching.\nBob: I will test it.",
      "utf8",
    );
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("prints help message with --help", async () => {
    const stdoutLogs: string[] = [];
    const stderrLogs: string[] = [];

    const exitCode = await runCli({
      args: ["--help"],
      stdout: (msg) => stdoutLogs.push(msg),
      stderr: (msg) => stderrLogs.push(msg),
    });

    expect(exitCode).toBe(0);
    expect(stdoutLogs.join("\n")).toContain("Usage: extract-acts");
    expect(stdoutLogs.join("\n")).toContain("--cache-dir");
    expect(stdoutLogs.join("\n")).toContain("--offline");
  });

  it("returns exit code 2 on missing transcript argument", async () => {
    const stderrLogs: string[] = [];

    const exitCode = await runCli({
      args: [],
      stderr: (msg) => stderrLogs.push(msg),
    });

    expect(exitCode).toBe(2);
    expect(stderrLogs.join("\n")).toContain("Missing transcript file path");
  });

  it("extracts items with LLM and caches result, then reuses cache on second run", async () => {
    let callCount = 0;
    const mockLlmClient: LLMClient = {
      extract: async () => {
        callCount++;
        return {
          model: "cli-test-model",
          items: [
            {
              id: "act-1",
              description: "Build caching",
              assignee: "Alice",
              completed: false,
            },
            {
              id: "act-2",
              description: "Test caching",
              assignee: "Bob",
              completed: true,
            },
          ],
        };
      },
    };

    const stdout1: string[] = [];
    const stderr1: string[] = [];

    // First run (LLM call & cache write)
    const code1 = await runCli({
      args: [transcriptFile, "--cache-dir", cacheDir],
      stdout: (msg) => stdout1.push(msg),
      stderr: (msg) => stderr1.push(msg),
      llmClient: mockLlmClient,
    });

    expect(code1).toBe(0);
    expect(callCount).toBe(1);
    expect(stderr1.join("\n")).toContain("[llm]");
    expect(stdout1.join("\n")).toContain("- [ ] Build caching (@Alice)");
    expect(stdout1.join("\n")).toContain("- [x] Test caching (@Bob)");

    // Second run (Cache hit, no LLM call)
    const stdout2: string[] = [];
    const stderr2: string[] = [];

    const code2 = await runCli({
      args: [transcriptFile, "--cache-dir", cacheDir],
      stdout: (msg) => stdout2.push(msg),
      stderr: (msg) => stderr2.push(msg),
      llmClient: mockLlmClient,
    });

    expect(code2).toBe(0);
    expect(callCount).toBe(1); // Still 1, didn't call LLM again
    expect(stderr2.join("\n")).toContain("[cached]");
    expect(stdout2.join("\n")).toContain("- [ ] Build caching (@Alice)");
  });

  it("supports offline replay of previously cached items", async () => {
    const mockLlmClient: LLMClient = {
      extract: async () => ({
        model: "offline-test-model",
        items: [
          {
            id: "act-1",
            description: "Offline cached action",
            completed: false,
          },
        ],
      }),
    };

    // First populate cache
    await runCli({
      args: [transcriptFile, "--cache-dir", cacheDir],
      llmClient: mockLlmClient,
    });

    // Offline run without LLM client
    const stdout: string[] = [];
    const stderr: string[] = [];

    const exitCode = await runCli({
      args: [transcriptFile, "--cache-dir", cacheDir, "--offline"],
      stdout: (msg) => stdout.push(msg),
      stderr: (msg) => stderr.push(msg),
    });

    expect(exitCode).toBe(0);
    expect(stderr.join("\n")).toContain("[cached]");
    expect(stdout.join("\n")).toContain("- [ ] Offline cached action");
  });

  it("fails gracefully with exit code 1 in offline mode when cache is missing", async () => {
    const stderr: string[] = [];
    const exitCode = await runCli({
      args: [transcriptFile, "--cache-dir", cacheDir, "--offline"],
      stderr: (msg) => stderr.push(msg),
    });

    expect(exitCode).toBe(1);
    expect(stderr.join("\n")).toContain("Offline replay error");
  });

  it("clears cache with --clear-cache", async () => {
    const stderr: string[] = [];
    const exitCode = await runCli({
      args: ["--cache-dir", cacheDir, "--clear-cache"],
      stderr: (msg) => stderr.push(msg),
    });

    expect(exitCode).toBe(0);
    expect(stderr.join("\n")).toContain("Cache cleared");
  });
});
