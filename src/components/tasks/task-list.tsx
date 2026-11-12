"use client";

import { useState, type FormEvent } from "react";
import { format } from "date-fns";
import {
  IconCheck,
  IconClock,
  IconEdit,
  IconRefresh,
  IconRestore,
} from "@tabler/icons-react";
import { useAcademic } from "@/context/academic-context";
import { parseDateOnly } from "@/lib/date";
import { getTaskDate, isTaskOverdue } from "@/lib/selectors";
import type { Priority, Task } from "@/lib/types";
import { StatusBadge } from "./task-badges";

interface TaskListProps {
  tasks: Task[];
  emptyTitle: string;
  emptyMessage: string;
  showGradeWeight?: boolean;
}

function InlineEstimate({ task }: { task: Task }) {
  const { updateTask } = useAcademic();
  const [value, setValue] = useState(task.estimatedMinutes?.toString() ?? "");
  const [error, setError] = useState("");

  const save = (event: FormEvent) => {
    event.preventDefault();
    const parsed = Number(value);
    if (value && (!Number.isInteger(parsed) || parsed < 1 || parsed > 1440)) {
      setError("Use 1–1,440 minutes.");
      return;
    }
    setError("");
    updateTask(
      task.id,
      { estimatedMinutes: value ? parsed : undefined },
      value ? `Estimate updated to ${parsed} minutes.` : "Estimate removed.",
    );
  };

  return (
    <form onSubmit={save} className="d-flex align-items-start gap-2">
      <div>
        <div className="input-group input-group-sm" style={{ width: "9.5rem" }}>
          <span className="input-group-text" aria-hidden="true">
            <IconClock size={16} />
          </span>
          <input
            className={`form-control${error ? " is-invalid" : ""}`}
            type="number"
            min="1"
            max="1440"
            value={value}
            placeholder="Add estimate"
            aria-label={`Estimated minutes for ${task.title}`}
            aria-invalid={Boolean(error)}
            onChange={(event) => setValue(event.target.value)}
          />
        </div>
        {error ? <div className="text-danger small mt-1">{error}</div> : null}
      </div>
      <button type="submit" className="btn btn-sm btn-icon" aria-label={`Save estimate for ${task.title}`}>
        <IconCheck size={17} />
      </button>
    </form>
  );
}

export function TaskList({ tasks, emptyTitle, emptyMessage, showGradeWeight = false }: TaskListProps) {
  const { state, updateTask, openTask } = useAcademic();

  if (tasks.length === 0) {
    return (
      <div className="empty py-5">
        <div className="empty-icon">
          <IconRestore size={36} />
        </div>
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
            <th>Due</th>
            <th>Priority</th>
            <th>Estimate</th>
            <th>Status</th>
            <th className="w-1">Actions</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => {
            const course = state.courses.find((item) => item.id === task.courseId);
            const project = task.projectId
              ? state.projects.find((item) => item.id === task.projectId)
              : undefined;
            const dueDate = getTaskDate(task);
            const overdue = isTaskOverdue(task);
            return (
              <tr key={task.id} className={task.status === "done" ? "text-secondary" : undefined}>
                <td>
                  <button
                    type="button"
                    className="btn btn-link link-body-emphasis p-0 fw-semibold text-start"
                    onClick={() => openTask(task.id)}
                  >
                    {task.title}
                  </button>
                  <div className="d-flex flex-wrap gap-2 mt-1 small text-secondary">
                    <span>{course?.code ?? task.courseId.toUpperCase()}</span>
                    {project ? <span className="badge bg-purple-lt text-purple">{project.name}</span> : null}
                    {showGradeWeight && task.gradeWeight !== undefined ? (
                      <span>{task.gradeWeight}% of grade</span>
                    ) : null}
                  </div>
                </td>
                <td>
                  <div className={overdue ? "text-danger fw-semibold" : undefined}>
                    {format(parseDateOnly(dueDate), "d MMM yyyy")}
                  </div>
                  {overdue ? <div className="small text-danger">Overdue</div> : null}
                  {task.internalDueDate ? <div className="small text-secondary">Internal deadline</div> : null}
                </td>
                <td>
                  <select
                    className="form-select form-select-sm"
                    aria-label={`Priority for ${task.title}`}
                    value={task.priority}
                    onChange={(event) =>
                      updateTask(
                        task.id,
                        { priority: event.target.value as Priority },
                        `${task.title} priority updated.`,
                      )
                    }
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </td>
                <td>
                  <InlineEstimate
                    key={`${task.id}-${task.estimatedMinutes ?? "none"}`}
                    task={task}
                  />
                </td>
                <td><StatusBadge status={task.status} /></td>
                <td>
                  <div className="btn-list flex-nowrap">
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
                    <button
                      type="button"
                      className="btn btn-sm btn-icon"
                      aria-label={`Edit ${task.title}`}
                      onClick={() => openTask(task.id)}
                    >
                      <IconEdit size={17} />
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
