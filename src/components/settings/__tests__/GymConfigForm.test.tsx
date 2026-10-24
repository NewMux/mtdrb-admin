import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { guessRegionFromTimezone } from "../../../config/regions";
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
  tax: { enabled: false, components: [{ name: "VAT", rate: 0, compound: false }], number: "", pricesIncludeTax: false },
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
      tax: { ...base.tax, enabled: true, components: [{ name: "VAT", rate: 10, compound: false }] },
    });
  });

  it("a country with no national tax turns tax off rather than inventing a rate", () => {
    const onChange = setup({ ...base, tax: { ...base.tax, enabled: true, components: [{ name: "VAT", rate: 5, compound: false }] } });
    fireEvent.change(screen.getByLabelText("gymConfig.country"), { target: { value: "KW" } });
    expect(onChange.mock.calls[0][0]).toMatchObject({ currency: "KWD", tax: { enabled: false, components: [{ rate: 0 }] } });
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
    const onChange = setup({ ...base, tax: { ...base.tax, enabled: true, components: [{ name: "VAT", rate: 5, compound: false }] } });
    fireEvent.change(screen.getByLabelText("gymConfig.taxRate"), { target: { value: "7." } });
    expect(onChange.mock.calls[0][0].tax.components[0].rate).toBe(7);
    fireEvent.change(screen.getByLabelText("gymConfig.taxRate"), { target: { value: "" } });
    expect(Number.isNaN(onChange.mock.calls[1][0].tax.components[0].rate)).toBe(true);
  });

  it("shows field errors", () => {
    setup({ ...base, tax: { ...base.tax, enabled: true } }, { taxRate0: "tax_rate_invalid", currency: "currency_invalid" });
    expect(screen.getByText("gymConfig.errors.tax_rate_invalid")).toBeInTheDocument();
    expect(screen.getByText("gymConfig.errors.currency_invalid")).toBeInTheDocument();
  });
});

function Stateful({ initial }: { initial: GymConfigInput }) {
  const [value, setValue] = React.useState(initial);
  return <GymConfigForm value={value} onChange={setValue} />;
}

describe("GymConfigForm (controlled by real state)", () => {
  it("lets the rate be cleared and retyped without turning into NaN", () => {
    render(<Stateful initial={{ ...base, tax: { ...base.tax, enabled: true, components: [{ name: "VAT", rate: 5, compound: false }] } }} />);
    const rate = screen.getByLabelText("gymConfig.taxRate") as HTMLInputElement;
    fireEvent.change(rate, { target: { value: "" } });
    expect(rate.value).toBe("");
    fireEvent.change(rate, { target: { value: "7.5" } });
    expect(rate.value).toBe("7.5");
  });

  it("shows the suggested rate after choosing a country", () => {
    render(<Stateful initial={base} />);
    fireEvent.change(screen.getByLabelText("gymConfig.country"), { target: { value: "SA" } });
    expect((screen.getByLabelText("gymConfig.taxRate") as HTMLInputElement).value).toBe("15");
    expect((screen.getByLabelText("gymConfig.currency") as HTMLSelectElement).value).toBe("SAR");
  });
});

describe("guessRegionFromTimezone", () => {
  it("matches an exact timezone only", () => {
    expect(guessRegionFromTimezone("Asia/Bahrain")?.code).toBe("BH");
    expect(guessRegionFromTimezone("Asia/Dubai")?.code).toBe("AE");
    expect(guessRegionFromTimezone("Mars/Base")).toBeNull();
    expect(guessRegionFromTimezone(null)).toBeNull();
  });
});

describe("GymConfigForm with several taxes", () => {
  const withTwo: GymConfigInput = {
    ...base,
    tax: {
      ...base.tax,
      enabled: true,
      components: [
        { name: "Service charge", rate: 10, compound: false },
        { name: "VAT", rate: 10, compound: true },
      ],
    },
  };

  it("lists every tax, shows the combined rate, and offers 'on top' only after the first", () => {
    render(<Stateful initial={withTwo} />);
    expect(screen.getAllByLabelText("gymConfig.taxName")).toHaveLength(2);
    expect(screen.getAllByLabelText("gymConfig.taxCompound")).toHaveLength(1);
    expect(screen.getByText(/gymConfig.taxCombined/)).toHaveTextContent('"rate":21');
  });

  it("adds a tax and removes one", () => {
    render(<Stateful initial={{ ...base, tax: { ...base.tax, enabled: true, components: [{ name: "VAT", rate: 5, compound: false }] } }} />);
    expect(screen.queryByRole("button", { name: /gymConfig.taxRemove/ })).toBeNull(); // the last tax cannot be removed
    fireEvent.click(screen.getByRole("button", { name: "gymConfig.taxAdd" }));
    expect(screen.getAllByLabelText("gymConfig.taxName")).toHaveLength(2);
    fireEvent.click(screen.getAllByRole("button", { name: /gymConfig.taxRemove/ })[1]);
    expect(screen.getAllByLabelText("gymConfig.taxName")).toHaveLength(1);
  });

  it("stops offering more at five", () => {
    const five = Array.from({ length: 5 }, (_, i) => ({ name: `T${i}`, rate: 1, compound: false }));
    render(<Stateful initial={{ ...base, tax: { ...base.tax, enabled: true, components: five } }} />);
    expect(screen.queryByRole("button", { name: "gymConfig.taxAdd" })).toBeNull();
  });

  it("marks a later tax as charged on top", () => {
    const onChange = vi.fn();
    render(<GymConfigForm value={withTwo} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText("gymConfig.taxCompound"));
    expect(onChange.mock.calls[0][0].tax.components[1].compound).toBe(false);
  });
});
