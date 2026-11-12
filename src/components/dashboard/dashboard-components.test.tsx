import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AcademicState, Task } from "@/lib/types";
import { ProjectOverview } from "./project-overview";
import { QuickTasks } from "./quick-tasks";
import { StatCard } from "./stat-card";
import { UpcomingList } from "./upcoming-list";

const task: Task = {
  id: "task-1",
  title: "Submit usability report",
  courseId: "ee4213",
  assessmentType: "assignment",
  dateMeaning: "submission-deadline",
  date: "2026-11-13",
  time: "23:59",
  priority: "high",
  status: "in-progress",
  createdAt: "2026-11-01T00:00:00.000Z",
  updatedAt: "2026-11-10T00:00:00.000Z",
};

const state: AcademicState = {
  version: 1,
  currentMemberId: "member-me",
  courses: [{ id: "ee4213", code: "EE4213", name: "Human–Computer Interaction", color: "blue" }],
  members: [{ id: "member-me", displayName: "Alex Chen", initials: "AC" }],
  tasks: [
    { ...task, id: "done", title: "Research", status: "done", projectId: "project-1" },
    {
      ...task,
      id: "blocked",
      title: "Prototype",
      status: "blocked",
      projectId: "project-1",
      blockerReason: "Awaiting review",
      statusUpdatedAt: "2026-11-01T00:00:00.000Z",
    },
  ],
  projects: [
    {
      id: "project-1",
      name: "Academic Dashboard",
      courseId: "ee4213",
      officialDeadline: "2026-11-30",
      memberIds: ["member-me"],
      taskIds: ["done", "blocked"],
    },
  ],
};

afterEach(cleanup);

describe("dashboard building blocks", () => {
  it("renders a labelled metric with supporting context", () => {
    render(<StatCard title="Upcoming deadlines" value={4} description="Due in the next 14 days" />);

    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("Upcoming deadlines")).toBeInTheDocument();
    expect(screen.getByText("Due in the next 14 days")).toBeInTheDocument();
  });

  it("opens an upcoming task from its accessible action", () => {
    const onOpenTask = vi.fn();
    render(
      <UpcomingList
        tasks={[task]}
        courses={state.courses}
        now={new Date("2026-11-10T12:00:00+08:00")}
        onOpenTask={onOpenTask}
      />,
    );

    expect(screen.getByText("EE4213")).toBeInTheDocument();
    expect(screen.getByText(/Due in 3 days/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Open Submit usability report details/i }));
    expect(onOpenTask).toHaveBeenCalledWith("task-1");
    expect(screen.getByRole("link", { name: /View all deadlines/i })).toHaveAttribute("href", "/deadlines");
  });

  it("derives project completion and attention from shared task records", () => {
    render(<ProjectOverview state={state} now={new Date("2026-11-10T12:00:00+08:00")} />);

    expect(screen.getByText("Academic Dashboard")).toBeInTheDocument();
    expect(screen.getByText("50% complete")).toBeInTheDocument();
    expect(screen.getByText("1 needs attention")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /View group projects/i })).toHaveAttribute("href", "/projects");
  });

  it("labels overdue quick wins without changing their short-task presentation", () => {
    render(
      <QuickTasks
        tasks={[{ ...task, id: "overdue-short", date: "2026-11-09", estimatedMinutes: 20 }]}
        courses={state.courses}
        now={new Date("2026-11-11T12:00:00+08:00")}
        onOpenTask={vi.fn()}
      />,
    );

    const quickWin = screen.getByText("Overdue").closest(".list-group-item");
    expect(quickWin).toHaveTextContent("20 min");
  });

  it("uses equal half-width columns when two active projects are shown", () => {
    const secondTask = { ...state.tasks[1]!, id: "blocked-2", projectId: "project-2" };
    const twoProjectState: AcademicState = {
      ...state,
      tasks: [...state.tasks, secondTask],
      projects: [
        state.projects[0]!,
        {
          ...state.projects[0]!,
          id: "project-2",
          name: "Second Project",
          taskIds: [secondTask.id],
        },
      ],
    };

    render(<ProjectOverview state={twoProjectState} now={new Date("2026-11-10T12:00:00+08:00")} />);

    const projectColumns = ["Academic Dashboard", "Second Project"].map((name) =>
      screen.getByRole("heading", { level: 3, name }).closest(".col-12"),
    );
    expect(projectColumns).toHaveLength(2);
    expect(projectColumns.every((column) => column?.classList.contains("col-md-6"))).toBe(true);
  });
});
