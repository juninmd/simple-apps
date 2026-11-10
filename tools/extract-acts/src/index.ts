#!/usr/bin/env bun
import { runCli } from "./cli";

const exitCode = await runCli({
  args: process.argv.slice(2),
});

process.exit(exitCode);
