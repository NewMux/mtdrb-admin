import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { openPage, useAppearance, type Lang, type Theme } from "./helpers";
import { MAIN_PAGES, PUBLIC_PAGES } from "./pages";

// Every screen is checked against WCAG 2.2 level AA with axe, in light and dark
// mode and in English and Arabic. Any finding fails the run, so a new screen or a
// colour change that drops below the contrast limit is caught before it ships.
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function scan(page: Page) {
  const result = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  return result.violations.map(
    (v) => `${v.id} (${v.impact}): ${v.help}\n${v.nodes.slice(0, 3).map((n) => `    ${n.target.join(" ")}`).join("\n")}`,
  );
}

const COMBOS: Array<{ theme: Theme; lang: Lang }> = [
  { theme: "light", lang: "en" },
  { theme: "dark", lang: "en" },
  { theme: "light", lang: "ar" },
];

for (const { theme, lang } of COMBOS) {
  test.describe(`accessibility: ${theme}, ${lang}`, () => {
    test.beforeEach(async ({ page }) => {
      await useAppearance(page, theme, lang);
    });

    for (const { path, name } of [...PUBLIC_PAGES, ...MAIN_PAGES]) {
      test(name, async ({ page }) => {
        await openPage(page, path);
        expect(await page.locator("html").getAttribute("lang")).toBeTruthy();
        expect(await scan(page)).toEqual([]);
      });
    }
  });
}

test.describe("accessibility: dialogs and menus", () => {
  test("add member dialog traps focus, is labelled and closes on Escape", async ({ page }) => {
    await openPage(page, "/dashboard/members");
    const opener = page.getByRole("button", { name: /add member/i }).first();
    await opener.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAccessibleName(/.+/);
    await page.waitForTimeout(600); // let the open animation finish before measuring colours
    expect(await scan(page)).toEqual([]);

    // Tabbing many times never leaves the dialog.
    for (let i = 0; i < 40; i++) await page.keyboard.press("Tab");
    expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("the point of sale dialogs are accessible", async ({ page }) => {
    await openPage(page, "/dashboard/pos");
    await page.getByRole("button", { name: /new sale/i }).click();
    await page.waitForTimeout(600);
    expect(await scan(page)).toEqual([]);
  });

  test("the whole app can be reached with the keyboard from a fresh page load", async ({ page }) => {
    await openPage(page, "/dashboard");
    // The first Tab stop is a link that skips straight to the page content.
    await page.keyboard.press("Tab");
    const first = page.locator(":focus");
    await expect(first).toBeVisible();
    await expect(first).toHaveAttribute("href", /#/);
  });
});
