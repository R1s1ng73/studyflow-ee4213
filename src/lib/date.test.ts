import { describe, expect, it } from "vitest";
import { formatDateOnly, parseDateOnly } from "./date";

describe("date-only utilities", () => {
  it("round-trips a calendar date without UTC conversion", () => {
    const parsed = parseDateOnly("2026-01-05");
    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(0);
    expect(parsed.getDate()).toBe(5);
    expect(formatDateOnly(parsed)).toBe("2026-01-05");
  });
});
