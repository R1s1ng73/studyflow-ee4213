import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { AcademicProvider } from "@/context/academic-context";
import { MyTasksPage } from "./my-tasks-page";

describe("MyTasksPage missing-estimate flow", () => {
  beforeEach(() => localStorage.clear());

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
