import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => (opts?.name ? `${key}:${opts.name}` : key),
  }),
}));

import ExpenseCategoriesEditor from "../ExpenseCategoriesEditor";

const type = (value: string) => fireEvent.change(screen.getByLabelText("expenseCategories.placeholder"), { target: { value } });

describe("ExpenseCategoriesEditor", () => {
  it("adds a trimmed category, by button or Enter", () => {
    const onChange = vi.fn();
    render(<ExpenseCategoriesEditor value={["Towels"]} onChange={onChange} />);
    type("  Spa   day ");
    fireEvent.click(screen.getByRole("button", { name: "expenseCategories.add" }));
    expect(onChange).toHaveBeenLastCalledWith(["Towels", "Spa day"]);
    type("Laundry");
    fireEvent.keyDown(screen.getByLabelText("expenseCategories.placeholder"), { key: "Enter" });
    expect(onChange).toHaveBeenLastCalledWith(["Towels", "Laundry"]);
  });

  it("refuses a standard or repeated name and says why", () => {
    const onChange = vi.fn();
    render(<ExpenseCategoriesEditor value={["Towels"]} onChange={onChange} />);
    type("rent");
    fireEvent.click(screen.getByRole("button", { name: "expenseCategories.add" }));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("gymConfig.errors.category_duplicate");
    type("TOWELS");
    fireEvent.click(screen.getByRole("button", { name: "expenseCategories.add" }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("removes a category", () => {
    const onChange = vi.fn();
    render(<ExpenseCategoriesEditor value={["Towels", "Laundry"]} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "expenseCategories.remove:Towels" }));
    expect(onChange).toHaveBeenCalledWith(["Laundry"]);
  });

  it("shows a save-time error code from the form", () => {
    render(<ExpenseCategoriesEditor value={[]} onChange={vi.fn()} errorCode="category_count" />);
    expect(screen.getByRole("alert")).toHaveTextContent("gymConfig.errors.category_count");
    expect(screen.getByText("expenseCategories.none")).toBeInTheDocument();
  });
});
