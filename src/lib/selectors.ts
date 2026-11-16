import { addDays, differenceInHours, isBefore } from "date-fns";
import { compareDateOnly, formatDateOnly, parseDateOnly, startOfLocalDay } from "./date";
import type {
  AcademicState,
  CalendarEvent,
  DashboardMetrics,
  GroupProject,
  ProjectProgress,
  Task,
} from "./types";

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 } as const;
export const STALE_STATUS_HOURS = 48;

export function getTaskDate(task: Task): string {
  return task.internalDueDate ?? task.date;
}

function compareTaskDates(left: Task, right: Task) {
  const a = getTaskDate(left);
  const b = getTaskDate(right);
  return a && b ? compareDateOnly(a, b) : Number(!a) - Number(!b);
}

export function getHighImpactTasks(tasks: Task[]): Task[] {
  return tasks
    .filter((task) => task.status !== "done")
    .toSorted((left, right) => {
      const priority = PRIORITY_ORDER[left.priority] - PRIORITY_ORDER[right.priority];
      if (priority !== 0) return priority;
      const date = compareTaskDates(left, right);
      if (date !== 0) return date;
      return left.title.localeCompare(right.title) || left.id.localeCompare(right.id);
    });
}

export function getShortTasks(tasks: Task[], availableMinutes: number): Task[] {
  return tasks
    .filter(
      (task) =>
        task.status !== "done" &&
        typeof task.estimatedMinutes === "number" &&
        task.estimatedMinutes <= availableMinutes,
    )
    .toSorted((left, right) => {
      const duration = left.estimatedMinutes! - right.estimatedMinutes!;
      if (duration !== 0) return duration;
      return compareTaskDates(left, right) || left.title.localeCompare(right.title);
    });
}

export function getTasksForCurrentStudent(state: AcademicState): Task[] {
  return state.tasks.filter(
    (task) => !task.projectId || task.canvasUrl || task.assignedTo === state.currentMemberId,
  );
}

export function isTaskOverdue(task: Task, now = new Date()): boolean {
  const date = getTaskDate(task);
  return Boolean(date && task.status !== "done" && isBefore(parseDateOnly(date), startOfLocalDay(now)));
}

export function isTaskAttentionNeeded(task: Task, now = new Date()): boolean {
  if (!task.projectId || task.status === "done") return false;
  if (task.status === "blocked" || isTaskOverdue(task, now)) return true;
  if (task.canvasUrl) return false;

  const lastStatusUpdate = new Date(task.statusUpdatedAt ?? task.updatedAt);
  return differenceInHours(now, lastStatusUpdate) > STALE_STATUS_HOURS;
}

export function getProjectProgress(
  state: AcademicState,
  project: GroupProject,
  now = new Date(),
): ProjectProgress {
  const tasks = project.taskIds
    .map((id) => state.tasks.find((task) => task.id === id))
    .filter((task): task is Task => Boolean(task));
  const completed = tasks.filter((task) => task.status === "done").length;

  return {
    completed,
    total: tasks.length,
    percentage: tasks.length === 0 ? 0 : Math.round((completed / tasks.length) * 100),
    blocked: tasks.filter((task) => task.status === "blocked").length,
    needsAttention: tasks.filter((task) => isTaskAttentionNeeded(task, now)).length,
  };
}

export function getDashboardMetrics(state: AcademicState, now = new Date()): DashboardMetrics {
  const currentDate = formatDateOnly(now);
  const upcomingEnd = formatDateOnly(addDays(startOfLocalDay(now), 14));
  const urgentEnd = formatDateOnly(addDays(startOfLocalDay(now), 3));
  const currentStudentTasks = getTasksForCurrentStudent(state);
  const personal = state.tasks.filter((task) => !task.projectId || task.canvasUrl);

  return {
    upcomingDeadlines: currentStudentTasks.filter((task) => {
      const date = getTaskDate(task);
      return task.status !== "done" && date >= currentDate && date <= upcomingEnd;
    }).length,
    urgentOrOverdue: personal.filter((task) => {
      const date = getTaskDate(task);
      return Boolean(date && task.status !== "done" && date <= urgentEnd);
    }).length,
    unfinishedPersonal: personal.filter((task) => task.status !== "done").length,
    groupNeedsAttention: state.tasks.filter((task) => isTaskAttentionNeeded(task, now)).length,
  };
}

export function buildCalendarEvents(state: AcademicState): CalendarEvent[] {
  const taskEvents: CalendarEvent[] = state.tasks.filter(getTaskDate).map((task) => ({
    id: `task:${task.id}`,
    sourceId: task.id,
    sourceType: "task",
    date: getTaskDate(task),
    time: task.time,
    title: task.title,
    courseId: task.courseId,
    category: task.projectId ? "group-task" : task.assessmentType,
    completed: task.status === "done",
    dateMeaning: task.canvasUrl && task.projectId ? "official-project-deadline"
      : task.projectId ? "internal-deadline" : task.dateMeaning,
  }));

  const projectEvents: CalendarEvent[] = state.projects.filter((project) => !project.canvasUrl && project.officialDeadline).map((project) => ({
    id: `project:${project.id}`,
    sourceId: project.id,
    sourceType: "project",
    date: project.officialDeadline,
    title: `${project.name} submission`,
    courseId: project.courseId,
    category: "project-deadline",
    completed: false,
    dateMeaning: "official-project-deadline",
  }));

  return [...taskEvents, ...projectEvents].toSorted(
    (left, right) => compareDateOnly(left.date, right.date) || left.title.localeCompare(right.title),
  );
}
