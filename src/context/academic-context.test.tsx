import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createDemoData } from "@/lib/demo-data";
import { ACADEMIC_STORAGE_KEY } from "@/lib/storage";
import { AcademicProvider, useAcademic } from "./academic-context";

function Probe() {
  const { addTask, isHydrated, recoveryNotice, state } = useAcademic();
  return (
    <div>
      <span>{isHydrated ? "hydrated" : "loading"}</span>
      <span>{state.tasks.length}</span>
      <span>{recoveryNotice}</span>
      <button
        type="button"
        onClick={() =>
          addTask({
            title: "Context task",
            courseId: "ee4213",
            assessmentType: "assignment",
            dateMeaning: "submission-deadline",
            date: "2026-11-20",
            priority: "medium",
            status: "not-started",
          })
        }
      >
        Add
      </button>
    </div>
  );
}

describe("AcademicProvider", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("starts empty and persists the workspace after automatic sync", async () => {
    localStorage.clear();
    const snapshot = createDemoData();
    const fetchCanvas = vi.fn().mockResolvedValue(Response.json({ state: snapshot }));
    vi.stubGlobal("fetch", fetchCanvas);
    render(
      <AcademicProvider>
        <Probe />
      </AcademicProvider>,
    );

    await screen.findByText("hydrated");
    await screen.findByText(String(snapshot.tasks.length));
    expect(fetchCanvas).toHaveBeenCalledWith("/api/canvas/sync", { method: "POST", cache: "no-store" });
    act(() => screen.getByRole("button", { name: "Add" }).click());
    await waitFor(() => expect(screen.getByText(String(snapshot.tasks.length + 1))).toBeInTheDocument());
    await waitFor(() => expect(localStorage.getItem(ACADEMIC_STORAGE_KEY)).toContain("Context task"));
  });

  it("recovers malformed storage with an honest notice", async () => {
    localStorage.setItem(ACADEMIC_STORAGE_KEY, "broken");
    render(
      <AcademicProvider>
        <Probe />
      </AcademicProvider>,
    );

    expect(await screen.findByText(/could not be read/i)).toBeInTheDocument();
  });
});
