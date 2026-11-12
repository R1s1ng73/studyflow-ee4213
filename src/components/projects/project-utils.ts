import { isTaskAttentionNeeded } from "@/lib/selectors";
import type { AcademicState, GroupProject, Task } from "@/lib/types";

export type ProjectTaskFilter = "all" | "attention";

export function getProjectTasks(state: AcademicState, project: GroupProject): Task[] {
  const tasksById = new Map(state.tasks.map((task) => [task.id, task]));
  return project.taskIds
    .map((taskId) => tasksById.get(taskId))
    .filter((task): task is Task => Boolean(task));
}

export function getLatestProjectUpdate(tasks: Task[]): string | undefined {
  return tasks.reduce<string | undefined>((latest, task) => {
    const recordedAt = getTaskRecordedAt(task);
    return latest === undefined || recordedAt > latest ? recordedAt : latest;
  }, undefined);
}

export function getTaskRecordedAt(task: Task): string {
  return task.statusUpdatedAt && task.statusUpdatedAt > task.updatedAt
    ? task.statusUpdatedAt
    : task.updatedAt;
}

export function filterProjectTasks(
  tasks: Task[],
  filter: ProjectTaskFilter,
  now = new Date(),
): Task[] {
  if (filter === "all") return tasks;
  return tasks.filter((task) => isTaskAttentionNeeded(task, now));
}
