import {
  type AsanaConfig,
  AsanaConfigSchema,
  type ExportResult,
  type ExportedItem,
  type TaskExportPayload,
  type TaskExporter,
} from "../types.js";
import { ExporterError, requestWithRetry } from "./base.js";

export class AsanaExporter implements TaskExporter {
  public readonly provider = "asana" as const;
  private readonly config: AsanaConfig;

  constructor(rawConfig: unknown) {
    this.config = AsanaConfigSchema.parse(rawConfig);
  }

  async exportTasks(payload: TaskExportPayload): Promise<ExportResult> {
    const items: ExportedItem[] = [];
    const isDryRun = Boolean(payload.dryRun);

    const endpoint = `${this.config.apiBaseUrl}/tasks`;
    const headers = {
      Authorization: `Bearer ${this.config.accessToken}`,
    };

    for (const task of payload.tasks) {
      if (isDryRun) {
        items.push({
          id: task.id,
          title: task.title,
          status: "created",
          url: `https://app.asana.com/0/${this.config.projectId}/dry-run`,
          externalId: "dry-run",
        });
        continue;
      }

      try {
        const notesLines: string[] = [];
        if (task.description) {
          notesLines.push(task.description);
        }
        notesLines.push("\n---");
        notesLines.push("Exported by extract-acts");

        const taskData: Record<string, unknown> = {
          name: task.title,
          notes: notesLines.join("\n"),
          projects: [this.config.projectId],
          completed: task.completed,
        };

        if (this.config.workspaceId) {
          taskData.workspace = this.config.workspaceId;
        }

        const response = await requestWithRetry<{
          data: {
            gid: string;
            permalink_url?: string;
          };
        }>(endpoint, {
          method: "POST",
          headers,
          body: {
            data: taskData,
          },
        });

        const gid = response.data?.gid;
        const permalink =
          response.data?.permalink_url || `https://app.asana.com/0/${this.config.projectId}/${gid}`;

        items.push({
          id: task.id,
          title: task.title,
          status: "created",
          externalId: gid,
          url: permalink,
        });
      } catch (err: unknown) {
        const message =
          err instanceof ExporterError
            ? err.message
            : (err as Error)?.message || "Failed to create Asana task";
        items.push({
          id: task.id,
          title: task.title,
          status: "failed",
          error: message,
        });
      }
    }

    const successCount = items.filter((i) => i.status === "created").length;
    const failureCount = items.filter((i) => i.status === "failed").length;

    return {
      provider: this.provider,
      successCount,
      failureCount,
      totalCount: payload.tasks.length,
      items,
      dryRun: isDryRun,
    };
  }
}
