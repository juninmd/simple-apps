import { ReleaseScheduler } from 'release-orchestrator';

// Initialize scheduler with weekly cron expression (default: Sunday at 00:00 UTC)
const scheduler = new ReleaseScheduler({ cronSchedule: '0 0 * * 0' });

// Check if a release is due
if (scheduler.shouldRelease()) {
  const result = scheduler.triggerRelease();
  console.log('Release triggered:', result);
}
