"use client";

import { useRef, useState, type FormEvent } from "react";
import { IconAlertTriangle, IconDeviceFloppy, IconX } from "@tabler/icons-react";
import { useModalFocus } from "@/hooks/use-modal-focus";
import type { Task, TaskStatus } from "@/lib/types";

interface GroupTaskDialogProps {
  task: Task;
  onClose: () => void;
  onSave: (status: TaskStatus, blockerReason?: string) => void;
}

const STATUS_OPTIONS: Array<{ value: TaskStatus; label: string }> = [
  { value: "not-started", label: "Not started" },
  { value: "in-progress", label: "In progress" },
  { value: "blocked", label: "Blocked" },
  { value: "done", label: "Done" },
];

export function GroupTaskDialog({ task, onClose, onSave }: GroupTaskDialogProps) {
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [blockerReason, setBlockerReason] = useState(task.blockerReason ?? "");
  const dialogRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLSelectElement>(null);
  useModalFocus({ containerRef: dialogRef, initialFocusRef: statusRef, onEscape: onClose });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const reason = status === "blocked" ? blockerReason.trim() || undefined : undefined;
    onSave(status, reason);
  }

  return (
    <div
      className="modal modal-blur show d-block"
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="group-task-dialog-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal-dialog modal-dialog-centered" role="document">
        <form className="modal-content" onSubmit={handleSubmit}>
          <div className="modal-header">
            <div>
              <h2 className="modal-title" id="group-task-dialog-title">
                Update reported task status
              </h2>
              <div className="text-secondary mt-1">{task.title}</div>
            </div>
            <button
              className="btn btn-icon btn-ghost-secondary"
              type="button"
              aria-label="Close"
              onClick={onClose}
            >
              <IconX className="icon" aria-hidden="true" />
            </button>
          </div>
          <div className="modal-body">
            <div className="alert alert-info" role="note">
              <IconAlertTriangle className="icon alert-icon" aria-hidden="true" />
              <div>
                This saves a reported update in this browser. It does not notify or synchronise with
                teammates.
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label" htmlFor="reported-status">
                Reported status
              </label>
              <select
                ref={statusRef}
                className="form-select"
                id="reported-status"
                value={status}
                onChange={(event) => setStatus(event.target.value as TaskStatus)}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {status === "blocked" ? (
              <div>
                <label className="form-label" htmlFor="blocker-reason">
                  Blocker reason (optional)
                </label>
                <textarea
                  className="form-control"
                  id="blocker-reason"
                  rows={3}
                  value={blockerReason}
                  onChange={(event) => setBlockerReason(event.target.value)}
                  placeholder="What is preventing progress?"
                />
              </div>
            ) : null}
          </div>
          <div className="modal-footer">
            <button className="btn btn-link link-secondary" type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn-primary" type="submit">
              <IconDeviceFloppy className="icon me-2" aria-hidden="true" />
              Save reported status
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
