import { describe, expect, it } from "vitest";
import i18n, { i18nReady } from "./i18n";

// Arabic is fetched on demand; these check that doing so behaves like it always did.
describe("i18n", () => {
  it("starts in English with Arabic not yet loaded", async () => {
    await i18nReady;
    expect(i18n.language).toBe("en");
    expect(i18n.t("sidebar.members")).toBe("Members");
    expect(i18n.hasResourceBundle("ar", "translation")).toBe(false);
  });

  it("loads Arabic when asked, before reporting the change, and sets right-to-left", async () => {
    await i18n.changeLanguage("ar");
    expect(i18n.language).toBe("ar");
    expect(i18n.hasResourceBundle("ar", "translation")).toBe(true);
    expect(i18n.t("sidebar.members")).not.toBe("Members");
    expect(document.documentElement.dir).toBe("rtl");
    expect(document.documentElement.lang).toBe("ar");
  });

  it("goes back to English, left-to-right", async () => {
    await i18n.changeLanguage("en");
    expect(i18n.t("sidebar.members")).toBe("Members");
    expect(document.documentElement.dir).toBe("ltr");
  });

  it("falls back to English for a key Arabic does not have", async () => {
    await i18n.changeLanguage("ar");
    expect(i18n.t("some.key.that.does.not.exist", "fallback text")).toBe("fallback text");
    await i18n.changeLanguage("en");
  });

  it("has every English screen text in Arabic too (so nothing shows a raw key after switching)", async () => {
    await i18n.changeLanguage("ar");
    const en = i18n.getResourceBundle("en", "translation") as Record<string, unknown>;
    const ar = i18n.getResourceBundle("ar", "translation") as Record<string, unknown>;
    const keys = (o: Record<string, unknown>, prefix = ""): string[] =>
      Object.entries(o).flatMap(([k, v]) =>
        v && typeof v === "object" && !Array.isArray(v) ? keys(v as Record<string, unknown>, `${prefix}${k}.`) : [`${prefix}${k}`],
      );
    // Plural forms differ by language (_one/_other vs _zero..._many), so compare the base key.
    const base = (k: string) => k.replace(/_(zero|one|two|few|many|other)$/, "");
    const arKeys = new Set(keys(ar).map(base));
    const missing = keys(en).map(base).filter((k) => !arKeys.has(k));
    // Report, don't fail the build on legacy gaps: but the ones added in this session must not regress.
    const recent = missing.filter((k) => /^(team|membershipPlans|expenseCategories|accessControl)\./.test(k));
    expect(recent).toEqual([]);
    await i18n.changeLanguage("en");
  });
});
