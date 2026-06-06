import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BottomNav } from "./BottomNav";

vi.mock("next/navigation", () => ({ usePathname: () => "/today" }));

describe("BottomNav", () => {
  it("renders the four tabs", () => {
    render(<BottomNav />);
    ["Capture", "Today", "Upcoming", "Inbox"].forEach((t) =>
      expect(screen.getByText(t)).toBeInTheDocument());
  });
  it("marks current tab", () => {
    render(<BottomNav />);
    expect(screen.getByRole("link", { name: /Today/ })).toHaveAttribute("aria-current", "page");
  });
});
