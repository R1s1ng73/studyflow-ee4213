import { describe, expect, it } from "vitest";
import { createDemoData } from "@/lib/demo-data";
import { getDeadlineTasks } from "./deadline-filters";

describe("deadline filters", () => {
  const now = new Date(2026, 10, 10, 12);
  const state = createDemoData(now);

  it("shows current-student upcoming work in effective-date order", () => {
    const results = getDeadlineTasks(state, "upcoming", now);

    expect(results.every((task) => task.status !== "done")).toBe(true);
    expect(results.map((task) => task.id)).not.toContain("group-prototype");
    expect(results.map((task) => task.id).slice(0, 3)).toEqual([
      "task-quiz",
      "group-wireframes",
      "task-hci-report",
    ]);
  });

  it("shows only unfinished past-due current-student work as overdue", () => {
    expect(getDeadlineTasks(state, "overdue", now).map((task) => task.id)).toEqual([
      "task-overdue",
    ]);
  });

  it("preserves completed work and sorts it chronologically", () => {
    expect(getDeadlineTasks(state, "completed", now).map((task) => task.id)).toEqual([
      "task-complete",
    ]);
  });
});
