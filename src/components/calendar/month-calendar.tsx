"use client";

import { useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import {
  IconCalendarEvent,
  IconChevronLeft,
  IconChevronRight,
  IconClock,
} from "@tabler/icons-react";
import { formatDateOnly } from "@/lib/date";
import type { CalendarEvent, Course, CourseColor } from "@/lib/types";
import {
  buildMonthDays,
  getCalendarCategoryLabel,
  groupCalendarEventsByDate,
} from "./calendar-helpers";
import { DayDialog } from "./day-dialog";

interface MonthCalendarProps {
  month: Date;
  today: Date;
  events: CalendarEvent[];
  courses: Course[];
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onTaskClick: (taskId: string) => void;
}

interface SelectedDay {
  date: Date;
  focusEventId?: string;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const COURSE_EVENT_CLASSES: Record<CourseColor, string> = {
  blue: "bg-blue-lt text-blue border-blue",
  azure: "bg-azure-lt text-azure border-azure",
  teal: "bg-teal-lt text-teal border-teal",
  purple: "bg-purple-lt text-purple border-purple",
  orange: "bg-orange-lt text-orange border-orange",
  pink: "bg-pink-lt text-pink border-pink",
};

function itemCountLabel(count: number): string {
  return `${count} ${count === 1 ? "item" : "items"}`;
}

export function MonthCalendar({
  month,
  today,
  events,
  courses,
  onPreviousMonth,
  onNextMonth,
  onToday,
  onTaskClick,
}: MonthCalendarProps) {
  const [selectedDay, setSelectedDay] = useState<SelectedDay | null>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const days = useMemo(() => buildMonthDays(month, today), [month, today]);
  const eventsByDate = useMemo(() => groupCalendarEventsByDate(events), [events]);
  const monthLabel = format(month, "MMMM yyyy");

  function courseFor(event: CalendarEvent) {
    return courses.find((course) => course.id === event.courseId);
  }

  function openDay(date: Date, focusEventId?: string) {
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    setSelectedDay({ date, focusEventId });
  }

  function closeDay() {
    setSelectedDay(null);
    window.setTimeout(() => restoreFocusRef.current?.focus(), 0);
  }

  function selectEvent(event: CalendarEvent, date: Date) {
    if (event.sourceType === "task") {
      onTaskClick(event.sourceId);
      return;
    }
    openDay(date, event.id);
  }

  const agendaDays = days.filter(
    (day) => day.isCurrentMonth && (eventsByDate.get(day.dateKey)?.length ?? 0) > 0,
  );

  return (
    <>
      <section aria-label={`${monthLabel} calendar`} className="card shadow-sm">
        <div className="card-header flex-wrap gap-3">
          <div>
            <div className="text-secondary small text-uppercase fw-semibold mb-1">Monthly view</div>
            <h2 className="card-title h3 mb-0">{monthLabel}</h2>
          </div>
          <div className="card-actions d-flex align-items-center gap-2 ms-auto">
            <button className="btn btn-outline-secondary" onClick={onToday} type="button">
              Today
            </button>
            <div aria-label="Calendar navigation" className="btn-group" role="group">
              <button
                aria-label="Previous month"
                className="btn btn-outline-secondary btn-icon"
                onClick={onPreviousMonth}
                type="button"
              >
                <IconChevronLeft aria-hidden="true" size={18} />
              </button>
              <button
                aria-label="Next month"
                className="btn btn-outline-secondary btn-icon"
                onClick={onNextMonth}
                type="button"
              >
                <IconChevronRight aria-hidden="true" size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="d-none d-md-block">
          <div
            aria-hidden="true"
            className="border-bottom bg-light text-secondary fw-semibold small text-uppercase"
            style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}
          >
            {WEEKDAYS.map((weekday) => (
              <div className="px-2 py-2 text-center" key={weekday}>
                {weekday}
              </div>
            ))}
          </div>

          <div
            aria-label={`${monthLabel} date grid`}
            role="grid"
            style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}
          >
            {days.map((day) => {
              const dayEvents = eventsByDate.get(day.dateKey) ?? [];
              const visibleEvents = dayEvents.slice(0, 3);
              const dayLabel = format(day.date, "EEEE, MMMM d");

              return (
                <div
                  className={`border-end border-bottom p-2 ${
                    day.isCurrentMonth ? "bg-white" : "bg-light"
                  }`}
                  key={day.dateKey}
                  role="gridcell"
                  style={{ minHeight: "8.75rem", minWidth: 0 }}
                >
                  <button
                    aria-current={day.isToday ? "date" : undefined}
                    aria-label={`Open schedule for ${dayLabel}, ${itemCountLabel(dayEvents.length)}`}
                    className={`btn btn-sm btn-icon border-0 mb-2 ${
                      day.isToday
                        ? "btn-primary rounded-circle"
                        : day.isCurrentMonth
                          ? "btn-ghost-secondary"
                          : "btn-ghost-secondary text-secondary opacity-50"
                    }`}
                    onClick={() => openDay(day.date)}
                    type="button"
                  >
                    {format(day.date, "d")}
                  </button>

                  <div className="d-flex flex-column gap-1">
                    {visibleEvents.map((event) => {
                      const course = courseFor(event);
                      const eventClass = course
                        ? COURSE_EVENT_CLASSES[course.color]
                        : "bg-secondary-lt text-secondary border-secondary";

                      return (
                        <button
                          aria-label={
                            event.sourceType === "task"
                              ? `Edit ${event.title}${event.completed ? " (completed)" : ""}`
                              : `View ${event.title} details`
                          }
                          className={`btn btn-sm border-start border-2 justify-content-start text-start px-2 py-1 ${eventClass} ${
                            event.completed ? "opacity-50 text-decoration-line-through" : ""
                          }`}
                          key={event.id}
                          onClick={() => selectEvent(event, day.date)}
                          title={`${course?.code ?? "Course"} · ${getCalendarCategoryLabel(event.category)}`}
                          type="button"
                        >
                          <span className="d-block w-100 min-w-0">
                            <span className="text-truncate d-block fw-semibold">{event.title}</span>
                            <span className="text-truncate d-block small opacity-75">
                              {course?.code ?? "Course"} · {getCalendarCategoryLabel(event.category)}
                              {event.completed ? <span className="badge bg-green-lt text-green ms-1">Done</span> : null}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                    {dayEvents.length > visibleEvents.length ? (
                      <button
                        className="btn btn-sm btn-ghost-secondary justify-content-start px-1"
                        onClick={() => openDay(day.date)}
                        type="button"
                      >
                        +{dayEvents.length - visibleEvents.length} more
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="d-md-none">
          {agendaDays.length === 0 ? (
            <div className="empty py-5 px-3">
              <div className="empty-icon">
                <IconCalendarEvent aria-hidden="true" size={40} />
              </div>
              <p className="empty-title">No dates scheduled this month</p>
              <p className="empty-subtitle text-secondary mb-0">
                Tasks and official project deadlines will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="list-group list-group-flush">
              {agendaDays.map((day) => {
                const dayEvents = eventsByDate.get(day.dateKey) ?? [];
                const dayLabel = format(day.date, "EEEE, MMMM d");

                return (
                  <div className="list-group-item p-3" key={day.dateKey}>
                    <button
                      aria-label={`View agenda for ${dayLabel}, ${itemCountLabel(dayEvents.length)}`}
                      className="btn btn-ghost-secondary w-100 justify-content-between px-0 mb-2"
                      onClick={() => openDay(day.date)}
                      type="button"
                    >
                      <span className="fw-semibold">{format(day.date, "EEE, MMM d")}</span>
                      <span className="badge bg-secondary-lt text-secondary">
                        {itemCountLabel(dayEvents.length)}
                      </span>
                    </button>
                    <div className="d-flex flex-column gap-2">
                      {dayEvents.map((event) => {
                        const course = courseFor(event);
                        const eventClass = course
                          ? COURSE_EVENT_CLASSES[course.color]
                          : "bg-secondary-lt text-secondary border-secondary";

                        return (
                          <button
                            aria-label={
                              event.sourceType === "task"
                                ? `Edit ${event.title}${event.completed ? " (completed)" : ""}`
                                : `View ${event.title} details`
                            }
                            className={`btn border-start border-3 justify-content-start text-start p-3 ${eventClass} ${
                              event.completed ? "opacity-50" : ""
                            }`}
                            key={event.id}
                            onClick={() => selectEvent(event, day.date)}
                            type="button"
                          >
                            <span className="d-block w-100 min-w-0">
                              <span
                                className={`fw-semibold d-block text-truncate ${
                                  event.completed ? "text-decoration-line-through" : ""
                                }`}
                              >
                                {event.title}
                              </span>
                              <span className="small opacity-75 d-flex align-items-center flex-wrap gap-2 mt-1">
                                <span>{course?.code ?? "Course"}</span>
                                <span>{getCalendarCategoryLabel(event.category)}</span>
                                {event.completed ? <span className="badge bg-green-lt text-green">Done</span> : null}
                                {event.time ? (
                                  <span className="d-inline-flex align-items-center gap-1">
                                    <IconClock aria-hidden="true" size={13} />
                                    {event.time}
                                  </span>
                                ) : null}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {selectedDay ? (
        <DayDialog
          courses={courses}
          date={selectedDay.date}
          events={eventsByDate.get(formatDateOnly(selectedDay.date)) ?? []}
          focusEventId={selectedDay.focusEventId}
          onClose={closeDay}
          onTaskClick={(taskId) => {
            closeDay();
            onTaskClick(taskId);
          }}
        />
      ) : null}
    </>
  );
}
