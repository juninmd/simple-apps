#!/usr/bin/env node

import { fileURLToPath } from 'node:url';
import { ReleaseScheduler, isValidCron } from './scheduler.ts';
import { runPipeline } from './pipeline.js';
import { PipelineOptions } from './types.js';

function printHelp() {
  console.log(`
release-orchestrator CLI - Cron-Based Release Scheduler & Pipeline

Usage:
  node --experimental-strip-types src/cli.ts [options]

Scheduler Options:
  --cron "<expression>"  Set custom cron schedule (default: "0 0 * * 0" weekly)
  --check-schedule       Check if a release is due under the schedule
  --trigger              Trigger a scheduled release if due
  --force                Force release execution regardless of schedule

Pipeline Options:
  --dry-run, -d          Run pipeline in simulation mode
  --verbose, -v          Enable verbose logging
  --target-version, -t   Set target version
  --announcement-url     Set announcement URL
  --pypi                Enable PyPI publishing
  --no-npm               Disable NPM publishing

General:
  --help, -h             Show this help message
`);
}

export function parseArgs(args: string[]): PipelineOptions {
  const options: PipelineOptions = {
    dryRun: false,
    verbose: false,
    config: {},
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--dry-run' || arg === '-d') {
      options.dryRun = true;
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg === '--target-version' || arg === '-t') {
      if (options.config && args[i + 1]) {
        options.config.targetVersion = args[++i];
      }
    } else if (arg === '--announcement-url') {
      if (options.config && args[i + 1]) {
        options.config.announcementUrl = args[++i];
      }
    } else if (arg === '--pypi') {
      if (options.config) {
        options.config.pypiPublish = true;
      }
    } else if (arg === '--no-npm') {
      if (options.config) {
        options.config.npmPublish = false;
      }
    }
  }

  return options;
}

export async function runCli(args: string[]): Promise<number> {
  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    return 0;
  }

  // Scheduler Logic
  let cronExpr = '0 0 * * 0';
  const cronIdx = args.indexOf('--cron');
  if (cronIdx !== -1 && args[cronIdx + 1]) {
    cronExpr = args[cronIdx + 1];
  }

  if (!isValidCron(cronExpr)) {
    console.error(`Error: Invalid cron expression '${cronExpr}'`);
    return 1;
  }

  const scheduler = new ReleaseScheduler({ cronSchedule: cronExpr });
  const force = args.includes('--force');
  const checkOnly = args.includes('--check-schedule');
  const trigger = args.includes('--trigger');

  if (checkOnly) {
    const due = scheduler.shouldRelease();
    console.log(`Schedule: '${cronExpr}'`);
    console.log(`Release Due: ${due ? 'YES' : 'NO'}`);
    return 0;
  }

  if (trigger || force) {
    const result = scheduler.triggerRelease({ force });
    if (result.success) {
      console.log(`[SUCCESS] ${result.reason} (Triggered at ${result.triggeredAt.toISOString()})`);
      // After successful schedule trigger, proceed to pipeline
      return await executePipeline(args);
    } else {
      console.log(`[SKIPPED] ${result.reason}`);
      return 1;
    }
  }

  // Default behavior: Execute pipeline if not just checking schedule
  return await executePipeline(args);
}

async function executePipeline(args: string[]): Promise<number> {
  const options = parseArgs(args);

  if (options.dryRun) {
    console.log('=== DRY-RUN MODE ENABLED (SIMULATION) ===\nNo side-effects will be pushed, published, or posted.\n');
  } else {
    console.log('=== RUNNING RELEASE PIPELINE ===\n');
  }

  const result = await runPipeline(options);

  for (const step of result.steps) {
    const prefix = step.status === 'simulated' ? '[SIMULATED]' : `[${step.status.toUpperCase()}]`;
    console.log(`${prefix} ${step.step}: ${step.details}`);
  }

  if (result.dryRun) {
    console.log('\n=== DRY-RUN SIMULATION COMPLETE ===');
  } else {
    console.log('\n=== RELEASE PIPELINE COMPLETE ===');
  }

  return result.success ? 0 : 1;
}

if (process.argv[1] && (process.argv[1] === fileURLToPath(import.meta.url) || process.argv[1].endsWith('/cli.js') || process.argv[1].endsWith('/cli.ts'))) {
  runCli(process.argv.slice(2)).then((exitCode) => {
    process.exit(exitCode);
  });
}
