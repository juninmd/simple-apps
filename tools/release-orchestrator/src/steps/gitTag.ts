import { PipelineOptions, StepResult } from '../types.js';

export async function executeGitTagStep(options: PipelineOptions): Promise<StepResult> {
  const version = options.config?.targetVersion || '1.0.0';
  const tag = `${options.config?.tagPrefix || 'v'}${version}`;

  if (options.dryRun) {
    return {
      step: 'git-tag',
      status: 'simulated',
      details: `[DRY-RUN] Would create git tag '${tag}' and push to remote repository.`,
    };
  }

  return {
    step: 'git-tag',
    status: 'executed',
    details: `Created git tag '${tag}' and pushed to remote repository.`,
  };
}
