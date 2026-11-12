import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AcademicProvider, useAcademic } from "@/context/academic-context";
import { createDemoData } from "@/lib/demo-data";
import { ACADEMIC_STORAGE_KEY, serializeState } from "@/lib/storage";
import { TaskModal } from "./task-modal";

function Harness() {
  const { isHydrated, openTask, state, toastMessage } = useAcademic();
  const groupTask = state.tasks.find((task) => task.id === "group-wireframes");
  return (
    <>
      <button type="button" onClick={() => openTask()}>
        Add task
      </button>
      <button type="button" onClick={() => openTask("group-wireframes")}>
        Edit group task
      </button>
      <span>{isHydrated ? "ready" : "loading"}</span>
      <span data-testid="task-count">{state.tasks.length}</span>
      <span data-testid="toast">{toastMessage}</span>
      <span data-testid="group-task">
        {groupTask
          ? [
              groupTask.date,
              groupTask.internalDueDate,
              groupTask.time,
              groupTask.estimatedMinutes,
              groupTask.gradeWeight,
              groupTask.topicsCovered,
              groupTask.notes,
            ]
              .map((value) => String(value))
              .join("|")
          : "missing"}
      </span>
      <TaskModal />
    </>
  );
}

describe("TaskModal", () => {
  beforeEach(() => localStorage.clear());
  afterEach(cleanup);

  it("keeps details collapsed, validates required fields, and saves a task", async () => {
    const user = userEvent.setup();
    render(
      <AcademicProvider>
        <Harness />
      </AcademicProvider>,
    );
    await screen.findByText("ready");
    const initialCount = Number(screen.getByTestId("task-count").textContent);

    await user.click(screen.getByRole("button", { name: "Add task" }));
    expect(screen.getByRole("dialog", { name: "Add academic task" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Estimated duration (minutes)")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Save task" }));
    expect(screen.getByText("Enter a task title.")).toBeInTheDocument();
    expect(screen.getByText("Select a course.")).toBeInTheDocument();
    expect(screen.getByLabelText("Task title")).toHaveFocus();

    await user.type(screen.getByLabelText("Task title"), "Reading response");
    await user.selectOptions(screen.getByLabelText("Course"), "ge2410");
    await user.selectOptions(screen.getByLabelText("Assessment type"), "other");
    await user.selectOptions(screen.getByLabelText("Date meaning"), "date-to-remember");
    await user.type(screen.getByLabelText("Date"), "2026-11-22");
    await user.click(screen.getByRole("button", { name: "Save task" }));

    await waitFor(() => expect(screen.getByTestId("task-count")).toHaveTextContent(String(initialCount + 1)));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByTestId("toast")).toHaveTextContent(/Reading response.*GE2410.*22 Nov 2026/i);
  });

  it("closes on Escape and restores focus to its opener", async () => {
    const user = userEvent.setup();
    render(
      <AcademicProvider>
        <Harness />
      </AcademicProvider>,
    );
    await screen.findByText("ready");
    const opener = screen.getByRole("button", { name: "Add task" });
    opener.focus();
    await user.click(opener);
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });

  it("edits a group internal deadline and persists cleared optional fields", async () => {
    const state = createDemoData(new Date("2026-11-11T12:00:00+08:00"));
    state.tasks = state.tasks.map((task) =>
      task.id === "group-wireframes"
        ? {
            ...task,
            date: "2026-12-01",
            internalDueDate: "2026-11-28",
            time: "18:30",
            estimatedMinutes: 60,
            gradeWeight: 25,
            topicsCovered: "Wireframes",
            notes: "Review with team",
          }
        : task,
    );
    localStorage.setItem(ACADEMIC_STORAGE_KEY, serializeState(state));
    const user = userEvent.setup();

    render(
      <AcademicProvider>
        <Harness />
      </AcademicProvider>,
    );
    await screen.findByText("ready");
    await user.click(screen.getByRole("button", { name: "Edit group task" }));

    expect(screen.getByLabelText("Internal deadline")).toHaveValue("2026-11-28");
    expect(screen.queryByLabelText("Date meaning")).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText("Task title")).toHaveFocus());
    await user.clear(screen.getByLabelText("Internal deadline"));
    await user.type(screen.getByLabelText("Internal deadline"), "2026-11-29");
    await user.click(screen.getByRole("button", { name: "Add details" }));
    for (const label of [
      "Time",
      "Estimated duration (minutes)",
      "Grade weight (%)",
      "Topics covered",
      "Notes",
    ]) {
      await user.clear(screen.getByLabelText(label));
    }
    await user.click(screen.getByRole("button", { name: "Save task" }));

    await waitFor(() => {
      expect(screen.getByTestId("group-task")).toHaveTextContent(
        "2026-12-01|2026-11-29|undefined|undefined|undefined|undefined|undefined",
      );
    });
    expect(screen.getByTestId("toast")).toHaveTextContent(/29 Nov 2026/i);
  });
});
