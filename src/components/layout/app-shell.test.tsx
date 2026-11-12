import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppShell } from "./app-shell";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));
vi.mock("next/link", () => ({
  default: function MockLink({ children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { children: ReactNode }) {
    return <a {...props}>{children}</a>;
  },
}));
vi.mock("@/context/academic-context", () => ({
  useAcademic: () => ({
    isHydrated: true,
    recoveryNotice: "",
    openTask: vi.fn(),
    resetDemoData: vi.fn(),
  }),
}));
vi.mock("@/components/tasks/task-modal", () => ({ TaskModal: () => null }));
vi.mock("@/components/ui/toast", () => ({ Toast: () => null }));

afterEach(cleanup);

describe("AppShell mobile navigation", () => {
  it("focuses and contains the drawer while isolating the page, then restores on Escape", async () => {
    const user = userEvent.setup();
    render(
      <AppShell>
        <main>Academic dashboard</main>
      </AppShell>,
    );
    const opener = screen.getByRole("button", { name: "Open navigation" });

    await user.click(opener);

    const drawer = screen.getByRole("dialog", { name: "Navigation menu" });
    const close = screen.getByRole("button", { name: "Close navigation" });
    const reset = screen.getAllByRole("button", { name: "Reset demo data" }).at(-1)!;
    await waitFor(() => expect(close).toHaveFocus());
    expect(drawer).toBeVisible();
    expect(screen.getByText("Academic dashboard").closest(".study-page-wrapper")).toHaveAttribute(
      "inert",
    );
    expect(screen.getByText("Academic dashboard").closest(".study-page-wrapper")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    expect(document.body).toHaveStyle({ overflow: "hidden" });

    await user.keyboard("{Shift>}{Tab}{/Shift}");
    expect(reset).toHaveFocus();
    await user.tab();
    expect(close).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Navigation menu" })).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
    expect(screen.getByText("Academic dashboard").closest(".study-page-wrapper")).not.toHaveAttribute(
      "inert",
    );
    expect(document.body).not.toHaveStyle({ overflow: "hidden" });
  });
});
