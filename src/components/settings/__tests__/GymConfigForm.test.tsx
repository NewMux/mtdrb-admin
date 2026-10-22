import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import GymConfigForm from "../GymConfigForm";
import type { GymConfigInput } from "../../../config/gymConfig";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => (opts ? `${key} ${JSON.stringify(opts)}` : key),
    i18n: { language: "en" },
  }),
}));

const base: GymConfigInput = {
  country: "",
  currency: "USD",
  timezone: "UTC",
  tax: { enabled: false, name: "VAT", rate: 0, number: "", pricesIncludeTax: false },
  business: { legalName: "", address: "", phone: "", email: "", website: "" },
};

function setup(value: GymConfigInput = base, errors = {}) {
  const onChange = vi.fn();
  render(<GymConfigForm value={value} onChange={onChange} errors={errors} />);
  return onChange;
}

describe("GymConfigForm", () => {
  it("choosing a country suggests currency, timezone and tax (all still editable)", () => {
    const onChange = setup();
    fireEvent.change(screen.getByLabelText("gymConfig.country"), { target: { value: "BH" } });
    expect(onChange).toHaveBeenCalledWith({
      ...base,
      country: "BH",
      currency: "BHD",
      timezone: "Asia/Bahrain",
      tax: { ...base.tax, enabled: true, name: "VAT", rate: 10 },
    });
  });

  it("a country with no national tax turns tax off rather than inventing a rate", () => {
    const onChange = setup({ ...base, tax: { ...base.tax, enabled: true, rate: 5 } });
    fireEvent.change(screen.getByLabelText("gymConfig.country"), { target: { value: "KW" } });
    expect(onChange.mock.calls[0][0]).toMatchObject({ currency: "KWD", tax: { enabled: false, rate: 0 } });
  });

  it("choosing 'other' keeps what the owner already entered", () => {
    const onChange = setup({ ...base, country: "BH", currency: "BHD" });
    fireEvent.change(screen.getByLabelText("gymConfig.country"), { target: { value: "" } });
    expect(onChange).toHaveBeenCalledWith({ ...base, country: "", currency: "BHD" });
  });

  it("hides the tax fields until tax is switched on", () => {
    setup();
    expect(screen.queryByLabelText("gymConfig.taxRate")).toBeNull();
  });

  it("edits the rate as typed, including a trailing decimal point", () => {
    const onChange = setup({ ...base, tax: { ...base.tax, enabled: true, rate: 5 } });
    fireEvent.change(screen.getByLabelText("gymConfig.taxRate"), { target: { value: "7." } });
    expect(onChange.mock.calls[0][0].tax.rate).toBe(7);
    fireEvent.change(screen.getByLabelText("gymConfig.taxRate"), { target: { value: "" } });
    expect(Number.isNaN(onChange.mock.calls[1][0].tax.rate)).toBe(true);
  });

  it("shows field errors", () => {
    setup({ ...base, tax: { ...base.tax, enabled: true } }, { taxRate: "tax_rate_invalid", currency: "currency_invalid" });
    expect(screen.getByText("gymConfig.errors.tax_rate_invalid")).toBeInTheDocument();
    expect(screen.getByText("gymConfig.errors.currency_invalid")).toBeInTheDocument();
  });
});
