"use client";

import { useRef, useState, type FormEvent } from "react";
import { IconDeviceFloppy, IconInfoCircle, IconTrash, IconX } from "@tabler/icons-react";
import { useModalFocus } from "@/hooks/use-modal-focus";
import type { Task, TeamMember } from "@/lib/types";

export interface InternalSubtaskValues {
  title: string;
  internalDueDate: string;
  assignedTo?: string;
  notes?: string;
}

interface InternalSubtaskDialogProps {
  projectName: string;
  members: TeamMember[];
  subtask?: Task;
  creatorName?: string;
  onClose: () => void;
  onSave: (values: InternalSubtaskValues) => void;
  onDelete?: () => void;
}

interface FormErrors {
  title?: string;
  internalDueDate?: string;
}

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year!, month! - 1, day);
  return date.getFullYear() === year && date.getMonth() === month! - 1 && date.getDate() === day;
}

export function InternalSubtaskDialog({
  projectName,
  members,
  subtask,
  creatorName,
  onClose,
  onSave,
  onDelete,
}: InternalSubtaskDialogProps) {
  const editing = Boolean(subtask);
  const [title, setTitle] = useState(subtask?.title ?? "");
  const [internalDueDate, setInternalDueDate] = useState(
    subtask?.internalDueDate ?? (subtask && !subtask.canvasUrl ? subtask.date : ""),
  );
  const [assignedTo, setAssignedTo] = useState(subtask?.assignedTo ?? "");
  const [notes, setNotes] = useState(subtask?.notes ?? "");
  const [errors, setErrors] = useState<FormErrors>({});
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  useModalFocus({ containerRef: dialogRef, initialFocusRef: titleRef, onEscape: onClose });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: FormErrors = {};
    if (!title.trim()) nextErrors.title = "Enter a subtask title.";
    if (!isValidDate(internalDueDate)) nextErrors.internalDueDate = "Choose a valid internal deadline.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      if (nextErrors.title) titleRef.current?.focus();
      return;
    }

    onSave({
      title: title.trim(),
      internalDueDate,
      assignedTo: assignedTo || undefined,
      notes: notes.trim() || undefined,
    });
  }

  return (
    <div
      className="modal modal-blur show d-block"
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="internal-subtask-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal-dialog modal-dialog-centered" role="document">
        <form className="modal-content" onSubmit={handleSubmit} noValidate>
          <div className="modal-header">
            <div>
              <h2 className="modal-title" id="internal-subtask-title">
                {editing ? "Edit internal subtask" : "Add internal subtask"}
              </h2>
              <div className="text-secondary mt-1">{projectName}</div>
            </div>
            <button className="btn btn-icon btn-ghost-secondary" type="button" aria-label="Close" onClick={onClose}>
              <IconX className="icon" aria-hidden="true" />
            </button>
          </div>

          <div className="modal-body">
            <div className="alert alert-info" role="note">
              <IconInfoCircle className="icon alert-icon" aria-hidden="true" />
              <div>
                Internal subtasks and their deadlines stay in this browser. They are never sent to Canvas or
                your teammates.
              </div>
            </div>

            {creatorName ? (
              <p className="small text-secondary mb-3">
                Added by <span className="fw-semibold text-body">{creatorName}</span>
              </p>
            ) : null}

            <div className="mb-3">
              <label className="form-label required" htmlFor="internal-subtask-name">
                Subtask title
              </label>
              <input
                ref={titleRef}
                className={`form-control${errors.title ? " is-invalid" : ""}`}
                id="internal-subtask-name"
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value);
                  setErrors((current) => ({ ...current, title: undefined }));
                }}
                aria-invalid={Boolean(errors.title)}
                aria-describedby={errors.title ? "internal-subtask-name-error" : undefined}
                placeholder="e.g. Draft the data model section"
              />
              {errors.title ? (
                <div className="invalid-feedback" id="internal-subtask-name-error">
                  {errors.title}
                </div>
              ) : null}
            </div>

            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label required" htmlFor="internal-subtask-deadline">
                  Internal deadline
                </label>
                <input
                  type="date"
                  className={`form-control${errors.internalDueDate ? " is-invalid" : ""}`}
                  id="internal-subtask-deadline"
                  value={internalDueDate}
                  onChange={(event) => {
                    setInternalDueDate(event.target.value);
                    setErrors((current) => ({ ...current, internalDueDate: undefined }));
                  }}
                  aria-invalid={Boolean(errors.internalDueDate)}
                  aria-describedby={errors.internalDueDate ? "internal-subtask-deadline-error" : undefined}
                />
                {errors.internalDueDate ? (
                  <div className="invalid-feedback" id="internal-subtask-deadline-error">
                    {errors.internalDueDate}
                  </div>
                ) : null}
              </div>

              <div className="col-md-6">
                <label className="form-label" htmlFor="internal-subtask-owner">
                  Assigned teammate
                </label>
                <select
                  className="form-select"
                  id="internal-subtask-owner"
                  value={assignedTo}
                  onChange={(event) => setAssignedTo(event.target.value)}
                >
                  <option value="">Unassigned</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.displayName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-12">
                <label className="form-label" htmlFor="internal-subtask-notes">
                  Notes (optional)
                </label>
                <textarea
                  className="form-control"
                  id="internal-subtask-notes"
                  rows={3}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="What needs to happen before this deadline?"
                />
              </div>
            </div>

            {confirmingDelete && onDelete ? (
              <div className="alert alert-danger mt-4 mb-0" role="alert">
                <div className="fw-semibold">Delete “{subtask?.title}”?</div>
                <div className="small mb-3">This removes the internal subtask from this project and calendar.</div>
                <div className="d-flex gap-2">
                  <button type="button" className="btn btn-danger" onClick={onDelete}>
                    <IconTrash className="icon me-1" aria-hidden="true" />
                    Delete subtask
                  </button>
                  <button type="button" className="btn" onClick={() => setConfirmingDelete(false)}>
                    Keep subtask
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="modal-footer">
            {editing && onDelete ? (
              <button
                type="button"
                className="btn btn-ghost-danger me-auto"
                onClick={() => setConfirmingDelete(true)}
                disabled={confirmingDelete}
              >
                <IconTrash className="icon me-1" aria-hidden="true" />
                Delete
              </button>
            ) : null}
            <button className="btn btn-link link-secondary" type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn-primary" type="submit">
              <IconDeviceFloppy className="icon me-2" aria-hidden="true" />
              {editing ? "Save subtask" : "Add subtask"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
