import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createDemoData } from "@/lib/demo-data";
import { GroupTaskDialog } from "./group-task-dialog";

afterEach(cleanup);

describe("GroupTaskDialog", () => {
  function FocusHarness() {
    const [open, setOpen] = useState(false);
    const task = createDemoData(new Date("2026-11-10T12:00:00.000Z")).tasks.find(
      (item) => item.id === "group-wireframes",
    )!;

    return (
      <div>
        <button type="button" onClick={() => setOpen(true)}>
          Update task
        </button>
        <main data-testid="group-background">Project details</main>
        {open ? (
          <GroupTaskDialog task={task} onClose={() => setOpen(false)} onSave={() => undefined} />
        ) : null}
      </div>
    );
  }

  it("reports a blocked status with an optional blocker reason", async () => {
    const user = userEvent.setup();
    const task = createDemoData(new Date("2026-11-10T12:00:00.000Z")).tasks.find(
      (item) => item.id === "group-wireframes",
    )!;
    const onSave = vi.fn();

    render(<GroupTaskDialog task={task} onClose={() => undefined} onSave={onSave} />);

    expect(screen.getByRole("dialog", { name: "Update reported task status" })).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Reported status"), "blocked");
    await user.type(screen.getByLabelText("Blocker reason (optional)"), "Waiting for feedback");
    await user.click(screen.getByRole("button", { name: "Save reported status" }));

    expect(onSave).toHaveBeenCalledWith("blocked", "Waiting for feedback");
  });

  it("clears an old blocker reason when the task is no longer blocked", async () => {
    const user = userEvent.setup();
    const task = createDemoData(new Date("2026-11-10T12:00:00.000Z")).tasks.find(
      (item) => item.id === "group-prototype",
    )!;
    const onSave = vi.fn();

    render(<GroupTaskDialog task={task} onClose={() => undefined} onSave={onSave} />);

    await user.selectOptions(screen.getByLabelText("Reported status"), "done");
    expect(screen.queryByLabelText("Blocker reason (optional)")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Save reported status" }));

    expect(onSave).toHaveBeenCalledWith("done", undefined);
  });

  it("moves focus inside, contains Tab, and isolates background content", async () => {
    const user = userEvent.setup();
    render(<FocusHarness />);

    await user.click(screen.getByRole("button", { name: "Update task" }));

    await waitFor(() => expect(screen.getByLabelText("Reported status")).toHaveFocus());
    expect(screen.getByTestId("group-background")).toHaveAttribute("inert");
    expect(screen.getByTestId("group-background")).toHaveAttribute("aria-hidden", "true");
    expect(document.body).toHaveStyle({ overflow: "hidden" });

    screen.getByRole("button", { name: "Close" }).focus();
    await user.keyboard("{Shift>}{Tab}{/Shift}");
    expect(screen.getByRole("button", { name: "Save reported status" })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();
  });

  it("closes on Escape and restores focus and background state", async () => {
    const user = userEvent.setup();
    render(<FocusHarness />);
    const opener = screen.getByRole("button", { name: "Update task" });

    await user.click(opener);
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
    expect(screen.getByTestId("group-background")).not.toHaveAttribute("inert");
    expect(screen.getByTestId("group-background")).not.toHaveAttribute("aria-hidden");
    expect(document.body).not.toHaveStyle({ overflow: "hidden" });
  });
});
