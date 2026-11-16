import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AcademicProvider } from "@/context/academic-context";
import { createDemoData } from "@/lib/demo-data";
import { ACADEMIC_STORAGE_KEY, serializeState } from "@/lib/storage";
import { ProjectsPage } from "./projects-page";

describe("ProjectsPage", () => {
  beforeEach(() => localStorage.setItem(ACADEMIC_STORAGE_KEY, serializeState(createDemoData())));
  afterEach(cleanup);

  it("provides the route heading and primary add-task action", async () => {
    render(
      <AcademicProvider>
        <ProjectsPage />
      </AcademicProvider>,
    );

    expect(await screen.findByRole("heading", { level: 1, name: "Group Projects" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Add task" })).toBeVisible();
  });

  it("keeps the actions header in normal table flow for mobile overflow containment", async () => {
    render(
      <AcademicProvider>
        <ProjectsPage />
      </AcademicProvider>,
    );

    const actionsHeader = await screen.findByRole("columnheader", { name: "Actions" });
    expect(actionsHeader.querySelector(".visually-hidden")).toBeNull();
  });

  it("opens the selected project's details even when it was already selected", async () => {
    render(
      <AcademicProvider>
        <ProjectsPage />
      </AcademicProvider>,
    );

    const heading = await screen.findByRole("heading", { level: 2, name: "Student Academic Dashboard" });
    const scrollIntoView = vi.fn();
    heading.scrollIntoView = scrollIntoView;
    fireEvent.click(screen.getByRole("button", { name: "View project details for Student Academic Dashboard" }));
    expect(heading).toHaveFocus();
    expect(scrollIntoView).toHaveBeenCalledWith({ block: "start" });

    const originalScroll = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollIntoView");
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: scrollIntoView });
    try {
      fireEvent.click(screen.getByRole("button", { name: "View project details for Adaptive Filter Study" }));
      const detail = screen.getByRole("region", { name: "Adaptive Filter Study" });
      expect(within(detail).getByRole("heading", { name: "Adaptive Filter Study" })).toHaveFocus();
      expect(within(detail).getByText("Official project submission deadline")).toBeVisible();

      const leader = within(detail).getByText("Group leader").closest("details")!;
      expect(within(leader).getByText("Noor Rahman")).toBeVisible();
      fireEvent.click(leader.querySelector("summary")!);
      expect(leader).toHaveAttribute("open");
      expect(within(leader).getByText(/Coordinates the study/)).toBeVisible();
    } finally {
      if (originalScroll) {
        Object.defineProperty(HTMLElement.prototype, "scrollIntoView", originalScroll);
      } else {
        Reflect.deleteProperty(HTMLElement.prototype, "scrollIntoView");
      }
    }
  });

  it("adds an internal subtask with a deadline and creator to the selected project", async () => {
    const user = userEvent.setup();
    render(
      <AcademicProvider>
        <ProjectsPage />
      </AcademicProvider>,
    );

    await screen.findByRole("heading", { level: 2, name: "Student Academic Dashboard" });
    await user.click(screen.getByRole("button", { name: "Add subtask" }));

    const dialog = screen.getByRole("dialog", { name: "Add internal subtask" });
    await user.type(within(dialog).getByLabelText("Subtask title"), "Draft the questionnaire");
    fireEvent.change(within(dialog).getByLabelText("Internal deadline"), { target: { value: "2026-12-05" } });
    await user.click(within(dialog).getByRole("button", { name: "Add subtask" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    const table = screen.getByRole("table", { name: "Tasks for Student Academic Dashboard" });
    expect(within(table).getByText("Draft the questionnaire")).toBeVisible();
    expect(within(table).getByText("Added by Alex Chen")).toBeVisible();
    expect(within(table).getByText("5 Dec 2026")).toBeVisible();
  });
});
