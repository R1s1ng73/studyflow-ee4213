import { describe, expect, it } from "vitest";
import { createDemoData } from "@/lib/demo-data";
import type { Task } from "@/lib/types";
import {
  filterProjectTasks,
  getLatestProjectUpdate,
  getProjectTasks,
  getTaskRecordedAt,
} from "./project-utils";

describe("project view helpers", () => {
  it("returns project tasks in the project's declared order", () => {
    const state = createDemoData(new Date("2026-11-10T12:00:00.000Z"));
    const project = state.projects[0]!;

    expect(getProjectTasks(state, project).map((task) => task.id)).toEqual(project.taskIds);
  });

  it("uses the most recent task update as the project's latest recorded update", () => {
    const state = createDemoData(new Date("2026-11-10T12:00:00.000Z"));
    const project = state.projects[0]!;
    const tasks = getProjectTasks(state, project).map((task, index) => ({
      ...task,
      updatedAt: `2026-11-0${index + 1}T10:00:00.000Z`,
      statusUpdatedAt: index === 0 ? "2026-11-09T10:00:00.000Z" : undefined,
    }));

    expect(getLatestProjectUpdate(tasks)).toBe("2026-11-09T10:00:00.000Z");
    expect(getLatestProjectUpdate([])).toBeUndefined();
  });

  it("uses whichever task or status update timestamp is newest", () => {
    const task = createDemoData(new Date("2026-11-10T12:00:00.000Z")).tasks[0]!;

    expect(
      getTaskRecordedAt({
        ...task,
        updatedAt: "2026-11-10T10:00:00.000Z",
        statusUpdatedAt: "2026-11-09T10:00:00.000Z",
      }),
    ).toBe("2026-11-10T10:00:00.000Z");
  });

  it("filters attention tasks using the shared blocked, overdue, and stale rule", () => {
    const now = new Date("2026-11-10T12:00:00.000Z");
    const state = createDemoData(now);
    const project = state.projects[0]!;
    const recentTask: Task = {
      ...state.tasks.find((task) => task.id === "group-wireframes")!,
      internalDueDate: "2026-11-12",
      status: "in-progress",
      statusUpdatedAt: "2026-11-10T10:00:00.000Z",
    };
    const blockedTask: Task = {
      ...state.tasks.find((task) => task.id === "group-prototype")!,
      internalDueDate: "2026-11-12",
      status: "blocked",
      statusUpdatedAt: "2026-11-10T10:00:00.000Z",
    };
    const staleTask: Task = {
      ...recentTask,
      id: "stale",
      statusUpdatedAt: "2026-11-07T10:00:00.000Z",
    };
    const doneTask: Task = { ...recentTask, id: "done", status: "done" };
    const tasks = [recentTask, blockedTask, staleTask, doneTask];

    expect(filterProjectTasks(tasks, "all", now)).toEqual(tasks);
    expect(filterProjectTasks(tasks, "attention", now).map((task) => task.id)).toEqual([
      blockedTask.id,
      staleTask.id,
    ]);
    expect(project.id).toBe("project-hci");
  });
});
