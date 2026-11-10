import { parseArgs } from "node:util";
import { readFile } from "node:fs/promises";
import * as fs from "node:fs";
import * as readline from "node:readline";
import { FileResponseCache } from "./cache";
import { OfflineCacheMissError, TranscriptExtractor } from "./extractor";
import type { ExtractedItem, LLMClient } from "./types";

export interface RunCliOptions {
  args: string[];
  stdout?: (msg: string) => void;
  stderr?: (msg: string) => void;
  llmClient?: LLMClient;
}

export const HELP_TEXT = `
Usage: extract-acts [options] [transcript-file]

Turn meeting transcripts into checkable task lists without leaving the terminal.

Options:
  --transcript, -t <file>  Path to transcript file (or pass as first argument)
  --cache-dir <dir>        Directory to store cached LLM responses (default: .cache/extract-acts)
  --no-cache               Bypass cache read and write
  --offline                Offline replay mode; reads solely from cache, never calls LLM
  --clear-cache            Clear the response cache directory and exit
  --json                   Output full extraction metadata as JSON
  --help, -h               Show this help message
`.trim();

export async function runCli({
  args,
  stdout = (msg: string) => process.stdout.write(msg + "\n"),
  stderr = (msg: string) => process.stderr.write(msg + "\n"),
  llmClient,
}: RunCliOptions): Promise<number> {
  let parsed;
  try {
    parsed = parseArgs({
      args,
      options: {
        transcript: { type: "string", short: "t" },
        "cache-dir": { type: "string" },
        "no-cache": { type: "boolean", default: false },
        offline: { type: "boolean", default: false },
        "clear-cache": { type: "boolean", default: false },
        json: { type: "boolean", default: false },
        help: { type: "boolean", short: "h", default: false },
      },
      allowPositionals: true,
    });
  } catch (err: unknown) {
    const error = err as Error;
    stderr(`Usage error: ${error.message}`);
    stderr("Use --help for usage details.");
    return 2;
  }

  const { values, positionals } = parsed;

  if (values.help) {
    stdout(HELP_TEXT);
    return 0;
  }

  const cache = new FileResponseCache({
    cacheDir: values["cache-dir"],
  });

  if (values["clear-cache"]) {
    await cache.clear();
    stderr(`Cache cleared at ${cache.getCacheDir()}`);
    return 0;
  }

  const transcriptPath = values.transcript || positionals[0];
  if (!transcriptPath) {
    stderr("Usage error: Missing transcript file path.");
    stderr("Use --help for usage details.");
    return 2;
  }

  let transcriptContent: string;
  try {
    transcriptContent = await readFile(transcriptPath, "utf8");
  } catch (err: unknown) {
    const error = err as NodeJS.ErrnoException;
    stderr(`Error reading transcript file '${transcriptPath}': ${error.message}`);
    return 1;
  }

  const extractor = new TranscriptExtractor(cache, llmClient);

  try {
    const event = await extractor.extract(transcriptContent, {
      noCache: values["no-cache"],
      offlineReplay: values.offline,
    });

    if (values.json) {
      stdout(JSON.stringify(event, null, 2));
      return 0;
    }

    if (event.source === "cache") {
      stderr(`[cached] Using cached extraction for hash: ${event.hash}`);
    } else {
      stderr(`[llm] Extracted items via model ${event.result.model} (hash: ${event.hash})`);
    }

    // Format as checkable markdown task list
    const items = event.result.items;
    if (items.length === 0) {
      stdout("No actionable items found in transcript.");
    } else {
      for (const item of items) {
        const check = item.completed ? "[x]" : "[ ]";
        const assignee = item.assignee ? ` (@${item.assignee})` : "";
        stdout(`- ${check} ${item.description}${assignee}`);
      }
    }

    return 0;
  } catch (err: unknown) {
    if (err instanceof OfflineCacheMissError) {
      stderr(`Offline replay error: ${err.message}`);
      return 1;
    }
    const error = err as Error;
    stderr(`Extraction error: ${error.message}`);
    return 1;
  }
}
