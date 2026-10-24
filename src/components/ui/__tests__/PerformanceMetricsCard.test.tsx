import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import "../../../i18n";
import PerformanceMetricsCard from "../PerformanceMetricsCard";

const base = { target: 100, trend: "stable" as const };

describe("PerformanceMetricsCard", () => {
  it("shows the previous value and the change when there is something to compare", () => {
    render(<PerformanceMetricsCard metrics={[{ ...base, name: "Active members", current: 120, previous: 100, format: "number" }]} />);
    expect(screen.getByText(/previous: 100/i)).toBeInTheDocument();
    expect(screen.getByText("+20")).toBeInTheDocument();
  });

  it("says there is nothing to compare instead of inventing a previous value (or showing zero)", () => {
    render(<PerformanceMetricsCard metrics={[{ ...base, name: "Retention", current: 80, previous: null, format: "percentage" }]} />);
    expect(screen.getByText(/no earlier period to compare/i)).toBeInTheDocument();
    expect(screen.queryByText(/previous:/i)).toBeNull();
  });

  it("a genuine previous value of zero is still a comparison", () => {
    render(<PerformanceMetricsCard metrics={[{ ...base, name: "Revenue", current: 50, previous: 0, format: "number" }]} />);
    expect(screen.getByText(/previous: 0/i)).toBeInTheDocument();
    expect(screen.queryByText(/no earlier period/i)).toBeNull();
  });

  it("formats money in the gym's currency with its own decimals, not a hard-coded dollar sign", () => {
    render(<PerformanceMetricsCard currency="BHD" metrics={[{ ...base, name: "Revenue", current: 1234.5, previous: 1000.125, target: 5000, format: "currency" }]} />);
    const text = document.body.textContent ?? "";
    expect(text).not.toContain("$");
    expect(text).toMatch(/BHD|BD/);
    expect(text).toContain("1,000.125");
  });

  it("with no target set it shows no target pill, no progress and no 0% - and still shows the value", () => {
    render(<PerformanceMetricsCard metrics={[{ ...base, name: "Active members", current: 120, previous: 100, target: null, format: "number" }]} />);
    expect(screen.getByText("120")).toBeInTheDocument();
    expect(screen.queryByText(/target:/i)).toBeNull();
    expect(screen.queryByText(/progress/i)).toBeNull();
    expect(screen.queryByText(/NaN|Infinity/)).toBeNull();
  });

  it("with a target it shows the target and the progress towards it", () => {
    render(<PerformanceMetricsCard metrics={[{ ...base, name: "Active members", current: 50, previous: 40, target: 200, format: "number" }]} />);
    expect(screen.getByText(/target: 200/i)).toBeInTheDocument();
    expect(screen.getByText("25%")).toBeInTheDocument();
  });
});
