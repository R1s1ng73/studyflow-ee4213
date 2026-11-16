import { addDays, isSameDay, isSameMonth, startOfMonth, startOfWeek } from "date-fns";
import { formatDateOnly } from "@/lib/date";
import type { CalendarEvent } from "@/lib/types";

export interface MonthDay {
  date: Date;
  dateKey: string;
  isCurrentMonth: boolean;
  isToday: boolean;
}

export function buildMonthDays(month: Date, today = new Date()): MonthDay[] {
  const monthStart = startOfMonth(month);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });

  return Array.from({ length: 42 }, (_, index) => {
    const date = addDays(gridStart, index);
    return {
      date,
      dateKey: formatDateOnly(date),
      isCurrentMonth: isSameMonth(date, monthStart),
      isToday: isSameDay(date, today),
    };
  });
}

export function groupCalendarEventsByDate(
  events: readonly CalendarEvent[],
): Map<string, CalendarEvent[]> {
  const grouped = new Map<string, CalendarEvent[]>();

  for (const event of events) {
    const dayEvents = grouped.get(event.date) ?? [];
    dayEvents.push(event);
    grouped.set(event.date, dayEvents);
  }

  return grouped;
}

export function getCalendarCategoryLabel(category: CalendarEvent["category"]): string {
  switch (category) {
    case "assignment":
      return "Assignment";
    case "quiz":
      return "Quiz";
    case "test":
      return "Test";
    case "exam":
      return "Exam";
    case "other":
      return "Other";
    case "group-task":
      return "Group task";
    case "project-deadline":
      return "Project deadline";
  }
}
