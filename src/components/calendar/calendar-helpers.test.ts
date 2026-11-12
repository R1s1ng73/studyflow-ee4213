import { describe, expect, it } from "vitest";
import type { CalendarEvent } from "@/lib/types";
import {
  buildMonthDays,
  getCalendarCategoryLabel,
  groupCalendarEventsByDate,
} from "./calendar-helpers";

function event(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: "task:task-1",
    sourceId: "task-1",
    sourceType: "task",
    date: "2026-11-10",
    title: "Coursework",
    courseId: "course-1",
    category: "assignment",
    completed: false,
    dateMeaning: "submission-deadline",
    ...overrides,
  };
}

describe("buildMonthDays", () => {
  it("builds a Monday-first six-week grid around the selected month", () => {
    const days = buildMonthDays(new Date(2026, 10, 15));

    expect(days).toHaveLength(42);
    expect(days[0]).toMatchObject({ dateKey: "2026-10-26", isCurrentMonth: false });
    expect(days[6]).toMatchObject({ dateKey: "2026-11-01", isCurrentMonth: true });
    expect(days[41]).toMatchObject({ dateKey: "2026-12-06", isCurrentMonth: false });
    expect(days[0]?.date.getDay()).toBe(1);
  });

  it("marks a matching local date as today", () => {
    const days = buildMonthDays(new Date(2026, 10, 1), new Date(2026, 10, 10));

    expect(days.find((day) => day.isToday)?.dateKey).toBe("2026-11-10");
  });
});

describe("groupCalendarEventsByDate", () => {
  it("keeps one shared event record in exactly one date bucket", () => {
    const events = [
      event(),
      event({ id: "project:project-1", sourceId: "project-1", sourceType: "project", category: "project-deadline" }),
    ];

    const grouped = groupCalendarEventsByDate(events);

    expect(grouped.get("2026-11-10")).toEqual(events);
    expect([...grouped.values()].flat()).toHaveLength(2);
  });
});

describe("getCalendarCategoryLabel", () => {
  it.each([
    ["assignment", "Assignment"],
    ["group-task", "Group task"],
    ["project-deadline", "Project deadline"],
  ] as const)("labels %s events with text", (category, label) => {
    expect(getCalendarCategoryLabel(category)).toBe(label);
  });
});
