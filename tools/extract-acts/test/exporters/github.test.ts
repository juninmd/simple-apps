import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GitHubExporter } from "../../src/exporters/github.js";
import type { Task } from "../../src/types.js";

const sampleTask: Task = {
  id: "task-1",
  title: "Setup CI/CD pipeline",
  description: "Configure GitHub Actions workflow for tests",
  assignee: "octocat",
  completed: false,
  rawText: "- [ ] Setup CI/CD pipeline @octocat",
};

describe("GitHubExporter", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("fails config validation if token or repo is missing", () => {
    expect(() => new GitHubExporter({})).toThrow();
  });

  it("handles dry-run without making network calls", async () => {
    const fetchMock = vi.fn();
    global.fetch = fetchMock;

    const exporter = new GitHubExporter({
      token: "ghp_secret123",
      owner: "octo-org",
      repo: "my-repo",
    });

    const result = await exporter.exportTasks({
      tasks: [sampleTask],
      dryRun: true,
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.dryRun).toBe(true);
    expect(result.successCount).toBe(1);
    expect(result.items[0]?.externalId).toBe("dry-run");
  });

  it("creates issue via GitHub REST API", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      text: async () =>
        JSON.stringify({
          id: 9999,
          number: 42,
          html_url: "https://github.com/octo-org/my-repo/issues/42",
        }),
    });
    global.fetch = fetchMock;

    const exporter = new GitHubExporter({
      token: "ghp_secret123",
      owner: "octo-org",
      repo: "my-repo",
    });

    const result = await exporter.exportTasks({
      tasks: [sampleTask],
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, req] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.github.com/repos/octo-org/my-repo/issues");
    expect(req.headers).toMatchObject({
      Authorization: "Bearer ghp_secret123",
      "User-Agent": "extract-acts",
    });
    const parsedBody = JSON.parse(req.body as string);
    expect(parsedBody.title).toBe("Setup CI/CD pipeline");
    expect(parsedBody.assignees).toEqual(["octocat"]);

    expect(result.successCount).toBe(1);
    expect(result.failureCount).toBe(0);
    expect(result.items[0]).toMatchObject({
      status: "created",
      externalId: "42",
      url: "https://github.com/octo-org/my-repo/issues/42",
    });
  });

  it("handles API error responses gracefully", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      text: async () => JSON.stringify({ message: "Bad credentials" }),
    });
    global.fetch = fetchMock;

    const exporter = new GitHubExporter({
      token: "ghp_invalid",
      owner: "octo-org",
      repo: "my-repo",
    });

    const result = await exporter.exportTasks({
      tasks: [sampleTask],
    });

    expect(result.successCount).toBe(0);
    expect(result.failureCount).toBe(1);
    expect(result.items[0]?.status).toBe("failed");
    expect(result.items[0]?.error).toContain("Bad credentials");
  });
});
