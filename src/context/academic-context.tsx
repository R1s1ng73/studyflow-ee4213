"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from "react";
import { createDemoData } from "@/lib/demo-data";
import { ACADEMIC_STORAGE_KEY, parseStoredState, serializeState } from "@/lib/storage";
import { STORAGE_VERSION, type AcademicState, type Task, type TaskDraft } from "@/lib/types";
import { academicReducer } from "./academic-reducer";

const EMPTY_STATE: AcademicState = {
  version: STORAGE_VERSION,
  currentMemberId: "member-alex",
  courses: [],
  members: [],
  tasks: [],
  projects: [],
};

interface TaskDialogState {
  isOpen: boolean;
  taskId?: string;
}

interface AcademicContextValue {
  state: AcademicState;
  isHydrated: boolean;
  recoveryNotice: string;
  taskDialog: TaskDialogState;
  toastMessage: string;
  openTask: (taskId?: string) => void;
  closeTask: () => void;
  addTask: (draft: TaskDraft) => Task;
  updateTask: (id: string, changes: Partial<Task>, confirmation?: string) => void;
  deleteTask: (id: string) => void;
  resetDemoData: () => void;
  showToast: (message: string) => void;
  clearToast: () => void;
}

const AcademicContext = createContext<AcademicContextValue | null>(null);

function uniqueId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `task-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function AcademicProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(academicReducer, EMPTY_STATE);
  const [isHydrated, setIsHydrated] = useState(false);
  const [recoveryNotice, setRecoveryNotice] = useState("");
  const [taskDialog, setTaskDialog] = useState<TaskDialogState>({ isOpen: false });
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      const raw = window.localStorage.getItem(ACADEMIC_STORAGE_KEY);
      const stored = parseStoredState(raw);
      if (raw && !stored) {
        setRecoveryNotice("Saved dashboard data could not be read, so fresh demonstration data was restored.");
      }
      dispatch({ type: "state/load", state: stored ?? createDemoData() });
      setIsHydrated(true);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    window.localStorage.setItem(ACADEMIC_STORAGE_KEY, serializeState(state));
  }, [isHydrated, state]);

  useEffect(() => {
    if (!toastMessage) return;
    const timeout = window.setTimeout(() => setToastMessage(""), 4200);
    return () => window.clearTimeout(timeout);
  }, [toastMessage]);

  const showToast = useCallback((message: string) => setToastMessage(message), []);
  const clearToast = useCallback(() => setToastMessage(""), []);
  const openTask = useCallback((taskId?: string) => setTaskDialog({ isOpen: true, taskId }), []);
  const closeTask = useCallback(() => setTaskDialog({ isOpen: false }), []);

  const addTask = useCallback((draft: TaskDraft) => {
    const changedAt = new Date().toISOString();
    const task: Task = {
      ...draft,
      id: uniqueId(),
      createdAt: changedAt,
      updatedAt: changedAt,
      ...(draft.status !== "not-started" ? { statusUpdatedAt: changedAt } : {}),
    };
    dispatch({ type: "task/add", task });
    setToastMessage(`${task.title} was added to ${task.courseId.toUpperCase()}.`);
    return task;
  }, []);

  const updateTask = useCallback((id: string, changes: Partial<Task>, confirmation?: string) => {
    dispatch({ type: "task/update", id, changes, changedAt: new Date().toISOString() });
    setToastMessage(confirmation ?? "Task changes saved.");
  }, []);

  const deleteTask = useCallback((id: string) => {
    dispatch({ type: "task/delete", id });
    setToastMessage("Task deleted.");
    setTaskDialog({ isOpen: false });
  }, []);

  const resetDemoData = useCallback(() => {
    dispatch({ type: "state/reset", state: createDemoData() });
    setRecoveryNotice("");
    setToastMessage("Demonstration data was reset.");
  }, []);

  const value = useMemo<AcademicContextValue>(
    () => ({
      state,
      isHydrated,
      recoveryNotice,
      taskDialog,
      toastMessage,
      openTask,
      closeTask,
      addTask,
      updateTask,
      deleteTask,
      resetDemoData,
      showToast,
      clearToast,
    }),
    [
      state,
      isHydrated,
      recoveryNotice,
      taskDialog,
      toastMessage,
      openTask,
      closeTask,
      addTask,
      updateTask,
      deleteTask,
      resetDemoData,
      showToast,
      clearToast,
    ],
  );

  return <AcademicContext.Provider value={value}>{children}</AcademicContext.Provider>;
}

export function useAcademic(): AcademicContextValue {
  const context = useContext(AcademicContext);
  if (!context) throw new Error("useAcademic must be used inside AcademicProvider");
  return context;
}
