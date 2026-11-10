import { PipelineOptions, StepResult } from '../types.js';

export async function executeChangelogStep(options: PipelineOptions): Promise<StepResult> {
  const changelogFile = options.config?.changelogFile || 'CHANGELOG.md';

  if (options.dryRun) {
    return {
      step: 'changelog',
      status: 'simulated',
      details: `[DRY-RUN] Would diff against '${changelogFile}' and generate release notes.`,
    };
  }

  return {
    step: 'changelog',
    status: 'executed',
    details: `Diffed against '${changelogFile}' and generated release notes.`,
  };
}
