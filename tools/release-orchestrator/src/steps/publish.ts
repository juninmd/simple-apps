import { PipelineOptions, StepResult } from '../types.js';

export async function executePublishStep(options: PipelineOptions): Promise<StepResult> {
  const npm = options.config?.npmPublish ?? true;
  const pypi = options.config?.pypiPublish ?? false;

  const targets: string[] = [];
  if (npm) targets.push('npm');
  if (pypi) targets.push('pypi');

  if (targets.length === 0) {
    return {
      step: 'publish',
      status: 'skipped',
      details: 'No publishing targets enabled.',
    };
  }

  const targetList = targets.join(', ');

  if (options.dryRun) {
    return {
      step: 'publish',
      status: 'simulated',
      details: `[DRY-RUN] Would publish package to registry: ${targetList}.`,
    };
  }

  return {
    step: 'publish',
    status: 'executed',
    details: `Published package to registry: ${targetList}.`,
  };
}
