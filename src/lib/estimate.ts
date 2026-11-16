import type { AssessmentType, Task } from "./types";

type EstimateInput = Pick<Task, "title" | "assessmentType"> &
  Partial<Pick<Task, "gradeWeight" | "topicsCovered" | "notes">>;

const TYPE_BASELINE: Record<AssessmentType, number> = {
  exam: 120,
  test: 90,
  quiz: 30,
  assignment: 60,
  other: 45,
};

/**
 * Ordered from most to least specific. The first matching phrase sets the floor;
 * the assessment type baseline wins when it is larger.
 */
const KEYWORD_MINUTES: Array<[RegExp, number]> = [
  [/\b(dissertation|thesis)\b/i, 300],
  [/\b(report|essay|write[- ]?up|paper)\b/i, 180],
  [/\b(project|prototype|portfolio)\b/i, 180],
  [/\b(presentation|video|demo|slides)\b/i, 120],
  [/\b(exam|final)\b/i, 120],
  [/\b(test|midterm)\b/i, 90],
  [/\b(lab|experiment|practical)\b/i, 90],
  [/\b(assignment|homework|worksheet|exercise|problem set)\b/i, 60],
  [/\b(reading|read|chapter|article|case study)\b/i, 45],
  [/\b(quiz)\b/i, 30],
  [/\b(discussion|forum|reflection|survey|form|registration)\b/i, 15],
];

const MINIMUM_MINUTES = 15;
const MAXIMUM_MINUTES = 480;

export const MIN_ESTIMATE_MINUTES = 5;
export const MAX_ESTIMATE_MINUTES = 1440;

/**
 * Validates an estimate returned by the model: a whole number of minutes from
 * 5 to 1440, rounded to the nearest five. Returns undefined when unusable.
 */
export function normalizeEstimateMinutes(value: unknown): number | undefined {
  if (typeof value !== "number" && typeof value !== "string") return undefined;
  if (typeof value === "string" && !value.trim()) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  return Math.min(
    MAX_ESTIMATE_MINUTES,
    Math.max(MIN_ESTIMATE_MINUTES, Math.round(parsed / 5) * 5),
  );
}

/**
 * Local, deterministic planning estimate. Signals: assessment type, action words
 * in the title/notes, and grade weight. Keeps the workspace usable without an
 * API call and never overwrites estimates the user already saved.
 */
export function estimateTaskMinutes(input: EstimateInput): number {
  const text = [input.title, input.topicsCovered, input.notes].filter(Boolean).join(" ");
  const baseline = TYPE_BASELINE[input.assessmentType] ?? TYPE_BASELINE.other;
  const keyword = KEYWORD_MINUTES.find(([pattern]) => pattern.test(text))?.[1] ?? 0;
  let minutes = Math.max(baseline, keyword);

  if (typeof input.gradeWeight === "number" && input.gradeWeight >= 25) {
    minutes = Math.round(minutes * 1.5);
  }

  return Math.min(MAXIMUM_MINUTES, Math.max(MINIMUM_MINUTES, Math.round(minutes / 5) * 5));
}
