import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Task, TeamMember } from "@/lib/types";
import { InternalSubtaskDialog } from "./internal-subtask-dialog";

afterEach(cleanup);

const members: TeamMember[] = [
  { id: "canvas-user-1", displayName: "Danie Chan", initials: "DC" },
  { id: "canvas-user-2", displayName: "Maya Wong", initials: "MW" },
];

const subtask: Task = {
  id: "subtask-1",
  title: "Draft the report outline",
  courseId: "canvas-course-1",
  assessmentType: "other",
  dateMeaning: "submission-deadline",
  date: "2026-11-20",
  internalDueDate: "2026-11-20",
  priority: "medium",
  status: "not-started",
  projectId: "canvas-project-1-2",
  createdBy: "canvas-user-1",
  createdAt: "2026-11-02T00:00:00.000Z",
  updatedAt: "2026-11-02T00:00:00.000Z",
};

describe("InternalSubtaskDialog", () => {
  it("saves an internal subtask with title, deadline, owner and notes", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <InternalSubtaskDialog
        projectName="Group Assignment"
        members={members}
        onClose={vi.fn()}
        onSave={onSave}
      />,
    );

    expect(screen.getByRole("dialog", { name: "Add internal subtask" })).toBeVisible();
    await user.type(screen.getByLabelText("Subtask title"), "Draft the data model");
    fireEvent.change(screen.getByLabelText("Internal deadline"), { target: { value: "2026-12-01" } });
    await user.selectOptions(screen.getByLabelText("Assigned teammate"), "canvas-user-2");
    await user.type(screen.getByLabelText("Notes (optional)"), "Before the group review");
    await user.click(screen.getByRole("button", { name: "Add subtask" }));

    expect(onSave).toHaveBeenCalledWith({
      title: "Draft the data model",
      internalDueDate: "2026-12-01",
      assignedTo: "canvas-user-2",
      notes: "Before the group review",
    });
  });

  it("blocks saving without a title and a valid deadline", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <InternalSubtaskDialog projectName="Group Assignment" members={members} onClose={vi.fn()} onSave={onSave} />,
    );

    await user.click(screen.getByRole("button", { name: "Add subtask" }));

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText("Enter a subtask title.")).toBeVisible();
    expect(screen.getByText("Choose a valid internal deadline.")).toBeVisible();
  });

  it("prefills an existing subtask and discloses who added it", () => {
    render(
      <InternalSubtaskDialog
        projectName="Group Assignment"
        members={members}
        subtask={subtask}
        creatorName="Danie Chan"
        onClose={vi.fn()}
        onSave={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByRole("dialog", { name: "Edit internal subtask" })).toBeVisible();
    expect(screen.getByLabelText("Subtask title")).toHaveValue("Draft the report outline");
    expect(screen.getByLabelText("Internal deadline")).toHaveValue("2026-11-20");
    expect(screen.getByText(/Added by/)).toHaveTextContent("Danie Chan");
  });

  it("requires confirmation before deleting an internal subtask", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(
      <InternalSubtaskDialog
        projectName="Group Assignment"
        members={members}
        subtask={subtask}
        onClose={vi.fn()}
        onSave={vi.fn()}
        onDelete={onDelete}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(onDelete).not.toHaveBeenCalled();
    expect(screen.getByText(/Delete “Draft the report outline”\?/)).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Delete subtask" }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
