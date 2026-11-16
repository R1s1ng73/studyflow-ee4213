import { describe, expect, it } from "vitest";
import { estimateTaskMinutes } from "./estimate";

describe("estimateTaskMinutes", () => {
  it("uses the assessment type when the title has no stronger signal", () => {
    expect(estimateTaskMinutes({ title: "Weekly check-in", assessmentType: "exam" })).toBe(120);
    expect(estimateTaskMinutes({ title: "Weekly check-in", assessmentType: "quiz" })).toBe(30);
  });

  it("raises the estimate for substantial deliverables", () => {
    expect(estimateTaskMinutes({ title: "Final essay", assessmentType: "assignment" })).toBe(180);
    expect(estimateTaskMinutes({ title: "Design report", assessmentType: "assignment" })).toBe(180);
    expect(estimateTaskMinutes({ title: "Dissertation draft", assessmentType: "other" })).toBe(300);
  });

  it("picks up action words in notes and topics", () => {
    expect(estimateTaskMinutes({ title: "Week 6", assessmentType: "other", notes: "Prepare presentation slides" })).toBe(120);
  });

  it("increases large-weight work and rounds to five minutes", () => {
    expect(estimateTaskMinutes({ title: "Lab report", assessmentType: "assignment", gradeWeight: 30 })).toBe(270);
    expect(estimateTaskMinutes({ title: "Quiz 1", assessmentType: "quiz", gradeWeight: 10 })).toBe(30);
  });

  it("keeps estimates within a practical planning range", () => {
    expect(estimateTaskMinutes({ title: "Registration form", assessmentType: "other" })).toBe(45);
    expect(
      estimateTaskMinutes({ title: "Dissertation", assessmentType: "exam", gradeWeight: 50 }),
    ).toBe(450);
  });
});
