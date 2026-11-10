import type { Task } from "./types.js";

const TASK_CHECKBOX_REGEX = /^(\s*[-*+]|\d+\.)\s+\[([ xX])\]\s+(.*)$/;
const TASK_BULLET_ACTION_REGEX = /^(\s*[-*+]|\d+\.)\s+(TODO|ACTION|ACT|TASK):\s*(.*)$/i;
const ASSIGNEE_REGEX = /@([a-zA-Z0-9_-]+)/;

export function parseTasks(content: string): Task[] {
  const lines = content.split(/\r?\n/);
  const tasks: Task[] = [];
  let currentTask: Task | null = null;
  let taskIdCounter = 1;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();

    const checkboxMatch = rawLine.match(TASK_CHECKBOX_REGEX);
    if (checkboxMatch) {
      if (currentTask) {
        tasks.push(currentTask);
      }
      const isCompleted = checkboxMatch[2]?.toLowerCase() === "x";
      const rest = checkboxMatch[3]?.trim() ?? "";
      const assigneeMatch = rest.match(ASSIGNEE_REGEX);
      const assignee = assigneeMatch ? assigneeMatch[1] : undefined;
      const title = rest.replace(ASSIGNEE_REGEX, "").trim();

      currentTask = {
        id: `task-${taskIdCounter++}`,
        title: title || rest,
        completed: isCompleted,
        assignee,
        rawText: trimmed,
      };
      continue;
    }

    const bulletActionMatch = rawLine.match(TASK_BULLET_ACTION_REGEX);
    if (bulletActionMatch) {
      if (currentTask) {
        tasks.push(currentTask);
      }
      const rest = bulletActionMatch[3]?.trim() ?? "";
      const assigneeMatch = rest.match(ASSIGNEE_REGEX);
      const assignee = assigneeMatch ? assigneeMatch[1] : undefined;
      const title = rest.replace(ASSIGNEE_REGEX, "").trim();

      currentTask = {
        id: `task-${taskIdCounter++}`,
        title: title || rest,
        completed: false,
        assignee,
        rawText: trimmed,
      };
      continue;
    }

    // If indented text follows a task, treat it as description
    if (currentTask && (rawLine.startsWith("  ") || rawLine.startsWith("\t"))) {
      const descLine = rawLine.trim();
      if (descLine.length > 0) {
        currentTask.description = currentTask.description
          ? `${currentTask.description}\n${descLine}`
          : descLine;
      }
    } else if (trimmed.length === 0) {
      // Empty line closes the current task's multi-line description scope
      if (currentTask) {
        tasks.push(currentTask);
        currentTask = null;
      }
    }
  }

  if (currentTask) {
    tasks.push(currentTask);
  }

  return tasks;
}
