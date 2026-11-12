"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { format } from "date-fns";
import {
  IconChevronDown,
  IconChevronUp,
  IconDeviceFloppy,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { useAcademic } from "@/context/academic-context";
import { parseDateOnly } from "@/lib/date";
import type { Task } from "@/lib/types";
import {
  validateTaskForm,
  type TaskFormErrors,
  type TaskFormValues,
} from "@/lib/validation";
import { buildTaskDraft, taskToFormValues } from "./task-form";

const ASSESSMENT_TYPES = [
  ["assignment", "Assignment"],
  ["quiz", "Quiz"],
  ["test", "Test"],
  ["exam", "Exam"],
  ["other", "Other"],
] as const;

const DATE_MEANINGS = [
  ["submission-deadline", "Submission deadline"],
  ["scheduled-start", "Scheduled start"],
  ["date-to-remember", "Date to remember"],
] as const;

function errorId(field: keyof TaskFormValues, prefix: string): string {
  return `${prefix}-${field}-error`;
}

function InvalidFeedback({ error, id }: { error?: string; id: string }) {
  if (!error) return null;
  return (
    <div className="invalid-feedback" id={id}>
      {error}
    </div>
  );
}

export function TaskModal() {
  const { state, taskDialog } = useAcademic();
  if (!taskDialog.isOpen) return null;
  const existing = taskDialog.taskId
    ? state.tasks.find((task) => task.id === taskDialog.taskId)
    : undefined;
  return <TaskModalContent key={taskDialog.taskId ?? "new-task"} existing={existing} />;
}

function TaskModalContent({ existing }: { existing?: Task }) {
  const {
    state,
    closeTask,
    addTask,
    updateTask,
    deleteTask,
    showToast,
  } = useAcademic();
  const [values, setValues] = useState<TaskFormValues>(() => taskToFormValues(existing));
  const [errors, setErrors] = useState<TaskFormErrors>({});
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const editsInternalDeadline = Boolean(existing?.projectId || existing?.internalDueDate);
  const titleRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const idPrefix = useId();

  useEffect(() => {
    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const frame = window.requestAnimationFrame(() => titleRef.current?.focus());
    return () => {
      window.cancelAnimationFrame(frame);
      openerRef.current?.focus();
    };
  }, []);

  useEffect(() => {
    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      if (confirmingDelete) setConfirmingDelete(false);
      else closeTask();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [closeTask, confirmingDelete]);

  const updateValue = <Field extends keyof TaskFormValues>(
    field: Field,
    value: TaskFormValues[Field],
  ) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const confirmation = (
    task: Pick<Task, "title" | "courseId" | "date" | "internalDueDate">,
  ) => {
    const course = state.courses.find((item) => item.id === task.courseId);
    const courseLabel = course?.code ?? task.courseId.toUpperCase();
    const effectiveDate = task.internalDueDate ?? task.date;
    return `${task.title} saved for ${courseLabel} on ${format(parseDateOnly(effectiveDate), "d MMM yyyy")}.`;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationErrors = validateTaskForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      const firstField = Object.keys(validationErrors)[0] as keyof TaskFormValues | undefined;
      if (firstField) {
        const firstId = firstField === "title" ? `${idPrefix}-title-input` : `${idPrefix}-${firstField}`;
        document.getElementById(firstId)?.focus();
      }
      return;
    }

    const draft = buildTaskDraft(values, existing);
    if (existing) {
      updateTask(existing.id, draft, confirmation(draft));
    } else {
      addTask(draft);
      showToast(confirmation(draft));
    }
    closeTask();
  };

  const handleDialogKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab") return;
    const focusable = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      ) ?? [],
    ).filter((element) => element.offsetParent !== null);
    if (focusable.length === 0) return;
    const first = focusable[0]!;
    const last = focusable.at(-1)!;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const inputClass = (field: keyof TaskFormValues) =>
    `form-control${errors[field] ? " is-invalid" : ""}`;
  const selectClass = (field: keyof TaskFormValues) =>
    `form-select${errors[field] ? " is-invalid" : ""}`;

  return (
    <div
      className="modal modal-blur show d-block"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${idPrefix}-title`}
      onKeyDown={handleDialogKeyDown}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeTask();
      }}
    >
      <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
        <div className="modal-content" ref={dialogRef}>
          <div className="modal-header">
            <div>
              <h2 className="modal-title" id={`${idPrefix}-title`}>
                {existing ? "Edit academic task" : "Add academic task"}
              </h2>
              <div className="text-secondary small mt-1">
                Required fields are marked with an asterisk.
              </div>
            </div>
            <button type="button" className="btn-close" aria-label="Close" onClick={closeTask} />
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="modal-body">
              {existing?.projectId ? (
                <div className="alert alert-info" role="note">
                  This task belongs to a group project. Project assignment details remain unchanged.
                </div>
              ) : null}

              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label required" htmlFor={`${idPrefix}-title-input`}>
                    Task title
                  </label>
                  <input
                    ref={titleRef}
                    id={`${idPrefix}-title-input`}
                    className={inputClass("title")}
                    value={values.title}
                    onChange={(event) => updateValue("title", event.target.value)}
                    aria-describedby={errors.title ? errorId("title", idPrefix) : undefined}
                    aria-invalid={Boolean(errors.title)}
                  />
                  <InvalidFeedback error={errors.title} id={errorId("title", idPrefix)} />
                </div>

                <div className="col-md-6">
                  <label className="form-label required" htmlFor={`${idPrefix}-courseId`}>
                    Course
                  </label>
                  <select
                    id={`${idPrefix}-courseId`}
                    className={selectClass("courseId")}
                    value={values.courseId}
                    onChange={(event) => updateValue("courseId", event.target.value)}
                    aria-describedby={errors.courseId ? errorId("courseId", idPrefix) : undefined}
                    aria-invalid={Boolean(errors.courseId)}
                  >
                    <option value="">Select a course</option>
                    {state.courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.code} — {course.name}
                      </option>
                    ))}
                  </select>
                  <InvalidFeedback error={errors.courseId} id={errorId("courseId", idPrefix)} />
                </div>

                <div className="col-md-6">
                  <label className="form-label required" htmlFor={`${idPrefix}-assessmentType`}>
                    Assessment type
                  </label>
                  <select
                    id={`${idPrefix}-assessmentType`}
                    className={selectClass("assessmentType")}
                    value={values.assessmentType}
                    onChange={(event) =>
                      updateValue("assessmentType", event.target.value as TaskFormValues["assessmentType"])
                    }
                    aria-describedby={errors.assessmentType ? errorId("assessmentType", idPrefix) : undefined}
                    aria-invalid={Boolean(errors.assessmentType)}
                  >
                    <option value="">Select a type</option>
                    {ASSESSMENT_TYPES.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <InvalidFeedback error={errors.assessmentType} id={errorId("assessmentType", idPrefix)} />
                </div>

                <div className="col-md-6">
                  <label className="form-label required" htmlFor={`${idPrefix}-date`}>
                    {editsInternalDeadline ? "Internal deadline" : "Date"}
                  </label>
                  <input
                    id={`${idPrefix}-date`}
                    type="date"
                    className={inputClass("date")}
                    value={values.date}
                    onChange={(event) => updateValue("date", event.target.value)}
                    aria-describedby={errors.date ? errorId("date", idPrefix) : undefined}
                    aria-invalid={Boolean(errors.date)}
                  />
                  <InvalidFeedback error={errors.date} id={errorId("date", idPrefix)} />
                </div>

                {!editsInternalDeadline ? (
                  <div className="col-md-6">
                    <label className="form-label required" htmlFor={`${idPrefix}-dateMeaning`}>
                      Date meaning
                    </label>
                    <select
                      id={`${idPrefix}-dateMeaning`}
                      className={selectClass("dateMeaning")}
                      value={values.dateMeaning}
                      onChange={(event) =>
                        updateValue("dateMeaning", event.target.value as TaskFormValues["dateMeaning"])
                      }
                      aria-describedby={errors.dateMeaning ? errorId("dateMeaning", idPrefix) : undefined}
                      aria-invalid={Boolean(errors.dateMeaning)}
                    >
                      <option value="">Select date meaning</option>
                      {DATE_MEANINGS.map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <InvalidFeedback error={errors.dateMeaning} id={errorId("dateMeaning", idPrefix)} />
                  </div>
                ) : null}
              </div>

              <div className="border-top mt-4 pt-3">
                <button
                  type="button"
                  className="btn btn-ghost-primary px-0"
                  aria-expanded={detailsOpen}
                  aria-controls={`${idPrefix}-details`}
                  onClick={() => setDetailsOpen((open) => !open)}
                >
                  {detailsOpen ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
                  {detailsOpen ? "Hide details" : "Add details"}
                </button>

                {detailsOpen ? (
                  <div className="row g-3 mt-0" id={`${idPrefix}-details`}>
                    <div className="col-md-4">
                      <label className="form-label" htmlFor={`${idPrefix}-time`}>
                        Time
                      </label>
                      <input
                        id={`${idPrefix}-time`}
                        type="time"
                        className={inputClass("time")}
                        value={values.time}
                        onChange={(event) => updateValue("time", event.target.value)}
                        aria-describedby={errors.time ? errorId("time", idPrefix) : undefined}
                        aria-invalid={Boolean(errors.time)}
                      />
                      <InvalidFeedback error={errors.time} id={errorId("time", idPrefix)} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label" htmlFor={`${idPrefix}-priority`}>
                        Priority
                      </label>
                      <select
                        id={`${idPrefix}-priority`}
                        className="form-select"
                        value={values.priority}
                        onChange={(event) =>
                          updateValue("priority", event.target.value as TaskFormValues["priority"])
                        }
                      >
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label" htmlFor={`${idPrefix}-estimatedMinutes`}>
                        Estimated duration (minutes)
                      </label>
                      <input
                        id={`${idPrefix}-estimatedMinutes`}
                        type="number"
                        min="1"
                        max="1440"
                        className={inputClass("estimatedMinutes")}
                        value={values.estimatedMinutes}
                        onChange={(event) => updateValue("estimatedMinutes", event.target.value)}
                        aria-describedby={
                          errors.estimatedMinutes ? errorId("estimatedMinutes", idPrefix) : undefined
                        }
                        aria-invalid={Boolean(errors.estimatedMinutes)}
                      />
                      <InvalidFeedback
                        error={errors.estimatedMinutes}
                        id={errorId("estimatedMinutes", idPrefix)}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label" htmlFor={`${idPrefix}-gradeWeight`}>
                        Grade weight (%)
                      </label>
                      <input
                        id={`${idPrefix}-gradeWeight`}
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        className={inputClass("gradeWeight")}
                        value={values.gradeWeight}
                        onChange={(event) => updateValue("gradeWeight", event.target.value)}
                        aria-describedby={errors.gradeWeight ? errorId("gradeWeight", idPrefix) : undefined}
                        aria-invalid={Boolean(errors.gradeWeight)}
                      />
                      <InvalidFeedback error={errors.gradeWeight} id={errorId("gradeWeight", idPrefix)} />
                    </div>
                    <div className="col-md-8">
                      <label className="form-label" htmlFor={`${idPrefix}-topicsCovered`}>
                        Topics covered
                      </label>
                      <input
                        id={`${idPrefix}-topicsCovered`}
                        className="form-control"
                        value={values.topicsCovered}
                        onChange={(event) => updateValue("topicsCovered", event.target.value)}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label" htmlFor={`${idPrefix}-notes`}>
                        Notes
                      </label>
                      <textarea
                        id={`${idPrefix}-notes`}
                        className="form-control"
                        rows={3}
                        value={values.notes}
                        onChange={(event) => updateValue("notes", event.target.value)}
                      />
                    </div>
                  </div>
                ) : null}
              </div>

              {confirmingDelete ? (
                <div className="alert alert-danger mt-4 mb-0" role="alert">
                  <div className="fw-semibold">Delete “{existing?.title}”?</div>
                  <div className="small mb-3">This removes the task from every dashboard view.</div>
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => existing && deleteTask(existing.id)}
                    >
                      <IconTrash size={18} />
                      Delete task
                    </button>
                    <button type="button" className="btn" onClick={() => setConfirmingDelete(false)}>
                      Keep task
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="modal-footer">
              {existing ? (
                <button
                  type="button"
                  className="btn btn-ghost-danger me-auto"
                  onClick={() => setConfirmingDelete(true)}
                  disabled={confirmingDelete}
                >
                  <IconTrash size={18} />
                  Delete
                </button>
              ) : null}
              <button type="button" className="btn" onClick={closeTask}>
                <IconX size={18} />
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                <IconDeviceFloppy size={18} />
                Save task
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
