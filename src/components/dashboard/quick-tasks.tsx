import Link from "next/link";
import { format } from "date-fns";
import { IconAlertTriangle, IconArrowRight, IconBolt, IconClock } from "@tabler/icons-react";
import { parseDateOnly } from "@/lib/date";
import { getTaskDate, isTaskOverdue } from "@/lib/selectors";
import type { Course, Task } from "@/lib/types";

interface QuickTasksProps {
  tasks: Task[];
  courses: Course[];
  now: Date;
  onOpenTask: (taskId: string) => void;
}

export function QuickTasks({ tasks, courses, now, onOpenTask }: QuickTasksProps) {
  const coursesById = new Map(courses.map((course) => [course.id, course]));

  return (
    <section className="card h-100" aria-labelledby="quick-tasks-title">
      <div className="card-header">
        <div>
          <h2 className="card-title mb-1" id="quick-tasks-title">Quick wins</h2>
          <div className="text-secondary small">Unfinished work you can complete in 30 minutes</div>
        </div>
      </div>

      {tasks.length ? (
        <div className="list-group list-group-flush">
          {tasks.map((task) => {
            const course = coursesById.get(task.courseId);
            const overdue = isTaskOverdue(task, now);
            return (
              <div className="list-group-item" key={task.id}>
                <div className="d-flex align-items-center gap-3">
                  <span className="avatar avatar-sm bg-teal-lt text-teal" aria-hidden="true">
                    <IconBolt className="icon" />
                  </span>
                  <div className="flex-fill min-w-0">
                    <button
                      type="button"
                      className="btn btn-link link-body-emphasis fw-semibold text-start p-0 text-truncate d-block mw-100"
                      onClick={() => onOpenTask(task.id)}
                      aria-label={`Open ${task.title} details`}
                    >
                      {task.title}
                    </button>
                    <div className="text-secondary small mt-1">
                      <span className="fw-medium text-body">{course?.code ?? task.courseId.toUpperCase()}</span>
                      <span aria-hidden="true"> · </span>
                      <IconClock className="icon icon-sm me-1" aria-hidden="true" />
                      {task.estimatedMinutes} min
                      <span aria-hidden="true"> · </span>
                      {format(parseDateOnly(getTaskDate(task)), "d MMM")}
                      {overdue ? (
                        <>
                          <span aria-hidden="true"> · </span>
                          <span className="badge bg-red-lt text-red">
                            <IconAlertTriangle className="icon icon-sm me-1" aria-hidden="true" />
                            Overdue
                          </span>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card-body text-center py-5">
          <IconBolt className="icon icon-lg text-secondary mb-2" aria-hidden="true" />
          <h3 className="h4 mb-1">No short tasks waiting</h3>
          <p className="text-secondary mb-0">Add an estimate to a task to include it here.</p>
        </div>
      )}

      <div className="card-footer bg-transparent">
        <Link href="/tasks" className="btn btn-link px-0">
          Go to My Tasks <IconArrowRight className="icon ms-1" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
