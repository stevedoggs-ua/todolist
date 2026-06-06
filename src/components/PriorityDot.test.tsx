import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PriorityDot } from "./PriorityDot";

describe("PriorityDot", () => {
  it("has an accessible label per priority", () => {
    render(<PriorityDot priority={1} />);
    expect(screen.getByLabelText("Пріоритет 1")).toBeInTheDocument();
  });
});
