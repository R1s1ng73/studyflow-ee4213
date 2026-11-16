import { differenceInCalendarDays } from "date-fns";
import { parseDateOnly } from "./date";
import type { Course, DateMeaning, Priority, Task } from "./types";

export const MAX_IMPORT_FILES = 6;
export const MAX_IMPORT_BYTES = 8 * 1024 * 1024;
export const IMPORT_MIME = ["application/pdf", "image/png", "image/jpeg", "image/webp"] as const;
export type ImportMime = typeof IMPORT_MIME[number];

export const IMPORT_DATE_LABELS: Record<DateMeaning, string> = {
  "submission-deadline": "Deadline",
  "scheduled-start": "Scheduled event",
  "date-to-remember": "Date to remember",
};

export interface ImportCandidate {
  title: string;
  courseHint: string;
  date: string;
  time: string;
  dateMeaning: DateMeaning;
  excerpt: string;
  reviewReason: string;
}

export const EXTERNAL_COURSE: Course = {
  id: "personal-imports", code: "Personal", name: "Activities and commitments", color: "purple",
};

export function priorityForDate(date: string, today: Date): Priority {
  if (!date) return "low";
  const days = differenceInCalendarDays(parseDateOnly(date), today);
  if (days >= 0 && days <= 3) return "high";
  return days <= 7 ? "medium" : "low";
}

function normalize(text: string) {
  return text.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
}

export function sameImportSlot(
  left: Pick<Task, "title" | "date" | "time" | "courseId" | "dateMeaning">,
  right: Pick<Task, "title" | "date" | "time" | "courseId" | "dateMeaning">,
) {
  const title = normalize(left.title);
  return Boolean(title && title === normalize(right.title) && left.courseId === right.courseId &&
    left.dateMeaning === right.dateMeaning && left.date === right.date && (left.time ?? "") === (right.time ?? ""));
}

export function findImportMatches(candidate: ImportCandidate, tasks: Task[]): Task[] {
  const title = normalize(candidate.title);
  if (!title) return [];
  return tasks.filter((task) => {
    const existing = normalize(task.title);
    return existing === title || (Math.min(title.length, existing.length) >= 8 &&
      (title.includes(existing) || existing.includes(title)));
  }).slice(0, 4);
}

export function guessImportCourse(courseHint: string, courses: Course[]): string {
  const hint = normalize(courseHint);
  if (!hint) return EXTERNAL_COURSE.id;
  const matches = courses.filter((course) => [course.code, course.name].some((value) => {
    const key = normalize(value);
    return key && (hint === key || (key.length >= 5 && hint.includes(key)));
  }));
  return matches.length === 1 ? matches[0]!.id : EXTERNAL_COURSE.id;
}
