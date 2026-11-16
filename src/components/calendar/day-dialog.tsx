"use client";

import { useId, useRef } from "react";
import { format } from "date-fns";
import { IconCalendarDue, IconClock, IconEdit, IconX } from "@tabler/icons-react";
import { useModalFocus } from "@/hooks/use-modal-focus";
import type { CalendarEvent, Course, CourseColor } from "@/lib/types";
import { getCalendarCategoryLabel } from "./calendar-helpers";

interface DayDialogProps {
  date: Date;
  events: CalendarEvent[];
  courses: Course[];
  focusEventId?: string;
  onClose: () => void;
  onTaskClick: (taskId: string) => void;
}

const COURSE_BADGE_CLASSES: Record<CourseColor, string> = {
  blue: "bg-blue-lt text-blue",
  azure: "bg-azure-lt text-azure",
  teal: "bg-teal-lt text-teal",
  purple: "bg-purple-lt text-purple",
  orange: "bg-orange-lt text-orange",
  pink: "bg-pink-lt text-pink",
};

function dateMeaningLabel(event: CalendarEvent): string {
  switch (event.dateMeaning) {
    case "submission-deadline":
      return "Submission deadline";
    case "scheduled-start":
      return "Scheduled start";
    case "date-to-remember":
      return "Date to remember";
    case "internal-deadline":
      return "Internal team deadline";
    case "official-project-deadline":
      return "Official project deadline";
  }
}

export function DayDialog({
  date,
  events,
  courses,
  focusEventId,
  onClose,
  onTaskClick,
}: DayDialogProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dateLabel = format(date, "EEEE, MMMM d");
  useModalFocus({ containerRef: dialogRef, initialFocusRef: closeButtonRef, onEscape: onClose });

  return (
    <div
      aria-labelledby={titleId}
      aria-modal="true"
      className="modal modal-blur show d-block"
      ref={dialogRef}
      role="dialog"
      style={{ backgroundColor: "rgba(15, 23, 42, 0.42)" }}
    >
      <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable" role="document">
        <div className="modal-content shadow-lg">
          <div className="modal-header">
            <div>
              <div className="text-secondary text-uppercase fw-semibold small mb-1">Daily schedule</div>
              <h2 className="modal-title" id={titleId}>
                {dateLabel} schedule
              </h2>
            </div>
            <button
              aria-label="Close schedule"
              className="btn-close"
              onClick={onClose}
              ref={closeButtonRef}
              type="button"
            >
              <IconX aria-hidden="true" size={18} />
            </button>
          </div>

          <div className="modal-body">
            {events.length === 0 ? (
              <div className="empty py-5">
                <div className="empty-icon">
                  <IconCalendarDue aria-hidden="true" size={40} />
                </div>
                <p className="empty-title">Nothing scheduled</p>
                <p className="empty-subtitle text-secondary mb-0">
                  There are no tasks or project deadlines on this date.
                </p>
              </div>
            ) : (
              <div className="list-group list-group-flush border rounded-3 overflow-hidden">
                {events.map((event) => {
                  const course = courses.find((item) => item.id === event.courseId);
                  const courseClass = course
                    ? COURSE_BADGE_CLASSES[course.color]
                    : "bg-secondary-lt text-secondary";

                  return (
                    <div
                      className={`list-group-item p-3 ${
                        event.id === focusEventId ? "border-start border-3 border-primary" : ""
                      }`}
                      key={event.id}
                    >
                      <div className="d-flex align-items-start justify-content-between gap-3">
                        <div className="min-w-0">
                          <div className="d-flex align-items-center flex-wrap gap-2 mb-2">
                            <span className={`badge ${courseClass}`}>{course?.code ?? "Course"}</span>
                            <span className="badge bg-secondary-lt text-secondary">
                              {getCalendarCategoryLabel(event.category)}
                            </span>
                            {event.completed ? (
                              <span className="badge bg-green-lt text-green">Completed</span>
                            ) : null}
                          </div>
                          <h3
                            className={`h4 mb-1 ${event.completed ? "text-decoration-line-through text-secondary" : ""}`}
                          >
                            {event.title}
                          </h3>
                          <div className="text-secondary small d-flex align-items-center flex-wrap gap-2">
                            <span>{dateMeaningLabel(event)}</span>
                            {event.time ? (
                              <span className="d-inline-flex align-items-center gap-1">
                                <IconClock aria-hidden="true" size={14} />
                                {event.time}
                              </span>
                            ) : null}
                          </div>
                        </div>

                        {event.sourceType === "task" ? (
                          <button
                            className="btn btn-sm btn-outline-primary flex-shrink-0"
                            onClick={() => onTaskClick(event.sourceId)}
                            type="button"
                          >
                            <IconEdit aria-hidden="true" size={16} />
                            Edit
                          </button>
                        ) : null}
                      </div>

                      {event.sourceType === "project" ? (
                        <p className="small text-secondary mt-3 mb-0">
                          Official project deadlines are read-only. Edit the project tasks instead.
                        </p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
