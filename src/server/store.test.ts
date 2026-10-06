import { describe, expect, it } from "vitest";
import {
  createTask,
  getContext,
  getProgressSummary,
  rescheduleTask,
  updateContext,
} from "./store";

describe("task store", () => {
  it("creates a task with the default todo state", () => {
    const task = createTask({
      title: "Kafka consumer",
      description: "Build consumer flow",
      category: "Backend",
      estimatedMinutes: 90,
      dueDate: "2026-10-07",
    });

    expect(task.status).toBe("todo");
    expect(task.title).toBe("Kafka consumer");
  });

  it("reschedules a task without losing the task record", () => {
    const task = createTask({
      title: "DSA practice",
      category: "Algorithms",
      estimatedMinutes: 60,
      dueDate: "2026-10-07",
    });

    const rescheduled = rescheduleTask(task.id, "2026-10-08");

    if (!rescheduled) {
      throw new Error("Expected task to be rescheduled.");
    }

    expect(rescheduled.dueDate).toBe("2026-10-08");
    expect(rescheduled.history?.at(-1)?.to).toBe("todo");
  });

  it("calculates a simple daily progress summary", () => {
    createTask({ title: "One", dueDate: "2026-10-07", estimatedMinutes: 30 });
    createTask({ title: "Two", dueDate: "2026-10-07", estimatedMinutes: 30 });

    const done = createTask({
      title: "Three",
      dueDate: "2026-10-07",
      estimatedMinutes: 30,
    });
    done.status = "done";

    const summary = getProgressSummary("2026-10-07");

    expect(summary.total).toBeGreaterThanOrEqual(3);
    expect(summary.done).toBeGreaterThanOrEqual(1);
  });

  it("stores and updates current context", () => {
    const first = updateContext({
      goal: "Switch to backend engineering",
      itinerary: "Week 1: Kafka + DSA",
      behaviors: "I get tired after 90 minutes.",
      constraints: "Weekdays limit 3 hours.",
    });

    const second = updateContext({
      goal: "Switch to backend engineering",
      itinerary: "Week 1: Kafka + DSA",
      behaviors: "I get tired after 90 minutes.",
      constraints: "Weekdays limit 3 hours.",
    });

    expect(first.version).toBe(1);
    expect(second.version).toBe(2);
    expect(getContext().goal).toContain("backend");
  });
});
