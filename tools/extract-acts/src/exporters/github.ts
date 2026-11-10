import {
  type ExportResult,
  type ExportedItem,
  type GitHubConfig,
  GitHubConfigSchema,
  type TaskExportPayload,
  type TaskExporter,
} from "../types.js";
import { ExporterError, requestWithRetry } from "./base.js";

export class GitHubExporter implements TaskExporter {
  public readonly provider = "github" as const;
  private readonly config: GitHubConfig;

  constructor(rawConfig: unknown) {
    this.config = GitHubConfigSchema.parse(rawConfig);
  }

  async exportTasks(payload: TaskExportPayload): Promise<ExportResult> {
    const items: ExportedItem[] = [];
    const isDryRun = Boolean(payload.dryRun);

    for (const task of payload.tasks) {
      if (isDryRun) {
        items.push({
          id: task.id,
          title: task.title,
          status: "created",
          url: `https://github.com/${this.config.owner}/${this.config.repo}/issues/dry-run`,
          externalId: "dry-run",
        });
        continue;
      }

      try {
        const bodyLines: string[] = [];
        if (task.description) {
          bodyLines.push(task.description);
        }
        bodyLines.push("\n---");
        bodyLines.push("*Exported by extract-acts*");

        const issuePayload = {
          title: task.title,
          body: bodyLines.join("\n"),
          assignees: task.assignee ? [task.assignee] : undefined,
        };

        const endpoint = `${this.config.apiBaseUrl}/repos/${this.config.owner}/${this.config.repo}/issues`;

        const response = await requestWithRetry<{
          id: number;
          number: number;
          html_url: string;
        }>(endpoint, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.config.token}`,
            "User-Agent": "extract-acts",
            "X-GitHub-Api-Version": "2022-11-28",
          },
          body: issuePayload,
        });

        items.push({
          id: task.id,
          title: task.title,
          status: "created",
          externalId: String(response.number),
          url: response.html_url,
        });
      } catch (err: unknown) {
        const message =
          err instanceof ExporterError
            ? err.message
            : (err as Error)?.message || "Failed to create issue";
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
