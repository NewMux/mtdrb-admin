import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const h = vi.hoisted(() => ({ language: "en" }));
const dict: Record<string, string> = {
  "pricing_page.title": "Pricing",
  "pricing_page.tax_body": "Paddle is the merchant of record",
  "pricing_page.seller": "MTDRB is operated by {{entity}}.",
  "home.refund": "Refund policy",
  "home.terms": "Terms",
  "home.privacy": "Privacy",
  "home.nav_pricing": "Pricing",
  "landing.starter": "Starter",
  "landing.pro": "Pro",
};
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (k: string, o?: { entity?: string }) => (dict[k] ?? k).replace("{{entity}}", o?.entity ?? ""),
    i18n: { language: h.language, changeLanguage: vi.fn() },
  }),
}));
vi.mock("../../components/LanguageSwitcher", () => ({ default: () => null }));

import Pricing from "../Pricing";

describe("Pricing page", () => {
  it("is public, shows both plans with price and currency, and links to the policies", () => {
    render(
      <MemoryRouter initialEntries={["/pricing"]}>
        <Pricing />
      </MemoryRouter>,
    );
    const text = document.body.textContent ?? "";
    expect(text).toContain("Starter");
    expect(text).toContain("Pro");
    expect(text).toContain("49");
    expect(text).toContain("89");
    expect(text).toContain("USD");
    expect(text).toContain("MTDRB is operated by NewMux.");
    const hrefs = Array.from(document.querySelectorAll("a")).map((a) => a.getAttribute("href"));
    for (const path of ["/terms", "/privacy", "/refund", "/signup"]) expect(hrefs).toContain(path);
  });
});
