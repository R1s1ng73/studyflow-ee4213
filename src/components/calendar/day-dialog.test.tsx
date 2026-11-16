import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import type { CalendarEvent, Course } from "@/lib/types";
import { DayDialog } from "./day-dialog";

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
];

afterEach(cleanup);

function FocusHarness() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button type="button" onClick={() => setOpen(true)}>
        Open schedule
      </button>
      <main data-testid="day-background">Calendar</main>
      {open ? (
        <DayDialog
          courses={courses}
          date={new Date(2026, 10, 10)}
          events={events}
          onClose={() => setOpen(false)}
          onTaskClick={() => undefined}
        />
      ) : null}
    </div>
  );
}

describe("DayDialog", () => {
  it("moves focus inside, contains Tab, and isolates background content", async () => {
    const user = userEvent.setup();
    render(<FocusHarness />);

    await user.click(screen.getByRole("button", { name: "Open schedule" }));

    const close = screen.getByRole("button", { name: "Close schedule" });
    const edit = screen.getByRole("button", { name: "Edit" });
    await waitFor(() => expect(close).toHaveFocus());
    expect(screen.getByTestId("day-background")).toHaveAttribute("inert");
    expect(screen.getByTestId("day-background")).toHaveAttribute("aria-hidden", "true");
    expect(document.body).toHaveStyle({ overflow: "hidden" });

    await user.keyboard("{Shift>}{Tab}{/Shift}");
    expect(edit).toHaveFocus();
    await user.tab();
    expect(close).toHaveFocus();
  });

  it("closes on Escape and restores focus and background state", async () => {
    const user = userEvent.setup();
    render(<FocusHarness />);
    const opener = screen.getByRole("button", { name: "Open schedule" });

    await user.click(opener);
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
    expect(screen.getByTestId("day-background")).not.toHaveAttribute("inert");
    expect(screen.getByTestId("day-background")).not.toHaveAttribute("aria-hidden");
    expect(document.body).not.toHaveStyle({ overflow: "hidden" });
  });
});
