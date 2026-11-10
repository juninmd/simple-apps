import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AsanaExporter } from "../../src/exporters/asana.js";
import type { Task } from "../../src/types.js";

const sampleTask: Task = {
  id: "task-1",
  title: "Update privacy policy document",
  description: "Ensure GDPR compliance section is updated",
  completed: true,
  rawText: "- [x] Update privacy policy document",
};

describe("AsanaExporter", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("fails config validation if accessToken or projectId is missing", () => {
    expect(() => new AsanaExporter({})).toThrow();
  });

  it("creates task in Asana via REST API", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      text: async () =>
        JSON.stringify({
          data: {
            gid: "1200000001",
            permalink_url: "https://app.asana.com/0/98765/1200000001",
          },
        }),
    });
    global.fetch = fetchMock;

    const exporter = new AsanaExporter({
      accessToken: "1/asana_personal_token",
      projectId: "98765",
    });

    const result = await exporter.exportTasks({
      tasks: [sampleTask],
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, req] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://app.asana.com/api/1.0/tasks");
    expect(req.headers).toMatchObject({
      Authorization: "Bearer 1/asana_personal_token",
    });

    const body = JSON.parse(req.body as string);
    expect(body.data.name).toBe("Update privacy policy document");
    expect(body.data.projects).toEqual(["98765"]);
    expect(body.data.completed).toBe(true);
    expect(body.data.notes).toContain("Ensure GDPR compliance section is updated");

    expect(result.successCount).toBe(1);
    expect(result.items[0]?.externalId).toBe("1200000001");
    expect(result.items[0]?.url).toBe("https://app.asana.com/0/98765/1200000001");
  });

  it("handles dry-run correctly", async () => {
    const fetchMock = vi.fn();
    global.fetch = fetchMock;

    const exporter = new AsanaExporter({
      accessToken: "token123",
      projectId: "98765",
    });

    const result = await exporter.exportTasks({
      tasks: [sampleTask],
      dryRun: true,
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.dryRun).toBe(true);
    expect(result.successCount).toBe(1);
  });
});
