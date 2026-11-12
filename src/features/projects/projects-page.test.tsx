import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { AcademicProvider } from "@/context/academic-context";
import { ProjectsPage } from "./projects-page";

describe("ProjectsPage", () => {
  beforeEach(() => localStorage.clear());

  it("provides the route heading and primary add-task action", async () => {
    render(
      <AcademicProvider>
        <ProjectsPage />
      </AcademicProvider>,
    );

    expect(await screen.findByRole("heading", { level: 1, name: "Group Projects" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Add task" })).toBeVisible();
  });

  it("keeps the actions header in normal table flow for mobile overflow containment", async () => {
    render(
      <AcademicProvider>
        <ProjectsPage />
      </AcademicProvider>,
    );

    const actionsHeader = await screen.findByRole("columnheader", { name: "Actions" });
    expect(actionsHeader.querySelector(".visually-hidden")).toBeNull();
  });
});
