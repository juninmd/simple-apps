#!/usr/bin/env node
import { runCli } from "../dist/cli.js";

process.on("SIGINT", () => {
  process.stderr.write("\nInterrupted.\n");
  process.exit(130);
});

process.on("SIGTERM", () => {
  process.exit(143);
});

runCli().then((code) => {
  if (code !== 0) {
    process.exit(code);
  }
});
