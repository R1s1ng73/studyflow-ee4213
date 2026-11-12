import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { AcademicProvider, useAcademic } from "@/context/academic-context";
import { TaskList } from "./task-list";
import { TaskTable } from "./task-table";

function Tables() {
  const { isHydrated, state } = useAcademic();
  if (!isHydrated) return null;
  const tasks = state.tasks.slice(0, 1);
  return (
    <>
      <TaskList tasks={tasks} emptyTitle="Empty" emptyMessage="No tasks" />
      <TaskTable tasks={tasks} emptyTitle="Empty" emptyMessage="No tasks" />
    </>
  );
}

describe("responsive task tables", () => {
  beforeEach(() => localStorage.clear());

  it("keeps action headers in normal flow so scroll containers contain wide tables", async () => {
    render(
      <AcademicProvider>
        <Tables />
      </AcademicProvider>,
    );

    const actionHeaders = await screen.findAllByRole("columnheader", { name: "Actions" });
    expect(actionHeaders).toHaveLength(2);
    expect(actionHeaders.every((header) => !header.querySelector(".visually-hidden"))).toBe(true);
  });
});
