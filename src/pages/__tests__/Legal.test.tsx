import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const h = vi.hoisted(() => ({ language: "en" }));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: h.language, changeLanguage: vi.fn() } }),
}));
vi.mock("../../components/LanguageSwitcher", () => ({ default: () => null }));
vi.mock("../../hooks/useRTL", () => ({ useRTL: () => ({ isRTL: h.language === "ar" }) }));

import Legal from "../Legal";

const page = (path: string, tab: "terms" | "privacy" | "refund") =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Legal initialTab={tab} />
    </MemoryRouter>,
  );

describe("Legal pages", () => {
  it("privacy: names the real processors, the deletion tools and what is kept", () => {
    h.language = "en";
    page("/privacy", "privacy");
    const text = document.body.textContent ?? "";
    for (const provider of ["Supabase", "Vercel", "Paddle", "Cloudflare Turnstile"]) expect(text).toContain(provider);
    expect(text).toContain("Settings → Data & privacy");
    expect(text).toMatch(/controller/);
    expect(text).toMatch(/anonymous record/);
    expect(text).toMatch(/do not use advertising cookies/);
    expect(text).toMatch(/GDPR/);
  });

  it("refund: no longer names a payment gateway the product does not use", () => {
    h.language = "en";
    page("/refund", "refund");
    const text = document.body.textContent ?? "";
    expect(text).not.toMatch(/Tap Payments/);
    expect(text).toMatch(/Paddle/);
    expect(text).toMatch(/cancelled immediately/);
  });

  it("terms: covers sales tax responsibility, account deletion and taxes at checkout", () => {
    h.language = "en";
    page("/terms", "terms");
    const text = document.body.textContent ?? "";
    expect(text).toMatch(/not tax advice/);
    expect(text).toMatch(/Deleting Your Account/);
    expect(text).toMatch(/collected at checkout by our payment provider, Paddle/);
    expect(text).toMatch(/7\. Governing Law/);
  });

  it("the Arabic versions carry the same sections", () => {
    h.language = "ar";
    page("/privacy", "privacy");
    const text = document.body.textContent ?? "";
    for (const provider of ["Supabase", "Vercel", "Paddle", "Cloudflare Turnstile"]) expect(text).toContain(provider);
    expect(text).toContain("الإعدادات ← البيانات والخصوصية");
    expect(text).toContain("9. التواصل");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("سياسة الخصوصية");
  });
});
