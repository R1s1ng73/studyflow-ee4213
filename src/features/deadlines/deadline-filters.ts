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
      if (!getTaskDate(task)) return false;
      if (filter === "completed") return task.status === "done";
      if (task.status === "done") return false;
      return filter === "overdue" ? getTaskDate(task) < today : getTaskDate(task) >= today;
    })
    .toSorted((left, right) => {
      const dateOrder = getTaskDate(left).localeCompare(getTaskDate(right));
      // Completed deadlines read best newest-first: closest to now, then further into the past.
      if (dateOrder !== 0) return filter === "completed" ? -dateOrder : dateOrder;
      return left.title.localeCompare(right.title) || left.id.localeCompare(right.id);
    });
}
