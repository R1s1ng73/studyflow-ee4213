import { describe, expect, it } from "vitest";
import type { AcademicState, Task } from "./types";
import {
  buildCalendarEvents,
  getDashboardMetrics,
  getHighImpactTasks,
  getProjectProgress,
  getShortTasks,
  isTaskAttentionNeeded,
} from "./selectors";

const now = new Date("2026-11-10T12:00:00+08:00");

function task(overrides: Partial<Task>): Task {
  return {
    id: "task-default",
    title: "Default task",
    courseId: "course-1",
    assessmentType: "assignment",
    dateMeaning: "submission-deadline",
    date: "2026-11-20",
    priority: "medium",
    status: "not-started",
    createdAt: "2026-11-01T00:00:00.000Z",
    updatedAt: "2026-11-01T00:00:00.000Z",
    ...overrides,
  };
}

const state: AcademicState = {
  version: 1,
  currentMemberId: "member-me",
  courses: [{ id: "course-1", code: "EE4213", name: "HCI", color: "blue" }],
  members: [
    { id: "member-me", displayName: "Alex Chen", initials: "AC" },
    { id: "member-2", displayName: "Maya Wong", initials: "MW" },
  ],
  projects: [
    {
      id: "project-1",
      name: "HCI Prototype",
      courseId: "course-1",
      officialDeadline: "2026-11-30",
      memberIds: ["member-me", "member-2"],
      taskIds: ["group-done", "group-blocked"],
    },
  ],
  tasks: [
    task({ id: "high-later", title: "High later", priority: "high", date: "2026-11-18", estimatedMinutes: 60 }),
    task({ id: "high-sooner", title: "High sooner", priority: "high", date: "2026-11-12", estimatedMinutes: 30 }),
    task({ id: "medium-short", title: "Medium short", priority: "medium", date: "2026-11-11", estimatedMinutes: 15 }),
    task({ id: "low-missing", title: "No estimate", priority: "low", date: "2026-11-15" }),
    task({ id: "overdue", title: "Overdue", priority: "medium", date: "2026-11-09" }),
    task({ id: "completed", title: "Completed", priority: "high", date: "2026-11-08", status: "done" }),
    task({
      id: "group-done",
      title: "Completed group task",
      projectId: "project-1",
      assignedTo: "member-me",
      internalDueDate: "2026-11-14",
      status: "done",
    }),
    task({
      id: "group-blocked",
      title: "Blocked group task",
      projectId: "project-1",
      assignedTo: "member-2",
      internalDueDate: "2026-11-09",
      status: "blocked",
      statusUpdatedAt: "2026-11-06T00:00:00.000Z",
    }),
  ],
};

describe("task prioritisation selectors", () => {
  it("orders unfinished high-impact tasks by priority then earliest date", () => {
    expect(getHighImpactTasks(state.tasks).map((item) => item.id)).toEqual([
      "high-sooner",
      "high-later",
      "group-blocked",
      "overdue",
      "medium-short",
      "low-missing",
    ]);
  });

  it("returns only estimated tasks within the selected time sorted shortest first", () => {
    expect(getShortTasks(state.tasks, 30).map((item) => item.id)).toEqual([
      "medium-short",
      "high-sooner",
    ]);
  });

  it("keeps overdue short tasks eligible but excludes completed work without changing duration order", () => {
    const candidates = [
      task({ id: "overdue-30", date: "2026-11-09", estimatedMinutes: 30 }),
      task({ id: "current-15", date: "2026-11-11", estimatedMinutes: 15 }),
      task({ id: "completed-5", date: "2026-11-08", estimatedMinutes: 5, status: "done" }),
    ];
    expect(getShortTasks(candidates, 30).map((item) => item.id)).toEqual(["current-15", "overdue-30"]);
  });
});

describe("derived project and dashboard information", () => {
  it("calculates project progress from referenced task records", () => {
    expect(getProjectProgress(state, state.projects[0]!)).toEqual({
      completed: 1,
      total: 2,
      percentage: 50,
      blocked: 1,
      needsAttention: 1,
    });
  });

  it("flags blocked, overdue, or stale incomplete group tasks without inferring work activity", () => {
    expect(isTaskAttentionNeeded(state.tasks.find((item) => item.id === "group-blocked")!, now)).toBe(true);
    expect(
      isTaskAttentionNeeded(
        task({ id: "stale", projectId: "project-1", statusUpdatedAt: "2026-11-07T00:00:00.000Z" }),
        now,
      ),
    ).toBe(true);
    expect(isTaskAttentionNeeded(task({ id: "fresh", projectId: "project-1", statusUpdatedAt: now.toISOString() }), now)).toBe(false);
  });

  it("derives dashboard metrics from records instead of stored counters", () => {
    expect(getDashboardMetrics(state, now)).toEqual({
      upcomingDeadlines: 4,
      urgentOrOverdue: 3,
      unfinishedPersonal: 5,
      groupNeedsAttention: 1,
    });
  });
});

describe("calendar projection", () => {
  it("creates one event per task and a separate official project deadline", () => {
    const events = buildCalendarEvents(state);
    expect(events.filter((event) => event.sourceId === "group-blocked")).toHaveLength(1);
    expect(events.find((event) => event.sourceId === "group-blocked")?.date).toBe("2026-11-09");
    expect(events.find((event) => event.sourceId === "project-1")?.date).toBe("2026-11-30");
    expect(new Set(events.map((event) => event.id)).size).toBe(events.length);
  });
});
