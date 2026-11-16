"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ACADEMIC_STORAGE_KEY, isAcademicState, parseStoredState, serializeState } from "@/lib/storage";
import { estimateTaskMinutes } from "@/lib/estimate";
import { STORAGE_VERSION, type AcademicState, type Task, type TaskDraft } from "@/lib/types";
import { academicReducer } from "./academic-reducer";

const EMPTY_STATE: AcademicState = {
  version: STORAGE_VERSION,
  currentMemberId: "",
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
  importTasks: (drafts: TaskDraft[]) => void;
  updateTask: (id: string, changes: Partial<Task>, confirmation?: string) => void;
  estimateTasks: (tasks: Task[]) => void;
  deleteTask: (id: string) => void;
  canvasSync: { busy: boolean; message: string; syncedAt?: string };
  syncCanvas: () => Promise<void>;
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
  const [canvasSync, setCanvasSync] = useState<AcademicContextValue["canvasSync"]>({ busy: false, message: "" });
  const syncInProgress = useRef(false);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      const raw = window.localStorage.getItem(ACADEMIC_STORAGE_KEY);
      const stored = parseStoredState(raw);
      if (raw && !stored) setRecoveryNotice("Saved dashboard data could not be read.");
      dispatch({ type: "state/load", state: stored ?? EMPTY_STATE });
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

  const syncCanvas = useCallback(async () => {
    if (syncInProgress.current) return;
    syncInProgress.current = true;
    setCanvasSync((current) => ({ ...current, busy: true, message: "" }));
    try {
      const response = await fetch("/api/canvas/sync", { method: "POST", cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(typeof payload.message === "string" ? payload.message : "Canvas sync failed.");
      if (!isAcademicState(payload.state)) throw new Error("Canvas returned an invalid workspace.");
      dispatch({ type: "canvas/sync", state: payload.state });
      setRecoveryNotice("");
      setCanvasSync({ busy: false, message: "", syncedAt: payload.syncedAt });
    } catch (error) {
      const message = error instanceof Error && !(error instanceof TypeError)
        ? error.message
        : "Could not reach the local Canvas sync service.";
      setCanvasSync((current) => ({ ...current, busy: false, message }));
    } finally {
      syncInProgress.current = false;
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    const initialSync = window.setTimeout(() => { void syncCanvas(); }, 0);
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void syncCanvas();
    }, 5 * 60_000);
    return () => {
      window.clearTimeout(initialSync);
      window.clearInterval(timer);
    };
  }, [isHydrated, syncCanvas]);

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

  const importTasks = useCallback((drafts: TaskDraft[]) => {
    const timestamp = new Date().toISOString();
    dispatch({ type: "task/import", tasks: drafts.map((draft) => ({
      ...draft, id: uniqueId(), createdAt: timestamp, updatedAt: timestamp,
    })) });
  }, []);

  const updateTask = useCallback((id: string, changes: Partial<Task>, confirmation?: string) => {
    dispatch({ type: "task/update", id, changes, changedAt: new Date().toISOString() });
    setToastMessage(confirmation ?? "Task changes saved.");
  }, []);

  const estimateTasks = useCallback((tasks: Task[]) => {
    const entries = tasks.map((task) => ({ id: task.id, minutes: estimateTaskMinutes(task) }));
    if (entries.length === 0) return;
    dispatch({ type: "tasks/estimate", entries, changedAt: new Date().toISOString() });
    setToastMessage(
      `Filled in ${entries.length} ${entries.length === 1 ? "estimate" : "estimates"}. Adjust any value that needs more time.`,
    );
  }, []);

  const deleteTask = useCallback((id: string) => {
    dispatch({ type: "task/delete", id });
    setToastMessage("Task deleted.");
    setTaskDialog({ isOpen: false });
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
      importTasks,
      updateTask,
      estimateTasks,
      deleteTask,
      canvasSync,
      syncCanvas,
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
      importTasks,
      updateTask,
      estimateTasks,
      deleteTask,
      canvasSync,
      syncCanvas,
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
