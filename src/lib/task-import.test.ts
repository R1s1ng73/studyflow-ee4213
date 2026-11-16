import { expect, it } from "vitest";
import { academicReducer } from "@/context/academic-reducer";
import { buildCalendarEvents, getHighImpactTasks } from "./selectors";
import { isAcademicState } from "./storage";
import { EXTERNAL_COURSE, priorityForDate } from "./task-import";
import { STORAGE_VERSION, type AcademicState, type Task } from "./types";

it("keeps external imports across Canvas sync and adds them once to tasks and calendar", () => {
  const empty: AcademicState = { version: STORAGE_VERSION, currentMemberId: "", courses: [], members: [], tasks: [], projects: [] };
  const timestamp = "2026-11-23T08:00:00.000Z";
  const item: Task = {
    id: "test-1", title: "Hackathon registration", date: "2026-11-25", time: "18:00",
    courseId: EXTERNAL_COURSE.id, assessmentType: "other", dateMeaning: "submission-deadline",
    status: "not-started", priority: priorityForDate("2026-11-25", new Date(timestamp)),
    createdAt: timestamp, updatedAt: timestamp, importSource: { filename: "poster.png", excerpt: "Registration deadline" },
  };
  const imported = academicReducer(empty, { type: "task/import", tasks: [item, { ...item, id: "test-2" }] });
  const synced = academicReducer(imported, { type: "canvas/sync", state: {
    ...empty, currentMemberId: "canvas-user-1", members: [{ id: "canvas-user-1", displayName: "Student", initials: "S" }],
  } });
  expect(isAcademicState(synced)).toBe(true);
  expect(getHighImpactTasks(synced.tasks)).toMatchObject([{ id: "test-1", priority: "high" }]);
  expect(buildCalendarEvents(synced)).toMatchObject([{ sourceId: "test-1", date: "2026-11-25", time: "18:00" }]);
});
