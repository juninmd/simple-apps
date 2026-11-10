import { PipelineOptions, PipelineResult, StepResult } from './types.js';
import { executeChangelogStep } from './steps/changelog.js';
import { executeBumpVersionStep } from './steps/bumpVersion.js';
import { executeGitTagStep } from './steps/gitTag.js';
import { executePublishStep } from './steps/publish.js';
import { executeAnnouncementStep } from './steps/announcement.js';

export async function runPipeline(options: PipelineOptions = {}): Promise<PipelineResult> {
  const isDryRun = Boolean(options.dryRun);
  const steps: StepResult[] = [];

  const changelogRes = await executeChangelogStep(options);
  steps.push(changelogRes);

  const bumpRes = await executeBumpVersionStep(options);
  steps.push(bumpRes);

  const tagRes = await executeGitTagStep(options);
  steps.push(tagRes);

  const publishRes = await executePublishStep(options);
  steps.push(publishRes);

  const announcementRes = await executeAnnouncementStep(options);
  steps.push(announcementRes);

  const success = steps.every((s) => s.status !== 'failed');

  return {
    success,
    dryRun: isDryRun,
    steps,
  };
}
