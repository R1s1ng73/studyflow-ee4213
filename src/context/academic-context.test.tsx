import { act, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
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
  it("hydrates demo data once and persists later mutations", async () => {
    localStorage.clear();
    render(
      <AcademicProvider>
        <Probe />
      </AcademicProvider>,
    );

    await screen.findByText("hydrated");
    const initialCount = Number(screen.getAllByText(/^\d+$/)[0]?.textContent);
    act(() => screen.getByRole("button", { name: "Add" }).click());
    await waitFor(() => expect(screen.getByText(String(initialCount + 1))).toBeInTheDocument());
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
