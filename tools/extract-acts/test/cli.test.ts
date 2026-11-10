import * as fs from "node:fs";
import * as path from "node:path";
import { describe, expect, it } from "vitest";
import { parseCliArgs, runCli } from "../src/cli.js";

describe("CLI", () => {
  it("parses CLI arguments correctly", () => {
    const args = [
      "export",
      "notes.md",
      "--to",
      "github",
      "--dry-run",
      "--json",
      "--github-token",
      "test-token",
      "--github-owner",
      "test-owner",
      "--github-repo",
      "test-repo",
    ];

    const parsed = parseCliArgs(args);
    expect(parsed.provider).toBe("github");
    expect(parsed.dryRun).toBe(true);
    expect(parsed.jsonOutput).toBe(true);
    expect(parsed.inputPath).toBe("notes.md");
    expect(parsed.githubToken).toBe("test-token");
    expect(parsed.githubOwner).toBe("test-owner");
    expect(parsed.githubRepo).toBe("test-repo");
  });

  it("returns exit code 2 when required provider flag is missing", async () => {
    const exitCode = await runCli(["export", "sample.md"]);
    expect(exitCode).toBe(2);
  });

  it("returns exit code 66 when input file does not exist", async () => {
    const exitCode = await runCli(["export", "non_existent_file.md", "--to", "github"]);
    expect(exitCode).toBe(66);
  });

  it("runs dry-run export successfully for valid tasks and file", async () => {
    const tempFile = path.join(process.cwd(), "test-tasks-temp.md");
    fs.writeFileSync(tempFile, "# Meeting\n- [ ] Ship feature to production @lead\n");

    try {
      const exitCode = await runCli([
        "export",
        tempFile,
        "--to",
        "github",
        "--dry-run",
        "--github-token",
        "fake-token",
        "--github-owner",
        "org",
        "--github-repo",
        "repo",
      ]);

      expect(exitCode).toBe(0);
    } finally {
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }
  });

  it("returns exit code 65 when file contains no actionable tasks", async () => {
    const tempFile = path.join(process.cwd(), "test-empty-temp.md");
    fs.writeFileSync(tempFile, "# Meeting\nJust discussion without tasks\n");

    try {
      const exitCode = await runCli([
        "export",
        tempFile,
        "--to",
        "jira",
        "--dry-run",
        "--jira-domain",
        "team.atlassian.net",
        "--jira-email",
        "dev@company.com",
        "--jira-token",
        "token",
        "--jira-project",
        "PROJ",
      ]);

      expect(exitCode).toBe(65);
    } finally {
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }
  });
});
