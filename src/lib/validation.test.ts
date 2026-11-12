import { describe, expect, it } from "vitest";
import { validateTaskForm, type TaskFormValues } from "./validation";

const valid: TaskFormValues = {
  title: "HCI report",
  courseId: "ee4213",
  assessmentType: "assignment",
  dateMeaning: "submission-deadline",
  date: "2026-11-20",
  time: "",
  priority: "medium",
  estimatedMinutes: "",
  gradeWeight: "",
  topicsCovered: "",
  notes: "",
};

describe("task form validation", () => {
  it("requires the core quick-capture fields", () => {
    expect(
      validateTaskForm({ ...valid, title: "", courseId: "", assessmentType: "", dateMeaning: "", date: "" }),
    ).toEqual({
      title: "Enter a task title.",
      courseId: "Select a course.",
      assessmentType: "Select an assessment type.",
      dateMeaning: "Select what this date means.",
      date: "Choose a valid date.",
    });
  });

  it("validates optional time and numeric ranges without requiring them", () => {
    expect(validateTaskForm({ ...valid, time: "25:00", estimatedMinutes: "0", gradeWeight: "101" })).toEqual({
      time: "Enter a valid time.",
      estimatedMinutes: "Duration must be between 1 and 1,440 minutes.",
      gradeWeight: "Grade weight must be between 0 and 100.",
    });
    expect(validateTaskForm(valid)).toEqual({});
  });
});
