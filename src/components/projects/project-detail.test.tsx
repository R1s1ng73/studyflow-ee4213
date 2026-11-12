import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createDemoData } from "@/lib/demo-data";
import { ProjectDetail } from "./project-detail";
import { getProjectTasks } from "./project-utils";

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
        onFilterChange={vi.fn()}
        onUpdateStatus={onUpdateStatus}
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
