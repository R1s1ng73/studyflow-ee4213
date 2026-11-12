import { formatDateOnly } from "@/lib/date";
import { getTaskDate, getTasksForCurrentStudent } from "@/lib/selectors";
import type { AcademicState, Task } from "@/lib/types";

export type DeadlineFilter = "upcoming" | "overdue" | "completed";

export function getDeadlineTasks(
  state: AcademicState,
  filter: DeadlineFilter,
  now = new Date(),
): Task[] {
  const today = formatDateOnly(now);

  return getTasksForCurrentStudent(state)
    .filter((task) => {
      if (filter === "completed") return task.status === "done";
      if (task.status === "done") return false;
      return filter === "overdue" ? getTaskDate(task) < today : getTaskDate(task) >= today;
    })
    .toSorted(
      (left, right) =>
        getTaskDate(left).localeCompare(getTaskDate(right)) ||
        left.title.localeCompare(right.title) ||
        left.id.localeCompare(right.id),
    );
}
