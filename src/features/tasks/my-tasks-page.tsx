"use client";

import { useMemo, useState } from "react";
import {
  IconBolt,
  IconCheck,
  IconClock,
  IconPlus,
  IconSparkles,
} from "@tabler/icons-react";
import { TaskList } from "@/components/tasks/task-list";
import { useAcademic } from "@/context/academic-context";
import {
  getHighImpactTasks,
  getShortTasks,
  getTaskDate,
  getTasksForCurrentStudent,
} from "@/lib/selectors";

type TaskMode = "impact" | "short";
const DURATIONS = [15, 30, 60, 120] as const;

export function MyTasksPage() {
  const { state, isHydrated, openTask, estimateTasks } = useAcademic();
  const [mode, setMode] = useState<TaskMode>("impact");
  const [availableMinutes, setAvailableMinutes] = useState<number>(30);
  const [showMissing, setShowMissing] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showUndated, setShowUndated] = useState(false);

  const currentStudentTasks = useMemo(() => getTasksForCurrentStudent(state), [state]);
  const highImpact = useMemo(() => getHighImpactTasks(currentStudentTasks), [currentStudentTasks]);
  const shortTasks = useMemo(
    () => getShortTasks(currentStudentTasks, availableMinutes),
    [availableMinutes, currentStudentTasks],
  );
  const missingEstimates = useMemo(
    () =>
      currentStudentTasks.filter(
        (task) => task.status !== "done" && task.estimatedMinutes === undefined,
      ),
    [currentStudentTasks],
  );
  const completedTasks = useMemo(
    () => currentStudentTasks.filter((task) => task.status === "done"),
    [currentStudentTasks],
  );
  const undatedCount = useMemo(
    () => currentStudentTasks.filter((task) => task.status !== "done" && !getTaskDate(task)).length,
    [currentStudentTasks],
  );

  if (!isHydrated) {
    return (
      <div className="card" aria-busy="true">
        <div className="card-body text-secondary">Loading your tasks…</div>
      </div>
    );
  }

  const activeTasks = mode === "impact" ? highImpact : shortTasks;
  const undatedInView = activeTasks.filter((task) => !getTaskDate(task)).length;
  const visibleTasks = showUndated
    ? activeTasks
    : activeTasks.filter((task) => Boolean(getTaskDate(task)));
  const displayedTasks = showMissing && mode === "short" ? missingEstimates : visibleTasks;
  const pendingEstimates = displayedTasks.filter((task) => task.estimatedMinutes === undefined);

  const emptyTitle =
    mode === "impact"
      ? undatedInView > 0
        ? "No dated tasks to show"
        : "No unfinished tasks"
      : showMissing
        ? "Every unfinished task has an estimate"
        : undatedInView > 0
          ? `No dated tasks fit within ${availableMinutes} minutes`
          : `No tasks fit within ${availableMinutes} minutes`;

  const hiddenNote =
    !showMissing && undatedInView > 0
      ? ` ${undatedInView} matching ${undatedInView === 1 ? "task has" : "tasks have"} no due date and ${undatedInView === 1 ? "is" : "are"} hidden. Turn on “Show tasks without a due date” to include ${undatedInView === 1 ? "it" : "them"}.`
      : "";

  const emptyMessage =
    mode === "impact"
      ? `Add an academic task when you have new work to plan.${hiddenNote}`
      : showMissing
        ? "Your Short Tasks results can use every unfinished task."
        : `Choose a longer time window or add an estimate to a task.${hiddenNote}`;

  return (
    <div className="page-body">
      <div className="container-xl">
        <div className="page-header d-print-none mb-4">
          <div className="row g-2 align-items-center">
            <div className="col">
              <div className="page-pretitle">Plan your study time</div>
              <h1 className="page-title">My Tasks</h1>
              <div className="text-secondary mt-1">
                Personal tasks and group work assigned to you, in one list.
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
            <ul className="nav nav-pills card-header-pills" role="tablist" aria-label="Task ordering">
              <li className="nav-item" role="presentation">
                <button
                  type="button"
                  className={`nav-link${mode === "impact" ? " active" : ""}`}
                  role="tab"
                  aria-selected={mode === "impact"}
                  aria-controls="high-impact-panel"
                  onClick={() => {
                    setMode("impact");
                    setShowMissing(false);
                  }}
                >
                  <IconBolt size={18} />
                  High Impact
                </button>
              </li>
              <li className="nav-item" role="presentation">
                <button
                  type="button"
                  className={`nav-link${mode === "short" ? " active" : ""}`}
                  role="tab"
                  aria-selected={mode === "short"}
                  aria-controls="short-tasks-panel"
                  onClick={() => setMode("short")}
                >
                  <IconClock size={18} />
                  Short Tasks
                </button>
              </li>
            </ul>
          </div>

          {mode === "short" ? (
            <div className="card-body border-bottom" id="short-tasks-panel" role="tabpanel">
              <div className="d-flex flex-column flex-md-row gap-3 align-items-md-center justify-content-between">
                <div>
                  <h2 className="h3 mb-1">How much time do you have?</h2>
                  <div className="text-secondary">Only unfinished tasks with an estimate and a due date are matched.</div>
                </div>
                <div className="btn-group" role="group" aria-label="Available study time">
                  {DURATIONS.map((minutes) => (
                    <button
                      key={minutes}
                      type="button"
                      className={`btn${availableMinutes === minutes ? " btn-primary" : " btn-outline-primary"}`}
                      aria-pressed={availableMinutes === minutes}
                      onClick={() => setAvailableMinutes(minutes)}
                    >
                      {minutes} min
                    </button>
                  ))}
                </div>
              </div>

              {missingEstimates.length > 0 || showMissing ? (
                <div className="alert alert-info mt-3 mb-0 d-flex flex-column flex-sm-row align-items-sm-center gap-2">
                  <IconSparkles size={20} className="flex-shrink-0" />
                  <div className="flex-grow-1">
                    {missingEstimates.length > 0
                      ? `${missingEstimates.length} unfinished ${missingEstimates.length === 1 ? "task has" : "tasks have"} no time estimate and ${missingEstimates.length === 1 ? "is" : "are"} excluded.`
                      : "Every unfinished task now has an estimate."}
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => setShowMissing((shown) => !shown)}
                  >
                    {showMissing ? "Back to matches" : "Review missing estimates"}
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="card-body border-bottom" id="high-impact-panel" role="tabpanel">
              <h2 className="h3 mb-1">Highest priority first</h2>
              <div className="text-secondary">
                Priority is respected as entered; earliest effective deadline breaks ties.
              </div>
            </div>
          )}

          <div className="card-body border-bottom py-2">
            <div className="d-flex flex-column flex-sm-row align-items-sm-center gap-2">
              <label className="form-check form-switch mb-0">
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  checked={showUndated}
                  onChange={(event) => setShowUndated(event.target.checked)}
                />
                <span className="form-check-label">
                  Show tasks without a due date{undatedCount > 0 ? ` (${undatedCount})` : ""}
                </span>
              </label>
              {displayedTasks.length > 0 ? (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary ms-sm-auto"
                  disabled={pendingEstimates.length === 0}
                  onClick={() => estimateTasks(pendingEstimates)}
                >
                  <IconSparkles size={16} className="me-1" />
                  {pendingEstimates.length > 0
                    ? `Estimate missing times (${pendingEstimates.length})`
                    : "All shown tasks have estimates"}
                </button>
              ) : null}
            </div>
          </div>

          <TaskList
            tasks={displayedTasks}
            emptyTitle={emptyTitle}
            emptyMessage={emptyMessage}
            showGradeWeight={mode === "impact"}
          />
        </div>

        <div className="card mt-4">
          <div className="card-header">
            <div>
              <h2 className="card-title d-flex align-items-center gap-2">
                <IconCheck size={19} className="text-green" />
                Completed tasks
                <span className="badge bg-green-lt text-green">{completedTasks.length}</span>
              </h2>
              <div className="text-secondary small">Completed records stay available and can be reopened.</div>
            </div>
            <div className="card-actions">
              <button
                type="button"
                className="btn btn-sm"
                aria-expanded={showCompleted}
                onClick={() => setShowCompleted((shown) => !shown)}
              >
                {showCompleted ? "Hide" : "Show completed"}
              </button>
            </div>
          </div>
          {showCompleted ? (
            <TaskList
              tasks={completedTasks}
              emptyTitle="No completed tasks yet"
              emptyMessage="Tasks you mark done will remain available here."
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
