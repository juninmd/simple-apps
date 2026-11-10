export interface ReleaseConfig {
  tagPrefix?: string;
  changelogFile?: string;
  npmPublish?: boolean;
  pypiPublish?: boolean;
  announcementUrl?: string;
  targetVersion?: string;
}

export interface PipelineOptions {
  dryRun?: boolean;
  config?: ReleaseConfig;
  verbose?: boolean;
}

export interface StepResult {
  step: string;
  status: 'executed' | 'simulated' | 'skipped' | 'failed';
  details: string;
}

export interface PipelineResult {
  success: boolean;
  dryRun: boolean;
  steps: StepResult[];
}

export type WeaverStrategy = 'conventional-commits' | 'custom-regex';

export interface CustomRegexCaptureGroups {
  type: string;
  scope?: string;
  description: string;
}

export interface CustomRegexConfig {
  pattern: string;
  captureGroups: CustomRegexCaptureGroups;
}

export interface SectionTitlesByLanguage {
  [languageCode: string]: string;
}

export interface TypesMap {
  [type: string]: SectionTitlesByLanguage;
}

export interface WeaverConfig {
  strategy: WeaverStrategy;
  defaultLanguage?: string;
  customRegex?: CustomRegexConfig;
  typesMap?: TypesMap;
  includeScopes?: boolean;
  groupUnclassified?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface PublishStepOptions {
  tagName: string;
  [key: string]: unknown;
}

export interface PublishStepResult {
  success: boolean;
  message?: string;
  details?: unknown;
}

export interface PublishStep {
  name: string;
  execute(options: PublishStepOptions): Promise<PublishStepResult>;
}

export interface TagRollbackOptions {
  deleteRemote?: boolean;
  remoteName?: string;
}

export interface TagRollbackResult {
  success: boolean;
  tagName: string;
  localDeleted: boolean;
  remoteDeleted: boolean;
  error?: Error;
}

export interface GitTagManager {
  revertTag(tagName: string, options?: TagRollbackOptions): Promise<TagRollbackResult>;
  tagExists(tagName: string): Promise<boolean>;
}

export interface NotificationPayload {
  event: 'PUBLISH_SUCCESS' | 'PUBLISH_FAILED';
  tagName: string;
  stepName?: string;
  error?: {
    message: string;
    stack?: string;
  };
  rollbackStatus?: {
    attempted: boolean;
    reverted: boolean;
    details?: string;
  };
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationChannel {
  name: string;
  notify(payload: NotificationPayload): Promise<boolean>;
}

export interface ReleaseOrchestratorConfig {
  publishStep: PublishStep;
  tagManager: GitTagManager;
  notificationChannel: NotificationChannel;
  autoRollbackOnFailure?: boolean;
  deleteRemoteTagOnRollback?: boolean;
  remoteName?: string;
  includeStack?: boolean;
}

export interface ReleaseResult {
  success: boolean;
  tagName: string;
  published: boolean;
  rolledBack: boolean;
  notificationSent: boolean;
  error?: Error;
  rollbackError?: Error;
  notificationError?: Error;
}
