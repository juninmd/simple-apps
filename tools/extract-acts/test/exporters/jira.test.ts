import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JiraExporter } from "../../src/exporters/jira.js";
import type { Task } from "../../src/types.js";

const sampleTask: Task = {
  id: "task-1",
  title: "Deploy release to staging",
  description: "Check canary metrics before completing rollout",
  completed: false,
  rawText: "- [ ] Deploy release to staging",
};

describe("JiraExporter", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("fails config validation if credentials or domain are missing", () => {
    expect(() => new JiraExporter({})).toThrow();
  });

  it("creates issue in Jira using ADF format", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      text: async () =>
        JSON.stringify({
          id: "10001",
          key: "PROJ-123",
          self: "https://myteam.atlassian.net/rest/api/3/issue/10001",
        }),
    });
    global.fetch = fetchMock;

    const exporter = new JiraExporter({
      domain: "https://myteam.atlassian.net/",
      email: "engineer@company.com",
      apiToken: "jira-token-xyz",
      projectKey: "proj",
    });

    const result = await exporter.exportTasks({
      tasks: [sampleTask],
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, req] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://myteam.atlassian.net/rest/api/3/issue");

    const auth = (req.headers as Record<string, string>).Authorization;
    const decodedAuth = Buffer.from(auth.replace("Basic ", ""), "base64").toString();
    expect(decodedAuth).toBe("engineer@company.com:jira-token-xyz");

    const body = JSON.parse(req.body as string);
    expect(body.fields.project.key).toBe("PROJ");
    expect(body.fields.summary).toBe("Deploy release to staging");
    expect(body.fields.description.type).toBe("doc");

    expect(result.successCount).toBe(1);
    expect(result.items[0]?.externalId).toBe("PROJ-123");
    expect(result.items[0]?.url).toBe("https://myteam.atlassian.net/browse/PROJ-123");
  });

  it("handles dry-run correctly", async () => {
    const fetchMock = vi.fn();
    global.fetch = fetchMock;

    const exporter = new JiraExporter({
      domain: "myteam.atlassian.net",
      email: "engineer@company.com",
      apiToken: "jira-token-xyz",
      projectKey: "PROJ",
    });

    const result = await exporter.exportTasks({
      tasks: [sampleTask],
      dryRun: true,
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.dryRun).toBe(true);
    expect(result.successCount).toBe(1);
    expect(result.items[0]?.externalId).toBe("PROJ-DRYRUN");
  });
});
