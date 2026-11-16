import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CalendarEvent, Course } from "@/lib/types";
import { MonthCalendar } from "./month-calendar";

const courses: Course[] = [
  { id: "course-1", code: "EE4213", name: "Human Computer Interaction", color: "blue" },
];

const events: CalendarEvent[] = [
  {
    id: "task:task-1",
    sourceId: "task-1",
    sourceType: "task",
    date: "2026-11-10",
    title: "Coursework",
    courseId: "course-1",
    category: "assignment",
    completed: false,
    dateMeaning: "submission-deadline",
  },
  {
    id: "project:project-1",
    sourceId: "project-1",
    sourceType: "project",
    date: "2026-11-10",
    title: "Project submission",
    courseId: "course-1",
    category: "project-deadline",
    completed: false,
    dateMeaning: "official-project-deadline",
  },
];

afterEach(cleanup);

function renderCalendar(onTaskClick = vi.fn(), calendarEvents = events) {
  return {
    onTaskClick,
    ...render(
      <MonthCalendar
        courses={courses}
        events={calendarEvents}
        month={new Date(2026, 10, 1)}
        today={new Date(2026, 10, 10)}
        onNextMonth={vi.fn()}
        onPreviousMonth={vi.fn()}
        onTaskClick={onTaskClick}
        onToday={vi.fn()}
      />,
    ),
  };
}

describe("MonthCalendar", () => {
  it("edits the underlying shared task when a task event is selected", async () => {
    const user = userEvent.setup();
    const { onTaskClick } = renderCalendar();

    await user.click(screen.getAllByRole("button", { name: "Edit Coursework" })[0]!);

    expect(onTaskClick).toHaveBeenCalledWith("task-1");
  });

  it("opens read-only project deadline details", async () => {
    const user = userEvent.setup();
    renderCalendar();

    await user.click(
      screen.getAllByRole("button", { name: "View Project submission details" })[0]!,
    );

    expect(screen.getByRole("dialog", { name: "Tuesday, November 10 schedule" })).toBeVisible();
    expect(screen.getByText(/Official project deadlines are read-only/)).toBeVisible();
  });

  it("opens the selected day's complete schedule from the date control", async () => {
    const user = userEvent.setup();
    renderCalendar();

    await user.click(
      screen.getByRole("button", {
        name: "Open schedule for Tuesday, November 10, 2 items",
      }),
    );

    const dialog = screen.getByRole("dialog", { name: "Tuesday, November 10 schedule" });
    expect(dialog).toBeVisible();
    expect(within(dialog).getByText("Coursework")).toBeVisible();
    expect(within(dialog).getByText("Project submission")).toBeVisible();
  });

  it("identifies completed task events with text as well as styling", () => {
    renderCalendar(vi.fn(), [
      {
        ...events[0]!,
        id: "task:completed",
        sourceId: "completed",
        title: "Completed reading",
        completed: true,
      },
    ]);

    expect(screen.getAllByRole("button", { name: "Edit Completed reading (completed)" })[0]).toBeVisible();
    expect(screen.getAllByText("Done")[0]).toBeVisible();
  });
});
