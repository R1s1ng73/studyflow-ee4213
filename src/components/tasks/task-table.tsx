"use client";

import { format } from "date-fns";
import { IconCheck, IconEdit, IconRefresh } from "@tabler/icons-react";
import { useAcademic } from "@/context/academic-context";
import { parseDateOnly } from "@/lib/date";
import { getTaskDate } from "@/lib/selectors";
import type { Task } from "@/lib/types";
import { PriorityBadge, StatusBadge } from "./task-badges";

const TYPE_LABELS = {
  assignment: "Assignment",
  quiz: "Quiz",
  test: "Test",
  exam: "Exam",
  other: "Other",
} as const;

const DATE_LABELS = {
  "submission-deadline": "Submission deadline",
  "scheduled-start": "Scheduled start",
  "date-to-remember": "Date to remember",
} as const;

interface TaskTableProps {
  tasks: Task[];
  emptyTitle: string;
  emptyMessage: string;
}

export function TaskTable({ tasks, emptyTitle, emptyMessage }: TaskTableProps) {
  const { state, openTask, updateTask } = useAcademic();

  if (tasks.length === 0) {
    return (
      <div className="empty py-5">
        <p className="empty-title">{emptyTitle}</p>
        <p className="empty-subtitle text-secondary">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="table table-vcenter card-table">
        <thead>
          <tr>
            <th>Task</th>
            <th>Assessment</th>
            <th>Date</th>
            <th>Priority</th>
            <th>Status</th>
            <th className="w-1">Actions</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => {
            const course = state.courses.find((item) => item.id === task.courseId);
            const project = task.projectId ? state.projects.find((item) => item.id === task.projectId) : undefined;
            const effectiveDate = getTaskDate(task);
            return (
              <tr key={task.id}>
                <td>
                  <button
                    type="button"
                    className="btn btn-link link-body-emphasis fw-semibold p-0 text-start"
                    onClick={() => openTask(task.id)}
                  >
                    {task.title}
                  </button>
                  <div className="d-flex flex-wrap gap-2 mt-1">
                    <span className="badge bg-blue-lt text-blue">{course?.code ?? task.courseId.toUpperCase()}</span>
                    {project ? <span className="small text-secondary">{project.name}</span> : null}
                  </div>
                </td>
                <td>
                  <div>{TYPE_LABELS[task.assessmentType]}</div>
                  <div className="small text-secondary">{DATE_LABELS[task.dateMeaning]}</div>
                </td>
                <td>
                  <div className="fw-medium">{format(parseDateOnly(effectiveDate), "d MMM yyyy")}</div>
                  {task.time ? <div className="small text-secondary">{task.time}</div> : null}
                  {task.internalDueDate ? <div className="small text-secondary">Internal deadline</div> : null}
                </td>
                <td><PriorityBadge priority={task.priority} /></td>
                <td><StatusBadge status={task.status} /></td>
                <td>
                  <div className="btn-list flex-nowrap">
                    <button
                      type="button"
                      className="btn btn-sm btn-icon"
                      aria-label={`Edit ${task.title}`}
                      onClick={() => openTask(task.id)}
                    >
                      <IconEdit size={17} />
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${task.status === "done" ? "btn-outline-primary" : "btn-primary"}`}
                      onClick={() =>
                        updateTask(
                          task.id,
                          { status: task.status === "done" ? "not-started" : "done" },
                          task.status === "done" ? `${task.title} reopened.` : `${task.title} marked done.`,
                        )
                      }
                    >
                      {task.status === "done" ? <IconRefresh size={17} /> : <IconCheck size={17} />}
                      {task.status === "done" ? "Reopen" : "Done"}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
