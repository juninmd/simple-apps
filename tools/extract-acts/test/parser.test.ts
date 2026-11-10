import { describe, expect, it } from "vitest";
import { parseTasks } from "../src/parser.js";

describe("parseTasks", () => {
  it("parses markdown checkbox task items", () => {
    const markdown = `
# Meeting Notes

Discussion about feature rollout.

- [ ] Write integration tests for payment module @alice
  Must cover 3DS verification and timeout cases
- [x] Review architecture proposal @bob
- [ ] Prepare deployment checklist
`;

    const tasks = parseTasks(markdown);
    expect(tasks).toHaveLength(3);

    expect(tasks[0]).toMatchObject({
      id: "task-1",
      title: "Write integration tests for payment module",
      assignee: "alice",
      completed: false,
      description: "Must cover 3DS verification and timeout cases",
    });

    expect(tasks[1]).toMatchObject({
      id: "task-2",
      title: "Review architecture proposal",
      assignee: "bob",
      completed: true,
    });

    expect(tasks[2]).toMatchObject({
      id: "task-3",
      title: "Prepare deployment checklist",
      assignee: undefined,
      completed: false,
    });
  });

  it("parses bullet action items (TODO/ACTION/TASK)", () => {
    const transcript = `
Alice: We need someone to update the docs.
* ACTION: Update API documentation @carol
  Ensure OpenAPI 3.1 schema is included
- TODO: Fix rate limiting bug
1. TASK: Add Sentry monitoring @dave
`;

    const tasks = parseTasks(transcript);
    expect(tasks).toHaveLength(3);
    expect(tasks[0]?.title).toBe("Update API documentation");
    expect(tasks[0]?.assignee).toBe("carol");
    expect(tasks[0]?.description).toBe("Ensure OpenAPI 3.1 schema is included");

    expect(tasks[1]?.title).toBe("Fix rate limiting bug");
    expect(tasks[2]?.title).toBe("Add Sentry monitoring");
    expect(tasks[2]?.assignee).toBe("dave");
  });

  it("handles empty or irrelevant content gracefully", () => {
    const text = "Just some discussion without tasks.\n\nEverything looks good.";
    const tasks = parseTasks(text);
    expect(tasks).toHaveLength(0);
  });
});
