import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { GroupProject, Task, TeamMember } from "@/lib/types";
import { createDemoData } from "@/lib/demo-data";
import { ProjectDetail } from "./project-detail";
import { getProjectTasks } from "./project-utils";

afterEach(cleanup);

describe("ProjectDetail responsive task presentation", () => {
  it("provides a mobile task card with the same owner, deadline, status, update and action", () => {
    const now = new Date("2026-11-11T12:00:00+08:00");
    const state = createDemoData(now);
    const project = state.projects[0]!;
    const tasks = getProjectTasks(state, project);
    const onUpdateStatus = vi.fn();

    render(
      <ProjectDetail
        project={project}
        course={state.courses.find((course) => course.id === project.courseId)}
        members={state.members.filter((member) => project.memberIds.includes(member.id))}
        tasks={tasks}
        filter="all"
        currentMemberId={state.currentMemberId}
        onFilterChange={vi.fn()}
        onUpdateStatus={onUpdateStatus}
        onAddSubtask={vi.fn()}
        onEditSubtask={vi.fn()}
        now={now}
      />,
    );

    const mobileList = screen.getByRole("list", { name: `Mobile tasks for ${project.name}` });
    expect(mobileList).toHaveClass("d-md-none");
    const blockedCard = within(mobileList).getByRole("listitem", {
      name: /Implement calendar prototype/i,
    });

    expect(within(blockedCard).getByText("Maya Wong")).toBeVisible();
    expect(within(blockedCard).getByText("10 Nov 2026")).toBeVisible();
    expect(within(blockedCard).getByText("Blocked")).toBeVisible();
    expect(within(blockedCard).getByText("Needs attention")).toBeVisible();
    expect(within(blockedCard).getByText(/Waiting for final course colour mapping/i)).toBeVisible();
    expect(within(blockedCard).getByText(/Last updated/i)).toBeVisible();
    const update = within(blockedCard).getByRole("button", {
        name: "Update reported status for Implement calendar prototype",
      });
    fireEvent.click(update);
    expect(onUpdateStatus).toHaveBeenCalledWith(tasks.find((task) => task.id === "group-prototype"));

    const desktopTable = screen.getByRole("table", { name: `Tasks for ${project.name}` });
    expect(desktopTable.parentElement).toHaveClass("d-none", "d-md-block");
  });
});

describe("ProjectDetail internal versus official work", () => {
  const now = new Date("2026-11-11T12:00:00+08:00");
  const member: TeamMember = { id: "canvas-user-1", displayName: "Danie Chan", initials: "DC" };
  const canvasUrl = "https://canvas.cityu.edu.hk/courses/1/assignments/2";
  const project: GroupProject = {
    id: "canvas-project-1-2",
    name: "Group Assignment",
    courseId: "canvas-course-1",
    officialDeadline: "2026-11-30",
    memberIds: [member.id],
    taskIds: ["canvas-task-1-2", "subtask-1"],
    canvasUrl,
  };
  const officialTask: Task = {
    id: "canvas-task-1-2",
    title: "Group Assignment",
    courseId: "canvas-course-1",
    assessmentType: "assignment",
    dateMeaning: "submission-deadline",
    date: "2026-11-30",
    priority: "high",
    status: "not-started",
    projectId: project.id,
    canvasUrl,
    createdAt: "2026-11-01T00:00:00.000Z",
    updatedAt: "2026-11-01T00:00:00.000Z",
  };
  const internalTask: Task = {
    id: "subtask-1",
    title: "Draft the report outline",
    courseId: "canvas-course-1",
    assessmentType: "other",
    dateMeaning: "submission-deadline",
    date: "2026-11-20",
    internalDueDate: "2026-11-20",
    priority: "medium",
    status: "not-started",
    projectId: project.id,
    assignedTo: member.id,
    createdBy: member.id,
    createdAt: "2026-11-02T00:00:00.000Z",
    updatedAt: "2026-11-02T00:00:00.000Z",
  };

  function renderProject(tasks: Task[], overrides?: Partial<Parameters<typeof ProjectDetail>[0]>) {
    return render(
      <ProjectDetail
        project={project}
        course={{ id: "canvas-course-1", code: "EE4213", name: "HCI", color: "blue" }}
        members={[member]}
        tasks={tasks}
        filter="all"
        currentMemberId={member.id}
        onFilterChange={vi.fn()}
        onUpdateStatus={vi.fn()}
        onAddSubtask={vi.fn()}
        onEditSubtask={vi.fn()}
        now={now}
        {...overrides}
      />,
    );
  }

  it("labels Canvas work as official and internal subtasks as editable", () => {
    const onEditSubtask = vi.fn();
    const onAddSubtask = vi.fn();
    renderProject([officialTask, internalTask], { onEditSubtask, onAddSubtask });

    expect(screen.getByRole("heading", { name: "Official from Canvas" })).toBeVisible();
    expect(screen.getByText("Official · Canvas")).toBeVisible();
    expect(screen.getByText("Canvas deadline: 30 Nov 2026")).toBeVisible();

    const table = screen.getByRole("table", { name: `Tasks for ${project.name}` });
    expect(within(table).getByText("Internal")).toBeVisible();
    expect(within(table).queryByText("Group Assignment")).not.toBeInTheDocument();
    expect(within(table).getByText("Added by Danie Chan")).toBeVisible();
    expect(within(table).getByText("20 Nov 2026")).toBeVisible();

    fireEvent.click(within(table).getByRole("button", { name: "Edit internal subtask Draft the report outline" }));
    expect(onEditSubtask).toHaveBeenCalledWith(internalTask);

    fireEvent.click(screen.getByRole("button", { name: "Add subtask" }));
    expect(onAddSubtask).toHaveBeenCalled();
  });

  it("shows an empty internal section for Canvas-only projects", () => {
    renderProject([officialTask]);

    expect(screen.getByText("No internal subtasks yet")).toBeVisible();
    expect(screen.getByRole("button", { name: "Add subtask" })).toBeVisible();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});
