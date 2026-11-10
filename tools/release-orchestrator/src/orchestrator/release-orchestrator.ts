import {
  NotificationPayload,
  ReleaseOrchestratorConfig,
  ReleaseResult,
  TagRollbackResult,
} from '../types.js';

export class ReleaseOrchestrator {
  private config: ReleaseOrchestratorConfig;

  constructor(config: ReleaseOrchestratorConfig) {
    this.config = config;
  }

  async release(tagName: string, extraOptions: Record<string, unknown> = {}): Promise<ReleaseResult> {
    const {
      publishStep,
      tagManager,
      notificationChannel,
      autoRollbackOnFailure = true,
      deleteRemoteTagOnRollback = true,
      remoteName = 'origin',
    } = this.config;

    const timestamp = new Date().toISOString();

    try {
      const publishResult = await publishStep.execute({ tagName, ...extraOptions });

      if (!publishResult.success) {
        const errorMsg = publishResult.message || `Publish step '${publishStep.name}' failed`;
        throw new Error(errorMsg);
      }

      // Publish Succeeded
      let notificationSent = false;
      let notificationError: Error | undefined;

      try {
        const successPayload: NotificationPayload = {
          event: 'PUBLISH_SUCCESS',
          tagName,
          stepName: publishStep.name,
          timestamp,
          metadata: { details: publishResult.details },
        };
        notificationSent = await notificationChannel.notify(successPayload);
      } catch (err) {
        notificationError = err instanceof Error ? err : new Error(String(err));
      }

      return {
        success: true,
        tagName,
        published: true,
        rolledBack: false,
        notificationSent,
        notificationError,
      };
    } catch (err) {
      // Publish Failed
      const publishError = err instanceof Error ? err : new Error(String(err));
      let rolledBack = false;
      let rollbackError: Error | undefined;
      let rollbackResult: TagRollbackResult | undefined;

      if (autoRollbackOnFailure) {
        try {
          rollbackResult = await tagManager.revertTag(tagName, {
            deleteRemote: deleteRemoteTagOnRollback,
            remoteName,
          });
          rolledBack = rollbackResult.success;
          if (rollbackResult.error) {
            rollbackError = rollbackResult.error;
          }
        } catch (rErr) {
          rollbackError = rErr instanceof Error ? rErr : new Error(String(rErr));
        }
      }

      // Post Error Notification
      let notificationSent = false;
      let notificationError: Error | undefined;

      try {
        const rollbackDetails = autoRollbackOnFailure
          ? rollbackResult
            ? `Local tag deleted: ${rollbackResult.localDeleted}, Remote tag deleted: ${rollbackResult.remoteDeleted}`
            : rollbackError
            ? `Rollback failed: ${rollbackError.message}`
            : 'Rollback attempted'
          : 'Rollback disabled';

        const MAX_MESSAGE_LENGTH = 2000;
        const truncatedMessage = publishError.message
          ? publishError.message.slice(0, MAX_MESSAGE_LENGTH)
          : '';

        const errorPayload: { message: string; stack?: string } = {
          message: truncatedMessage,
        };

        if (this.config.includeStack && publishError.stack) {
          errorPayload.stack = publishError.stack;
        }

        const failurePayload: NotificationPayload = {
          event: 'PUBLISH_FAILED',
          tagName,
          stepName: publishStep.name,
          error: errorPayload,
          rollbackStatus: {
            attempted: autoRollbackOnFailure,
            reverted: rolledBack,
            details: rollbackDetails,
          },
          timestamp,
        };

        notificationSent = await notificationChannel.notify(failurePayload);
      } catch (nErr) {
        notificationError = nErr instanceof Error ? nErr : new Error(String(nErr));
      }

      return {
        success: false,
        tagName,
        published: false,
        rolledBack,
        notificationSent,
        error: publishError,
        rollbackError,
        notificationError,
      };
    }
  }
}
