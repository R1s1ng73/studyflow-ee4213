import { describe, expect, it } from "vitest";
import type { Task } from "@/lib/types";
import { buildTaskDraft, taskToFormValues } from "./task-form";

const task: Task = {
  id: "task-1",
  title: "  Design report  ",
  courseId: "ee4213",
  assessmentType: "assignment",
  dateMeaning: "submission-deadline",
  date: "2026-11-20",
  time: "23:59",
  priority: "high",
  estimatedMinutes: 60,
  gradeWeight: 25,
  topicsCovered: "  Interviews  ",
  notes: "  Draft ready  ",
  status: "in-progress",
  projectId: "project-hci",
  assignedTo: "member-alex",
  internalDueDate: "2026-11-18",
  createdAt: "2026-11-01T00:00:00.000Z",
  updatedAt: "2026-11-02T00:00:00.000Z",
};

describe("task form conversion", () => {
  it("represents an existing task without losing optional values", () => {
    expect(taskToFormValues(task)).toMatchObject({
      title: "  Design report  ",
      date: "2026-11-18",
      estimatedMinutes: "60",
      gradeWeight: "25",
      notes: "  Draft ready  ",
    });
  });

  it("updates a group task internal deadline while preserving its base date", () => {
    const values = taskToFormValues(task);
    values.date = "2026-11-19";

    const draft = buildTaskDraft(values, task);

    expect(draft).toMatchObject({
      title: "Design report",
      date: "2026-11-20",
      topicsCovered: "Interviews",
      notes: "Draft ready",
      estimatedMinutes: 60,
      gradeWeight: 25,
      projectId: "project-hci",
      assignedTo: "member-alex",
      internalDueDate: "2026-11-19",
      status: "in-progress",
    });
  });

  it("emits cleared optional fields on edit so merge updates remove stale values", () => {
    const values = taskToFormValues(task);
    values.time = "";
    values.estimatedMinutes = "";
    values.gradeWeight = "";
    values.topicsCovered = "  ";
    values.notes = "";

    const draft = buildTaskDraft(values, task);

    for (const field of ["time", "estimatedMinutes", "gradeWeight", "topicsCovered", "notes"] as const) {
      expect(draft).toHaveProperty(field, undefined);
    }
  });

  it("omits blank optional fields from a new task", () => {
    const values = taskToFormValues();
    values.title = "Quiz revision";
    values.courseId = "ee3204";
    values.assessmentType = "quiz";
    values.dateMeaning = "scheduled-start";
    values.date = "2026-11-21";

    expect(buildTaskDraft(values)).toEqual({
      title: "Quiz revision",
      courseId: "ee3204",
      assessmentType: "quiz",
      dateMeaning: "scheduled-start",
      date: "2026-11-21",
      priority: "medium",
      status: "not-started",
    });
  });
});
