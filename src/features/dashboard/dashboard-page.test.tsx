import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAcademic } from "@/context/academic-context";
import { createDemoData } from "@/lib/demo-data";
import { getDashboardMetrics } from "@/lib/selectors";
import { DashboardPage } from "./dashboard-page";

vi.mock("@/context/academic-context", () => ({ useAcademic: vi.fn() }));

describe("DashboardPage", () => {
  const now = new Date("2026-11-10T12:00:00+08:00");

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("derives every summary metric from shared state and opens task capture", () => {
    const state = createDemoData(now);
    const metrics = getDashboardMetrics(state, now);
    const openTask = vi.fn();

    vi.mocked(useAcademic).mockReturnValue({
      state,
      isHydrated: true,
      recoveryNotice: "",
      taskDialog: { isOpen: false },
      toastMessage: "",
      openTask,
      closeTask: vi.fn(),
      addTask: vi.fn(),
      updateTask: vi.fn(),
      deleteTask: vi.fn(),
      resetDemoData: vi.fn(),
      showToast: vi.fn(),
      clearToast: vi.fn(),
    });

    render(<DashboardPage />);

    expect(screen.getByRole("heading", { name: /Good afternoon, Alex/i })).toBeInTheDocument();
    expect(screen.getByLabelText(`Upcoming deadlines: ${metrics.upcomingDeadlines}`)).toBeInTheDocument();
    expect(screen.getByLabelText(`Urgent or overdue: ${metrics.urgentOrOverdue}`)).toBeInTheDocument();
    expect(screen.getByLabelText(`Unfinished tasks: ${metrics.unfinishedPersonal}`)).toBeInTheDocument();
    expect(screen.getByLabelText(`Group attention: ${metrics.groupNeedsAttention}`)).toBeInTheDocument();
    expect(screen.getByText(/group updates are not live or shared/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Add task/i }));
    expect(openTask).toHaveBeenCalledWith();
  });
});
