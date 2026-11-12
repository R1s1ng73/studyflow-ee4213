import type { AssessmentType, DateMeaning, Priority } from "./types";

export interface TaskFormValues {
  title: string;
  courseId: string;
  assessmentType: AssessmentType | "";
  dateMeaning: DateMeaning | "";
  date: string;
  time: string;
  priority: Priority;
  estimatedMinutes: string;
  gradeWeight: string;
  topicsCovered: string;
  notes: string;
}

export type TaskFormErrors = Partial<Record<keyof TaskFormValues, string>>;

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year!, month! - 1, day);
  return date.getFullYear() === year && date.getMonth() === month! - 1 && date.getDate() === day;
}

export function validateTaskForm(values: TaskFormValues): TaskFormErrors {
  const errors: TaskFormErrors = {};
  if (!values.title.trim()) errors.title = "Enter a task title.";
  if (!values.courseId) errors.courseId = "Select a course.";
  if (!values.assessmentType) errors.assessmentType = "Select an assessment type.";
  if (!values.dateMeaning) errors.dateMeaning = "Select what this date means.";
  if (!isValidDate(values.date)) errors.date = "Choose a valid date.";
  if (values.time && !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(values.time)) errors.time = "Enter a valid time.";

  if (values.estimatedMinutes) {
    const duration = Number(values.estimatedMinutes);
    if (!Number.isInteger(duration) || duration < 1 || duration > 1440) {
      errors.estimatedMinutes = "Duration must be between 1 and 1,440 minutes.";
    }
  }

  if (values.gradeWeight) {
    const weight = Number(values.gradeWeight);
    if (!Number.isFinite(weight) || weight < 0 || weight > 100) {
      errors.gradeWeight = "Grade weight must be between 0 and 100.";
    }
  }

  return errors;
}
