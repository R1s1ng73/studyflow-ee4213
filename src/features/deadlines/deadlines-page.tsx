"use client";

import { useMemo, useState } from "react";
import {
  IconAlertTriangle,
  IconCalendarDue,
  IconCircleCheck,
  IconPlus,
} from "@tabler/icons-react";
import { TaskTable } from "@/components/tasks/task-table";
import { useAcademic } from "@/context/academic-context";
import { getDeadlineTasks, type DeadlineFilter } from "./deadline-filters";

const FILTERS: Array<{
  value: DeadlineFilter;
  label: string;
  icon: typeof IconCalendarDue;
}> = [
  { value: "upcoming", label: "Upcoming", icon: IconCalendarDue },
  { value: "overdue", label: "Overdue", icon: IconAlertTriangle },
  { value: "completed", label: "Completed", icon: IconCircleCheck },
];

const EMPTY_COPY: Record<DeadlineFilter, { title: string; message: string }> = {
  upcoming: {
    title: "No upcoming academic deadlines recorded",
    message: "Add a task when you know the next date you need to manage.",
  },
  overdue: {
    title: "No overdue work",
    message: "There are no recorded unfinished tasks before today.",
  },
  completed: {
    title: "No completed deadlines yet",
    message: "Tasks marked done remain available in this view.",
  },
};

export function DeadlinesPage() {
  const { state, isHydrated, openTask } = useAcademic();
  const [filter, setFilter] = useState<DeadlineFilter>("upcoming");
  const now = useMemo(() => new Date(), []);
  const taskSets = useMemo(
    () => ({
      upcoming: getDeadlineTasks(state, "upcoming", now),
      overdue: getDeadlineTasks(state, "overdue", now),
      completed: getDeadlineTasks(state, "completed", now),
    }),
    [now, state],
  );

  if (!isHydrated) {
    return (
      <div className="card" aria-busy="true">
        <div className="card-body text-secondary">Loading recorded deadlines…</div>
      </div>
    );
  }

  const empty = EMPTY_COPY[filter];

  return (
    <div className="page-body">
      <div className="container-xl">
        <div className="page-header d-print-none mb-4">
          <div className="row g-2 align-items-center">
            <div className="col">
              <div className="page-pretitle">Academic planning</div>
              <h1 className="page-title">Deadlines</h1>
              <div className="text-secondary mt-1">
                Review the assessment dates and scheduled starts you have recorded.
              </div>
            </div>
            <div className="col-auto ms-auto">
              <button type="button" className="btn btn-primary" onClick={() => openTask()}>
                <IconPlus size={18} />
                Add task
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <ul className="nav nav-pills card-header-pills" role="tablist" aria-label="Deadline status">
              {FILTERS.map(({ value, label, icon: Icon }) => (
                <li className="nav-item" role="presentation" key={value}>
                  <button
                    type="button"
                    className={`nav-link${filter === value ? " active" : ""}`}
                    role="tab"
                    aria-selected={filter === value}
                    aria-controls={`deadline-${value}`}
                    onClick={() => setFilter(value)}
                  >
                    <Icon size={18} />
                    {label}
                    <span className={`badge ms-1${filter === value ? " bg-white text-primary" : " bg-secondary-lt"}`}>
                      {taskSets[value].length}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div id={`deadline-${filter}`} role="tabpanel">
            <TaskTable
              tasks={taskSets[filter]}
              emptyTitle={empty.title}
              emptyMessage={empty.message}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
