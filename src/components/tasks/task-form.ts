import type { Task, TaskDraft } from "@/lib/types";
import type { TaskFormValues } from "@/lib/validation";

export function taskToFormValues(task?: Task): TaskFormValues {
  return {
    title: task?.title ?? "",
    courseId: task?.courseId ?? "",
    assessmentType: task?.assessmentType ?? "",
    dateMeaning: task?.dateMeaning ?? "",
    date: task?.internalDueDate ?? task?.date ?? "",
    time: task?.time ?? "",
    priority: task?.priority ?? "medium",
    estimatedMinutes: task?.estimatedMinutes?.toString() ?? "",
    gradeWeight: task?.gradeWeight?.toString() ?? "",
    topicsCovered: task?.topicsCovered ?? "",
    notes: task?.notes ?? "",
  };
}

function optionalText(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed || undefined;
}

export function buildTaskDraft(values: TaskFormValues, existing?: Task): TaskDraft {
  const usesInternalDueDate = Boolean(existing?.projectId || existing?.internalDueDate);
  const optionalFields = existing
    ? {
        time: values.time || undefined,
        estimatedMinutes: values.estimatedMinutes ? Number(values.estimatedMinutes) : undefined,
        gradeWeight: values.gradeWeight ? Number(values.gradeWeight) : undefined,
        topicsCovered: optionalText(values.topicsCovered),
        notes: optionalText(values.notes),
      }
    : {
        ...(values.time ? { time: values.time } : {}),
        ...(values.estimatedMinutes ? { estimatedMinutes: Number(values.estimatedMinutes) } : {}),
        ...(values.gradeWeight ? { gradeWeight: Number(values.gradeWeight) } : {}),
        ...(optionalText(values.topicsCovered) ? { topicsCovered: optionalText(values.topicsCovered) } : {}),
        ...(optionalText(values.notes) ? { notes: optionalText(values.notes) } : {}),
      };

  return {
    title: values.title.trim(),
    courseId: values.courseId,
    assessmentType: values.assessmentType || "other",
    dateMeaning: values.dateMeaning || "date-to-remember",
    date: usesInternalDueDate ? existing!.date : values.date,
    ...optionalFields,
    priority: values.priority,
    status: existing?.status ?? "not-started",
    ...(existing?.projectId ? { projectId: existing.projectId } : {}),
    ...(existing?.assignedTo ? { assignedTo: existing.assignedTo } : {}),
    ...(usesInternalDueDate ? { internalDueDate: values.date } : {}),
    ...(existing?.blockerReason ? { blockerReason: existing.blockerReason } : {}),
  };
}
