import { describe, expect, it } from "vitest";
import {
  calculateCompletionRate,
  isValidStatusTransition,
  moveTaskToStatus,
  type Task,
} from "./task-state";

describe("task state logic", () => {
  it("allows valid transitions and rejects invalid ones", () => {
    expect(isValidStatusTransition("todo", "in_progress")).toBe(true);
    expect(isValidStatusTransition("in_progress", "done")).toBe(true);
    expect(isValidStatusTransition("todo", "done")).toBe(true);
    expect(isValidStatusTransition("done", "todo")).toBe(false);
  });

  it("records status changes and keeps the latest status", () => {
    const task: Task = {
      id: "task-1",
      title: "Kafka consumer",
      status: "todo",
      estimatedMinutes: 90,
    };

    const updated = moveTaskToStatus(task, "done");

    expect(updated.status).toBe("done");
    expect(updated.history).toEqual([
      { from: "todo", to: "done", createdAt: expect.any(String) },
    ]);
  });

  it("calculates completion percentage for a set of tasks", () => {
    const tasks: Task[] = [
      { id: "1", title: "A", status: "done", estimatedMinutes: 30 },
      { id: "2", title: "B", status: "todo", estimatedMinutes: 30 },
      { id: "3", title: "C", status: "in_progress", estimatedMinutes: 30 },
    ];

    expect(calculateCompletionRate(tasks)).toBe(33.33);
  });
});
