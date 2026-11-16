import type { AcademicState, Task } from "@/lib/types";
import { EXTERNAL_COURSE, sameImportSlot } from "@/lib/task-import";

export type AcademicAction =
  | { type: "state/load"; state: AcademicState }
  | { type: "canvas/sync"; state: AcademicState }
  | { type: "task/add"; task: Task }
  | { type: "task/import"; tasks: Task[] }
  | { type: "task/update"; id: string; changes: Partial<Task>; changedAt: string }
  | { type: "task/delete"; id: string }
  | { type: "state/reset"; state: AcademicState };

export function academicReducer(state: AcademicState, action: AcademicAction): AcademicState {
  switch (action.type) {
    case "state/load":
    case "state/reset":
      return action.state;
    case "canvas/sync": {
      const incoming = action.state;
      if (state.currentMemberId && state.currentMemberId !== incoming.currentMemberId) return incoming;
      const previousTasks = new Map(state.tasks.map((task) => [task.id, task]));
      const localTasks = state.tasks.filter((task) => !task.canvasUrl);
      const localProjects = state.projects.filter((project) => !project.canvasUrl);
      const referencedCourses = new Set([...localTasks, ...localProjects].map((item) => item.courseId));
      const incomingCourses = new Set(incoming.courses.map((course) => course.id));
      return {
        ...incoming,
        courses: [
          ...incoming.courses,
          ...state.courses.filter((course) => referencedCourses.has(course.id) && !incomingCourses.has(course.id)),
        ],
        members: [...incoming.members, ...state.members.filter((member) => !member.id.startsWith("canvas-user-"))],
        projects: [...incoming.projects, ...localProjects],
        tasks: [...incoming.tasks.map((task) => {
          const previous = previousTasks.get(task.id);
          if (!previous) return task;
          return {
            ...task,
            estimatedMinutes: previous.estimatedMinutes,
            notes: previous.notes,
            topicsCovered: previous.topicsCovered,
            gradeWeight: previous.gradeWeight,
            canvasPriorityOverride: previous.canvasPriorityOverride,
            priority: previous.canvasPriorityOverride ? previous.priority : task.priority,
          };
        }), ...localTasks],
      };
    }
    case "task/add":
      return { ...state, tasks: [...state.tasks, action.task] };
    case "task/import": {
      const tasks = [...state.tasks];
      const knownCourses = new Set(state.courses.map((course) => course.id));
      for (const task of action.tasks) {
        if ((knownCourses.has(task.courseId) || task.courseId === EXTERNAL_COURSE.id) &&
            !tasks.some((existing) => sameImportSlot(existing, task))) tasks.push(task);
      }
      if (tasks.length === state.tasks.length) return state;
      const needsPersonal = tasks.some((task) => task.courseId === EXTERNAL_COURSE.id) &&
        !knownCourses.has(EXTERNAL_COURSE.id);
      return { ...state, tasks, courses: needsPersonal ? [...state.courses, EXTERNAL_COURSE] : state.courses };
    }
    case "task/update":
      return {
        ...state,
        tasks: state.tasks.map((task) => {
          if (task.id !== action.id) return task;
          if (task.canvasUrl) {
            const priority = action.changes.priority ?? task.priority;
            return {
              ...task,
              priority,
              estimatedMinutes: "estimatedMinutes" in action.changes ? action.changes.estimatedMinutes : task.estimatedMinutes,
              canvasPriorityOverride: task.canvasPriorityOverride || priority !== task.priority,
              notes: "notes" in action.changes ? action.changes.notes : task.notes,
              topicsCovered: "topicsCovered" in action.changes ? action.changes.topicsCovered : task.topicsCovered,
              gradeWeight: "gradeWeight" in action.changes ? action.changes.gradeWeight : task.gradeWeight,
            };
          }
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
      if (state.tasks.some((task) => task.id === action.id && task.canvasUrl)) return state;
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
