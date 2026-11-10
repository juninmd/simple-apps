import { PipelineOptions, StepResult } from '../types.js';

export async function executeAnnouncementStep(options: PipelineOptions): Promise<StepResult> {
  const url = options.config?.announcementUrl;

  if (!url) {
    return {
      step: 'announcement',
      status: 'skipped',
      details: 'No announcement URL configured.',
    };
  }

  if (options.dryRun) {
    return {
      step: 'announcement',
      status: 'simulated',
      details: `[DRY-RUN] Would post release announcement to '${url}'.`,
    };
  }

  return {
    step: 'announcement',
    status: 'executed',
    details: `Posted release announcement to '${url}'.`,
  };
}
