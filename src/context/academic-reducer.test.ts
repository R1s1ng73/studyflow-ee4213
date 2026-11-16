import { describe, expect, it } from "vitest";
import { createDemoData } from "@/lib/demo-data";
import { STORAGE_VERSION, type AcademicState, type GroupProject, type Task } from "@/lib/types";
import { academicReducer } from "./academic-reducer";

const changedAt = "2026-11-10T08:00:00.000Z";

function canvasFixture() {
  const canvasUrl = "https://canvas.cityu.edu.hk/courses/1/assignments/2";
  const member = { id: "canvas-user-1", displayName: "Danie Chan", initials: "DC" };
  const course = { id: "canvas-course-1", code: "EE4213", name: "HCI", color: "blue" as const };
  const official: Task = {
    id: "canvas-task-1-2",
    title: "Group Assignment",
    courseId: course.id,
    assessmentType: "assignment",
    dateMeaning: "submission-deadline",
    date: "2026-11-30",
    priority: "high",
    status: "not-started",
    projectId: "canvas-project-1-2",
    canvasUrl,
    createdAt: "2026-11-01T00:00:00.000Z",
    updatedAt: "2026-11-01T00:00:00.000Z",
  };
  const internal: Task = {
    id: "subtask-1",
    title: "Draft the report outline",
    courseId: course.id,
    assessmentType: "other",
    dateMeaning: "submission-deadline",
    date: "2026-11-20",
    internalDueDate: "2026-11-20",
    priority: "medium",
    status: "not-started",
    projectId: "canvas-project-1-2",
    createdBy: member.id,
    createdAt: "2026-11-02T00:00:00.000Z",
    updatedAt: "2026-11-02T00:00:00.000Z",
  };
  const project: GroupProject = {
    id: "canvas-project-1-2",
    name: "Group Assignment",
    courseId: course.id,
    officialDeadline: "2026-11-30",
    memberIds: [member.id],
    taskIds: [official.id, internal.id],
    canvasUrl,
  };
  const state: AcademicState = {
    version: STORAGE_VERSION,
    currentMemberId: member.id,
    courses: [course],
    members: [member],
    tasks: [official, internal],
    projects: [project],
  };
  return { canvasUrl, member, course, official, internal, project, state };
}

describe("academic reducer", () => {
  it("adds a task to the shared source of truth", () => {
    const state = createDemoData(new Date("2026-11-10T12:00:00+08:00"));
    const next = academicReducer(state, {
      type: "task/add",
      task: {
        id: "task-new",
        title: "New assignment",
        courseId: "ee4213",
        assessmentType: "assignment",
        dateMeaning: "submission-deadline",
        date: "2026-11-20",
        priority: "medium",
        status: "not-started",
        createdAt: changedAt,
        updatedAt: changedAt,
      },
    });

    expect(next.tasks.at(-1)?.title).toBe("New assignment");
  });

  it("updates status metadata and can reopen completed work", () => {
    const state = createDemoData(new Date("2026-11-10T12:00:00+08:00"));
    const completed = academicReducer(state, {
      type: "task/update",
      id: "task-reading",
      changes: { status: "done" },
      changedAt,
    });
    expect(completed.tasks.find((task) => task.id === "task-reading")).toMatchObject({
      status: "done",
      updatedAt: changedAt,
      statusUpdatedAt: changedAt,
    });

    const reopened = academicReducer(completed, {
      type: "task/update",
      id: "task-reading",
      changes: { status: "not-started" },
      changedAt: "2026-11-10T09:00:00.000Z",
    });
    expect(reopened.tasks.find((task) => task.id === "task-reading")?.status).toBe("not-started");
  });

  it("deletes a group task and removes its project reference", () => {
    const state = createDemoData(new Date("2026-11-10T12:00:00+08:00"));
    const next = academicReducer(state, { type: "task/delete", id: "group-wireframes" });
    expect(next.tasks.some((task) => task.id === "group-wireframes")).toBe(false);
    expect(next.projects.find((project) => project.id === "project-hci")?.taskIds).not.toContain("group-wireframes");
  });

  it("attaches a new internal subtask to its group project", () => {
    const state = createDemoData(new Date("2026-11-10T12:00:00+08:00"));
    const next = academicReducer(state, {
      type: "task/add",
      task: {
        id: "subtask-new",
        title: "Draft the data model",
        courseId: "ee4213",
        assessmentType: "other",
        dateMeaning: "submission-deadline",
        date: "2026-12-01",
        internalDueDate: "2026-12-01",
        priority: "medium",
        status: "not-started",
        projectId: "project-hci",
        createdBy: "member-alex",
        createdAt: changedAt,
        updatedAt: changedAt,
      },
    });

    expect(next.projects.find((project) => project.id === "project-hci")?.taskIds).toContain("subtask-new");
  });

  it("keeps browser-created subtasks and deadlines across a Canvas sync", () => {
    const { state, internal, official, project, member, course } = canvasFixture();
    const incoming: AcademicState = {
      version: STORAGE_VERSION,
      currentMemberId: member.id,
      courses: [course],
      members: [member],
      tasks: [{ ...official, internalDueDate: undefined, createdBy: undefined }],
      projects: [{ ...project, taskIds: [official.id] }],
    };

    const next = academicReducer(state, { type: "canvas/sync", state: incoming });

    expect(next.tasks.some((task) => task.id === internal.id)).toBe(true);
    expect(next.projects.find((item) => item.id === project.id)?.taskIds).toEqual([official.id, internal.id]);
    expect(next.tasks.find((task) => task.id === internal.id)?.internalDueDate).toBe("2026-11-20");
  });

  it("preserves a locally saved internal deadline on an official Canvas task", () => {
    const { state, official, project, member, course } = canvasFixture();
    const withDeadline: AcademicState = {
      ...state,
      tasks: [{ ...official, internalDueDate: "2026-11-25" }, ...state.tasks.filter((task) => task.id !== official.id)],
    };
    const incoming: AcademicState = {
      version: STORAGE_VERSION,
      currentMemberId: member.id,
      courses: [course],
      members: [member],
      tasks: [{ ...official }],
      projects: [{ ...project, taskIds: [official.id] }],
    };

    const next = academicReducer(withDeadline, { type: "canvas/sync", state: incoming });

    expect(next.tasks.find((task) => task.id === official.id)?.internalDueDate).toBe("2026-11-25");
  });

  it("bulk-fills only tasks that have no estimate yet", () => {
    const state = createDemoData(new Date("2026-11-10T12:00:00+08:00"));
    const next = academicReducer(state, {
      type: "tasks/estimate",
      entries: [
        { id: "task-no-estimate", minutes: 45 },
        { id: "task-hci-report", minutes: 999 },
      ],
      changedAt,
    });

    const estimate = next.tasks.find((task) => task.id === "task-no-estimate");
    expect(estimate?.estimatedMinutes).toBe(45);
    expect(estimate?.updatedAt).toBe(changedAt);
    expect(next.tasks.find((task) => task.id === "task-hci-report")?.estimatedMinutes).toBe(120);
  });
});
