import {
  STORAGE_VERSION,
  type AcademicState,
  type Course,
  type GroupProject,
  type Task,
  type TeamMember,
} from "./types";

export const ACADEMIC_STORAGE_KEY = `studyflow:academic-state:v${STORAGE_VERSION}`;

const COURSE_COLORS = ["blue", "azure", "teal", "purple", "orange", "pink"] as const;
const ASSESSMENT_TYPES = ["assignment", "quiz", "test", "exam", "other"] as const;
const DATE_MEANINGS = ["submission-deadline", "scheduled-start", "date-to-remember"] as const;
const PRIORITIES = ["high", "medium", "low"] as const;
const TASK_STATUSES = ["not-started", "in-progress", "blocked", "done"] as const;
const TIME = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d\.\d{3}Z$/;

type StoredRecord = Record<string, unknown>;

function isRecord(value: unknown): value is StoredRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasStrings(record: StoredRecord, keys: readonly string[]): boolean {
  return keys.every((key) => typeof record[key] === "string");
}

function hasOptionalString(record: StoredRecord, key: string): boolean {
  return record[key] === undefined || typeof record[key] === "string";
}

function isOneOf(value: unknown, choices: readonly string[]): boolean {
  return typeof value === "string" && choices.includes(value);
}

function isDateOnly(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 100) return false;
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);

  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function isTimestamp(value: unknown): value is string {
  return (
    typeof value === "string" &&
    ISO_TIMESTAMP.test(value) &&
    isDateOnly(value.slice(0, 10)) &&
    Number.isFinite(Date.parse(value))
  );
}

function isOptionalNumberInRange(
  record: StoredRecord,
  key: string,
  minimum: number,
  maximum: number,
  integer = false,
): boolean {
  const value = record[key];
  return (
    value === undefined ||
    (typeof value === "number" &&
      Number.isFinite(value) &&
      (!integer || Number.isInteger(value)) &&
      value >= minimum &&
      value <= maximum)
  );
}

function isCourse(value: unknown): value is Course {
  return (
    isRecord(value) &&
    hasStrings(value, ["id", "code", "name"]) &&
    isOneOf(value.color, COURSE_COLORS)
  );
}

function isMember(value: unknown): value is TeamMember {
  return isRecord(value) && hasStrings(value, ["id", "displayName", "initials"]);
}

function isTask(value: unknown): value is Task {
  if (!isRecord(value)) return false;

  return (
    hasStrings(value, ["id", "title", "courseId"]) &&
    isOneOf(value.assessmentType, ASSESSMENT_TYPES) &&
    isOneOf(value.dateMeaning, DATE_MEANINGS) &&
    isDateOnly(value.date) &&
    (value.time === undefined || (typeof value.time === "string" && TIME.test(value.time))) &&
    isOneOf(value.priority, PRIORITIES) &&
    isOptionalNumberInRange(value, "estimatedMinutes", 1, 1440, true) &&
    isOptionalNumberInRange(value, "gradeWeight", 0, 100) &&
    ["topicsCovered", "notes", "projectId", "assignedTo", "blockerReason"].every((key) =>
      hasOptionalString(value, key),
    ) &&
    isOneOf(value.status, TASK_STATUSES) &&
    (value.internalDueDate === undefined || isDateOnly(value.internalDueDate)) &&
    isTimestamp(value.createdAt) &&
    isTimestamp(value.updatedAt) &&
    (value.statusUpdatedAt === undefined || isTimestamp(value.statusUpdatedAt))
  );
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isProject(value: unknown): value is GroupProject {
  return (
    isRecord(value) &&
    hasStrings(value, ["id", "name", "courseId"]) &&
    isDateOnly(value.officialDeadline) &&
    isStringArray(value.memberIds) &&
    isStringArray(value.taskIds)
  );
}

export function isAcademicState(value: unknown): value is AcademicState {
  if (!isRecord(value) || value.version !== STORAGE_VERSION || typeof value.currentMemberId !== "string") {
    return false;
  }

  const { courses, members, tasks, projects } = value;
  if (
    !Array.isArray(courses) ||
    !courses.every(isCourse) ||
    !Array.isArray(members) ||
    !members.every(isMember) ||
    !Array.isArray(tasks) ||
    !tasks.every(isTask) ||
    !Array.isArray(projects) ||
    !projects.every(isProject)
  ) {
    return false;
  }

  const courseIds = new Set(courses.map((course) => course.id));
  const memberIds = new Set(members.map((member) => member.id));
  const taskIds = new Set(tasks.map((task) => task.id));
  const projectIds = new Set(projects.map((project) => project.id));

  return (
    memberIds.has(value.currentMemberId) &&
    tasks.every(
      (task) =>
        courseIds.has(task.courseId) &&
        (task.projectId === undefined || projectIds.has(task.projectId)) &&
        (task.assignedTo === undefined || memberIds.has(task.assignedTo)),
    ) &&
    projects.every(
      (project) =>
        courseIds.has(project.courseId) &&
        project.memberIds.every((memberId) => memberIds.has(memberId)) &&
        project.taskIds.every((taskId) => taskIds.has(taskId)),
    )
  );
}

export function parseStoredState(raw: string | null): AcademicState | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isAcademicState(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function serializeState(state: AcademicState): string {
  return JSON.stringify(state);
}
