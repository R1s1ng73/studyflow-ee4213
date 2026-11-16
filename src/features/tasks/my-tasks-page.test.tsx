import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AcademicProvider } from "@/context/academic-context";
import { createDemoData } from "@/lib/demo-data";
import { ACADEMIC_STORAGE_KEY, serializeState } from "@/lib/storage";
import { MyTasksPage } from "./my-tasks-page";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function requestUrl(input: RequestInfo | URL): string {
  return typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
}

describe("MyTasksPage missing-estimate flow", () => {
  beforeEach(() => localStorage.setItem(ACADEMIC_STORAGE_KEY, serializeState(createDemoData())));

  it("keeps a route back to matching short tasks after the final missing estimate is added", async () => {
    const user = userEvent.setup();
    render(
      <AcademicProvider>
        <MyTasksPage />
      </AcademicProvider>,
    );

    await screen.findByRole("heading", { level: 1, name: "My Tasks" });
    await user.click(screen.getByRole("tab", { name: "Short Tasks" }));
    await user.click(screen.getByRole("button", { name: "Review missing estimates" }));
    await user.type(screen.getByLabelText("Estimated minutes for Review lecture annotations"), "25");
    await user.click(screen.getByRole("button", { name: "Save estimate for Review lecture annotations" }));

    expect(screen.getByText("Every unfinished task has an estimate")).toBeVisible();
    const back = screen.getByRole("button", { name: "Back to matches" });
    expect(back).toBeVisible();

    await user.click(back);
    expect(screen.getByRole("button", { name: "Review lecture annotations" })).toBeVisible();
  });
});

describe("MyTasksPage undated filtering and bulk estimates", () => {
  const now = new Date("2026-11-10T12:00:00+08:00");

  beforeEach(() => {
    const state = createDemoData(now);
    const template = state.tasks[0]!;
    state.tasks = [
      ...state.tasks,
      {
        ...template,
        id: "canvas-undated",
        title: "Undated Canvas reading",
        date: "",
        time: undefined,
        estimatedMinutes: 30,
        status: "not-started",
        canvasUrl: "https://canvas.cityu.edu.hk/courses/1/assignments/99",
      },
    ];
    localStorage.setItem(ACADEMIC_STORAGE_KEY, serializeState(state));
  });

  it("hides tasks without a due date until the switch is turned on", async () => {
    const user = userEvent.setup();
    render(
      <AcademicProvider>
        <MyTasksPage />
      </AcademicProvider>,
    );

    await screen.findByRole("heading", { level: 1, name: "My Tasks" });
    expect(screen.queryByRole("button", { name: "Undated Canvas reading" })).not.toBeInTheDocument();

    const toggle = screen.getByRole("switch", { name: /Show tasks without a due date/ });
    expect(toggle).not.toBeChecked();
    expect(toggle.closest("label")).toHaveTextContent("(1)");

    await user.click(toggle);

    expect(screen.getByRole("button", { name: "Undated Canvas reading" })).toBeVisible();
  });

  it("fills every missing estimate from the AI titles", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) =>
      requestUrl(input).includes("/api/canvas/sync")
        ? jsonResponse({ message: "Canvas offline." }, 503)
        : jsonResponse({ estimates: [95] }),
    );
    render(
      <AcademicProvider>
        <MyTasksPage />
      </AcademicProvider>,
    );

    await screen.findByRole("heading", { level: 1, name: "My Tasks" });
    await user.click(screen.getByRole("button", { name: "Estimate missing times (1)" }));

    expect(await screen.findByRole("button", { name: "All shown tasks have estimates" })).toBeDisabled();
    const estimateCall = fetchMock.mock.calls.find(([input]) => requestUrl(input).includes("/api/tasks/estimate"));
    expect(estimateCall).toBeTruthy();
    expect(JSON.parse((estimateCall![1] as RequestInit).body as string)).toEqual({
      titles: ["Review lecture annotations"],
    });
    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem(ACADEMIC_STORAGE_KEY)!);
      expect(stored.tasks.find((task: { id: string }) => task.id === "task-no-estimate").estimatedMinutes).toBe(95);
    });
  });

  it("falls back to the local title heuristic when the estimate service fails", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) =>
      requestUrl(input).includes("/api/canvas/sync")
        ? jsonResponse({ message: "Canvas offline." }, 503)
        : jsonResponse({ message: "Estimator down." }, 502),
    );
    render(
      <AcademicProvider>
        <MyTasksPage />
      </AcademicProvider>,
    );

    await screen.findByRole("heading", { level: 1, name: "My Tasks" });
    await user.click(screen.getByRole("button", { name: "Estimate missing times (1)" }));

    expect(await screen.findByRole("button", { name: "All shown tasks have estimates" })).toBeDisabled();
    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem(ACADEMIC_STORAGE_KEY)!);
      expect(stored.tasks.find((task: { id: string }) => task.id === "task-no-estimate").estimatedMinutes).toBe(45);
    });
  });
});
