import {
  type ExportResult,
  type ExportedItem,
  type JiraConfig,
  JiraConfigSchema,
  type TaskExportPayload,
  type TaskExporter,
} from "../types.js";
import { ExporterError, requestWithRetry } from "./base.js";

export class JiraExporter implements TaskExporter {
  public readonly provider = "jira" as const;
  private readonly config: JiraConfig;

  constructor(rawConfig: unknown) {
    this.config = JiraConfigSchema.parse(rawConfig);
  }

  private buildDescriptionADF(description?: string): Record<string, unknown> {
    const paragraphs: unknown[] = [];

    if (description) {
      paragraphs.push({
        type: "paragraph",
        content: [
          {
            type: "text",
            text: description,
          },
        ],
      });
    }

    paragraphs.push({
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Exported by extract-acts",
          marks: [{ type: "em" }],
        },
      ],
    });

    return {
      type: "doc",
      version: 1,
      content: paragraphs,
    };
  }

  async exportTasks(payload: TaskExportPayload): Promise<ExportResult> {
    const items: ExportedItem[] = [];
    const isDryRun = Boolean(payload.dryRun);

    const authHeader = `Basic ${Buffer.from(`${this.config.email}:${this.config.apiToken}`).toString("base64")}`;
    const endpoint = `https://${this.config.domain}/rest/api/3/issue`;

    for (const task of payload.tasks) {
      if (isDryRun) {
        items.push({
          id: task.id,
          title: task.title,
          status: "created",
          url: `https://${this.config.domain}/browse/${this.config.projectKey}-DRYRUN`,
          externalId: `${this.config.projectKey}-DRYRUN`,
        });
        continue;
      }

      try {
        const issuePayload = {
          fields: {
            project: {
              key: this.config.projectKey,
            },
            summary: task.title,
            description: this.buildDescriptionADF(task.description),
            issuetype: {
              name: this.config.issueType,
            },
          },
        };

        const response = await requestWithRetry<{
          id: string;
          key: string;
          self: string;
        }>(endpoint, {
          method: "POST",
          headers: {
            Authorization: authHeader,
          },
          body: issuePayload,
        });

        items.push({
          id: task.id,
          title: task.title,
          status: "created",
          externalId: response.key,
          url: `https://${this.config.domain}/browse/${response.key}`,
        });
      } catch (err: unknown) {
        const message =
          err instanceof ExporterError
            ? err.message
            : (err as Error)?.message || "Failed to create Jira issue";
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
