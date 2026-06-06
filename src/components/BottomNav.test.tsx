import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BottomNav } from "./BottomNav";

vi.mock("next/navigation", () => ({ usePathname: () => "/today" }));

describe("BottomNav", () => {
  it("renders all destinations plus the capture action", () => {
    render(<BottomNav />);
    ["Сьогодні", "Згодом", "Inbox", "Проєкти"].forEach((t) =>
      expect(screen.getByText(t)).toBeInTheDocument());
    expect(screen.getByRole("link", { name: /Capture/ })).toBeInTheDocument();
  });
  it("marks the current tab", () => {
    render(<BottomNav />);
    expect(screen.getByRole("link", { name: /Сьогодні/ })).toHaveAttribute("aria-current", "page");
  });
});
