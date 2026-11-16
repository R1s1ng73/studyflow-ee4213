import { afterEach, describe, expect, it, vi } from "vitest";
import { academicReducer } from "@/context/academic-reducer";
import { loadCanvasWorkspace } from "./canvas-server";
import { buildCalendarEvents } from "./selectors";
import { isAcademicState } from "./storage";

describe("CityU Canvas sync", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("paginates assignments, imports group members, and merges changed deadlines without duplicate entries", async () => {
    let dueAt = "2026-11-17T16:15:00Z";
    let submittedAt: string | null = null;
    const fetchCanvas = vi.fn((url: URL) => {
      if (url.pathname.endsWith("/profile")) return Response.json({ id: "9007199254740993", name: "Test Student" });
      if (url.pathname.endsWith("/group_members")) return Response.json([{ id: "9007199254740995", name: "Test Teammate" }]);
      if (url.pathname.endsWith("/courses")) return Response.json([{ id: "3", name: "Course", course_code: "EE1234" }]);
      if (url.searchParams.get("page") === "2") return Response.json([{ id: 5, name: "No date", due_at: null }]);
      return Response.json([{
        id: "9007199254740997", name: "Group assessment", due_at: dueAt, group_category_id: "1",
        submission: { submitted_at: submittedAt },
      }], {
        headers: { Link: '<https://canvas.cityu.edu.hk/api/v1/courses/3/assignments?page=2>; rel="next"' },
      });
    });
    vi.stubGlobal("fetch", fetchCanvas);
    const now = new Date("2026-11-16T00:00:00Z");
    const initial = await loadCanvasWorkspace("test token", now);
    expect(isAcademicState(initial)).toBe(true);
    expect(initial.tasks).toHaveLength(2);
    expect(initial.currentMemberId).toBe("canvas-user-9007199254740993");
    expect(initial.projects[0]?.memberIds).toEqual(["canvas-user-9007199254740995"]);
    expect(initial.tasks[0]).toMatchObject({ date: "2026-11-18", time: "00:15", priority: "high" });
    expect(buildCalendarEvents(initial)).toHaveLength(1);
    expect(fetchCanvas).toHaveBeenCalledWith(
      expect.any(URL), expect.objectContaining({ redirect: "error", headers: {
        Authorization: "Bearer test token", Accept: "application/json+canvas-string-ids",
      } }),
    );

    const local = academicReducer(initial, {
      type: "task/update", id: "canvas-task-3-9007199254740997", changedAt: now.toISOString(),
      changes: { priority: "low", estimatedMinutes: 25 },
    });
    dueAt = "2026-11-19T02:30:00Z";
    submittedAt = "2026-11-16T01:00:00Z";
    const result = academicReducer(local, { type: "canvas/sync", state: await loadCanvasWorkspace("test token", now) });
    expect(result.tasks).toHaveLength(2);
    expect(result.tasks[0]).toMatchObject({ date: "2026-11-19", priority: "low", estimatedMinutes: 25, status: "done" });
    expect(result.projects[0]?.officialDeadline).toBe("2026-11-19");
    expect(buildCalendarEvents(result)).toMatchObject([{ date: "2026-11-19", time: "10:30", completed: true }]);
    expect(isAcademicState(result)).toBe(true);
  });

  it("never sends a token to a different host advertised by a pagination link", async () => {
    const fetchCanvas = vi.fn((url: URL) => url.pathname.endsWith("/profile")
      ? Response.json({ id: 1, name: "Test Student" })
      : Response.json([], { headers: { Link: '<https://example.net/api/v1/courses?page=2>; rel="next"' } }));
    vi.stubGlobal("fetch", fetchCanvas);
    await expect(loadCanvasWorkspace("test token")).rejects.toThrow("Unexpected Canvas pagination URL.");
    expect(fetchCanvas).toHaveBeenCalledTimes(2);
  });
});
