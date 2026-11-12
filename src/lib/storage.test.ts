import { describe, expect, it } from "vitest";
import { createDemoData } from "./demo-data";
import { parseStoredState, serializeState } from "./storage";

type StoredRecord = Record<string, unknown>;

function asRecord(value: unknown): StoredRecord {
  return value as StoredRecord;
}

function asRecords(value: unknown): StoredRecord[] {
  return value as StoredRecord[];
}

function invalidStoredState(mutate: (state: StoredRecord) => void): string {
  const state = asRecord(JSON.parse(serializeState(createDemoData(new Date("2026-11-10T12:00:00+08:00")))));
  mutate(state);
  return JSON.stringify(state);
}

describe("versioned academic storage", () => {
  it("round-trips a valid state", () => {
    const state = createDemoData(new Date("2026-11-10T12:00:00+08:00"));
    expect(parseStoredState(serializeState(state))).toEqual(state);
  });

  it.each(["not json", "{}", JSON.stringify({ version: 999, tasks: [] })])(
    "returns null for malformed or unsupported data: %s",
    (raw) => {
      expect(parseStoredState(raw)).toBeNull();
    },
  );

  it.each([
    ["task date", (state: StoredRecord) => { asRecords(state.tasks)[0]!.date = "2026-02-30"; }],
    ["two-digit task year", (state: StoredRecord) => { asRecords(state.tasks)[0]!.date = "0099-01-01"; }],
    ["internal task deadline", (state: StoredRecord) => { asRecords(state.tasks)[8]!.internalDueDate = "2026-13-01"; }],
    ["project deadline", (state: StoredRecord) => { asRecords(state.projects)[0]!.officialDeadline = "2026-11-31"; }],
  ])("rejects an invalid real calendar date in %s", (_label, mutate) => {
    expect(parseStoredState(invalidStoredState(mutate))).toBeNull();
  });

  it.each([
    ["course color", (state: StoredRecord) => { asRecords(state.courses)[0]!.color = "red"; }],
    ["assessment type", (state: StoredRecord) => { asRecords(state.tasks)[0]!.assessmentType = "essay"; }],
    ["date meaning", (state: StoredRecord) => { asRecords(state.tasks)[0]!.dateMeaning = "someday"; }],
    ["priority", (state: StoredRecord) => { asRecords(state.tasks)[0]!.priority = "urgent"; }],
    ["status", (state: StoredRecord) => { asRecords(state.tasks)[0]!.status = "pending"; }],
  ])("rejects an unknown %s enum value", (_label, mutate) => {
    expect(parseStoredState(invalidStoredState(mutate))).toBeNull();
  });

  it.each([
    ["time", (state: StoredRecord) => { asRecords(state.tasks)[0]!.time = "24:00"; }],
    ["duration type", (state: StoredRecord) => { asRecords(state.tasks)[0]!.estimatedMinutes = "60"; }],
    ["duration range", (state: StoredRecord) => { asRecords(state.tasks)[0]!.estimatedMinutes = 1441; }],
    ["grade weight", (state: StoredRecord) => { asRecords(state.tasks)[0]!.gradeWeight = 101; }],
    ["timestamp", (state: StoredRecord) => { asRecords(state.tasks)[0]!.createdAt = "yesterday"; }],
    ["optional string", (state: StoredRecord) => { asRecords(state.tasks)[0]!.notes = ["not", "text"]; }],
    ["member ID array", (state: StoredRecord) => { asRecords(state.projects)[0]!.memberIds = ["member-alex", 42]; }],
    ["task ID array", (state: StoredRecord) => { asRecords(state.projects)[0]!.taskIds = ["missing-task"]; }],
  ])("rejects invalid stored %s data", (_label, mutate) => {
    expect(parseStoredState(invalidStoredState(mutate))).toBeNull();
  });

  it.each([
    ["current member", (state: StoredRecord) => { state.currentMemberId = "missing-member"; }],
    ["task course", (state: StoredRecord) => { asRecords(state.tasks)[0]!.courseId = "missing-course"; }],
    ["task project", (state: StoredRecord) => { asRecords(state.tasks)[8]!.projectId = "missing-project"; }],
    ["assignee", (state: StoredRecord) => { asRecords(state.tasks)[8]!.assignedTo = "missing-member"; }],
  ])("rejects a dangling %s reference", (_label, mutate) => {
    expect(parseStoredState(invalidStoredState(mutate))).toBeNull();
  });
});
