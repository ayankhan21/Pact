import { describe, expect, it } from "vitest";
import { buildJobSwitchTasks, jobSwitchContext } from "./job-switch-plan";

describe("job switch plan", () => {
  const tasks = buildJobSwitchTasks();

  it("creates dated tasks for every day in the itinerary", () => {
    const dates = [...new Set(tasks.map((task) => task.dueDate))];

    expect(dates).toHaveLength(36);
    expect(dates[0]).toBe("2026-10-06");
    expect(dates.at(-1)).toBe("2026-11-10");

    for (const date of dates) {
      const dailyTasks = tasks.filter((task) => task.dueDate === date);
      expect(dailyTasks.some((task) => task.category === "DSA")).toBe(true);
      expect(dailyTasks.some((task) => task.category === "Mini build")).toBe(
        true,
      );
      expect(dailyTasks.some((task) => task.category === "Main project")).toBe(
        true,
      );
    }
  });

  it("keeps tasks open and respects the explicit Saturday reading exceptions", () => {
    expect(tasks.every((task) => task.status === "todo")).toBe(true);
    expect(
      tasks.some(
        (task) =>
          task.dueDate === "2026-10-10" &&
          task.title.includes("optional rest-day reading") &&
          task.description?.includes("Optional"),
      ),
    ).toBe(true);
    expect(
      tasks.some(
        (task) =>
          task.dueDate === "2026-10-17" && task.category === "System design",
      ),
    ).toBe(false);
    expect(
      tasks.some(
        (task) =>
          task.dueDate === "2026-10-24" &&
          task.title.includes("database sharding"),
      ),
    ).toBe(true);
    expect(
      tasks.some(
        (task) =>
          task.dueDate === "2026-11-07" &&
          task.title.includes("authentication at scale"),
      ),
    ).toBe(true);
  });

  it("includes the planned weekly focus, application routine, and context", () => {
    expect(
      tasks.some(
        (task) =>
          task.dueDate === "2026-10-07" &&
          task.title.includes("JWT and refresh tokens"),
      ),
    ).toBe(true);
    expect(
      tasks.some(
        (task) =>
          task.dueDate === "2026-10-16" &&
          task.title.includes("5-8 startup roles"),
      ),
    ).toBe(true);
    expect(
      tasks.some(
        (task) =>
          task.dueDate === "2026-11-08" &&
          task.title.includes("two-minute README demo"),
      ),
    ).toBe(true);
    expect(jobSwitchContext.goal).toContain("funded startup");
    expect(jobSwitchContext.constraints).toContain("5-8 per day");
  });
});
