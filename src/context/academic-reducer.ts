import type { AcademicState, Task } from "@/lib/types";

export type AcademicAction =
  | { type: "state/load"; state: AcademicState }
  | { type: "task/add"; task: Task }
  | { type: "task/update"; id: string; changes: Partial<Task>; changedAt: string }
  | { type: "task/delete"; id: string }
  | { type: "state/reset"; state: AcademicState };

export function academicReducer(state: AcademicState, action: AcademicAction): AcademicState {
  switch (action.type) {
    case "state/load":
    case "state/reset":
      return action.state;
    case "task/add":
      return { ...state, tasks: [...state.tasks, action.task] };
    case "task/update":
      return {
        ...state,
        tasks: state.tasks.map((task) => {
          if (task.id !== action.id) return task;
          const statusChanged = action.changes.status !== undefined && action.changes.status !== task.status;
          return {
            ...task,
            ...action.changes,
            updatedAt: action.changedAt,
            ...(statusChanged ? { statusUpdatedAt: action.changedAt } : {}),
          };
        }),
      };
    case "task/delete":
      return {
        ...state,
        tasks: state.tasks.filter((task) => task.id !== action.id),
        projects: state.projects.map((project) => ({
          ...project,
          taskIds: project.taskIds.filter((id) => id !== action.id),
        })),
      };
  }
}
