import Link from "next/link";
import { differenceInCalendarDays, format } from "date-fns";
import { IconArrowRight, IconCalendarDue, IconClock } from "@tabler/icons-react";
import { parseDateOnly } from "@/lib/date";
import { getTaskDate } from "@/lib/selectors";
import type { Course, Task } from "@/lib/types";

interface UpcomingListProps {
  tasks: Task[];
  courses: Course[];
  now: Date;
  onOpenTask: (taskId: string) => void;
}

function dueLabel(task: Task, now: Date): string {
  const days = differenceInCalendarDays(parseDateOnly(getTaskDate(task)), now);
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  if (days > 1) return `Due in ${days} days`;
  return `${Math.abs(days)} ${Math.abs(days) === 1 ? "day" : "days"} overdue`;
}

function statusLabel(status: Task["status"]): string {
  if (status === "not-started") return "Not started";
  if (status === "in-progress") return "In progress";
  if (status === "blocked") return "Blocked";
  return "Done";
}

export function UpcomingList({ tasks, courses, now, onOpenTask }: UpcomingListProps) {
  const coursesById = new Map(courses.map((course) => [course.id, course]));

  return (
    <section className="card h-100" aria-labelledby="upcoming-deadlines-title">
      <div className="card-header">
        <div>
          <h2 className="card-title mb-1" id="upcoming-deadlines-title">Upcoming deadlines</h2>
          <div className="text-secondary small">Your next recorded due dates</div>
        </div>
      </div>

      {tasks.length ? (
        <div className="list-group list-group-flush">
          {tasks.map((task) => {
            const course = coursesById.get(task.courseId);
            const taskDate = parseDateOnly(getTaskDate(task));
            return (
              <div className="list-group-item" key={task.id}>
                <div className="row align-items-center g-3">
                  <div className="col-auto">
                    <span className={`avatar bg-${course?.color ?? "blue"}-lt text-${course?.color ?? "blue"}`} aria-hidden="true">
                      <IconCalendarDue className="icon" />
                    </span>
                  </div>
                  <div className="col min-w-0">
                    <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                      <button
                        type="button"
                        className="btn btn-link link-body-emphasis fw-semibold text-start p-0 text-truncate"
                        onClick={() => onOpenTask(task.id)}
                        aria-label={`Open ${task.title} details`}
                      >
                        {task.title}
                      </button>
                      <span className={`badge bg-${task.priority === "high" ? "red" : task.priority === "medium" ? "orange" : "azure"}-lt`}>
                        {task.priority} priority
                      </span>
                    </div>
                    <div className="d-flex align-items-center gap-2 flex-wrap text-secondary small">
                      <span className="fw-medium text-body">{course?.code ?? task.courseId.toUpperCase()}</span>
                      <span aria-hidden="true">·</span>
                      <span>{format(taskDate, "EEE, d MMM")}{task.time ? ` at ${task.time}` : ""}</span>
                      <span aria-hidden="true">·</span>
                      <span className={differenceInCalendarDays(taskDate, now) <= 1 ? "text-danger fw-medium" : undefined}>
                        {dueLabel(task, now)}
                      </span>
                      <span className="visually-hidden">Status: </span>
                      <span className="badge bg-secondary-lt">{statusLabel(task.status)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card-body text-center py-5">
          <IconClock className="icon icon-lg text-secondary mb-2" aria-hidden="true" />
          <h3 className="h4 mb-1">No upcoming deadlines</h3>
          <p className="text-secondary mb-0">Add a deadline to see what is coming next.</p>
        </div>
      )}

      <div className="card-footer bg-transparent">
        <Link href="/deadlines" className="btn btn-link px-0">
          View all deadlines <IconArrowRight className="icon ms-1" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
