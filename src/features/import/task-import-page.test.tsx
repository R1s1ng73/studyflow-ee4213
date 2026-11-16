import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AcademicProvider } from "@/context/academic-context";
import { createDemoData } from "@/lib/demo-data";
import { ACADEMIC_STORAGE_KEY, serializeState } from "@/lib/storage";
import { TaskImportPage } from "./task-import-page";

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

describe("TaskImportPage estimate prefill", () => {
  beforeEach(() => {
    localStorage.setItem(ACADEMIC_STORAGE_KEY, serializeState(createDemoData()));
  });

  it("suggests an estimate and a 23:59 deadline before importing", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      if (url.includes("/api/canvas/sync")) return jsonResponse({ message: "Canvas offline." }, 503);
      return jsonResponse({
        items: [
          {
            title: "Final report",
            courseHint: "",
            date: "2026-12-01",
            time: "",
            dateMeaning: "submission-deadline",
            excerpt: "Submit the final report.",
            reviewReason: "",
          },
        ],
      });
    });

    render(
      <AcademicProvider>
        <TaskImportPage />
      </AcademicProvider>,
    );

    await user.upload(
      screen.getByLabelText("Choose files", { selector: "input" }),
      new File(["%PDF-1.4"], "module-guide.pdf", { type: "application/pdf" }),
    );
    await user.click(screen.getByRole("button", { name: "Read files" }));

    expect(await screen.findByLabelText("Time (Hong Kong)")).toHaveValue("23:59");
    expect(screen.getByLabelText("Estimate (minutes)")).toHaveValue(180);

    const importButton = screen.getByRole("button", { name: "Import selected (1)" });
    await user.click(importButton);
    expect(await screen.findByText(/Imported 1 item/)).toBeVisible();

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem(ACADEMIC_STORAGE_KEY)!);
      const imported = stored.tasks.find((task: { title: string }) => task.title === "Final report");
      expect(imported).toMatchObject({ time: "23:59", estimatedMinutes: 180 });
    });
  });

  it("lets the student correct the suggested estimate before importing", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      if (url.includes("/api/canvas/sync")) return jsonResponse({ message: "Canvas offline." }, 503);
      return jsonResponse({
        items: [
          {
            title: "Read chapter 4",
            courseHint: "",
            date: "2026-12-02",
            time: "",
            dateMeaning: "date-to-remember",
            excerpt: "",
            reviewReason: "",
          },
        ],
      });
    });

    render(
      <AcademicProvider>
        <TaskImportPage />
      </AcademicProvider>,
    );

    await user.upload(
      screen.getByLabelText("Choose files", { selector: "input" }),
      new File(["%PDF-1.4"], "reading.pdf", { type: "application/pdf" }),
    );
    await user.click(screen.getByRole("button", { name: "Read files" }));

    const estimate = await screen.findByLabelText("Estimate (minutes)");
    expect(estimate).toHaveValue(45);
    expect(screen.getByLabelText("Time (Hong Kong)")).toHaveValue("");

    await user.clear(estimate);
    await user.type(estimate, "90");
    await user.click(screen.getByRole("button", { name: "Import selected (1)" }));

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem(ACADEMIC_STORAGE_KEY)!);
      const imported = stored.tasks.find((task: { title: string }) => task.title === "Read chapter 4");
      expect(imported.estimatedMinutes).toBe(90);
    });
  });
});
