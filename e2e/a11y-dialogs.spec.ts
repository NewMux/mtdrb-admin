import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { openPage } from "./helpers";

// Opens every "add / new / export / import / schedule / assign / settings" dialog a screen
// offers and scans it with axe. The buttons are discovered, not listed, so a new dialog
// is covered as soon as its opener has a recognisable name.
const SCREENS: Array<{ name: string; path: string; tab?: string }> = [
  { name: "Members", path: "/dashboard/members", tab: "Member List" },
  { name: "Classes", path: "/dashboard/classes" },
  { name: "Trainers", path: "/dashboard/trainers", tab: "Trainer List" },
  { name: "Attendance", path: "/dashboard/attendance" },
  { name: "Billing", path: "/dashboard/billing" },
  { name: "Billing expenses", path: "/dashboard/billing", tab: "Expenses" },
  { name: "Point of sale", path: "/dashboard/pos" },
  { name: "Point of sale inventory", path: "/dashboard/pos", tab: "Inventory" },
  { name: "Plans", path: "/dashboard/plans" },
  { name: "Tasks", path: "/dashboard/tasks" },
  { name: "Branches", path: "/dashboard/branches" },
  { name: "Analytics", path: "/dashboard/analytics" },
];
const OPENER = /^(add|new|export|import|create|schedule|assign|print|share|set)\b/i;

for (const screen of SCREENS) {
  test(`dialogs on ${screen.name}`, async ({ page }) => {
    test.setTimeout(180_000);
    const prepare = async () => {
      await openPage(page, screen.path);
      if (screen.tab) await page.getByText(screen.tab, { exact: true }).first().click();
      await page.waitForTimeout(400);
    };
    await prepare();
    const names = await page
      .getByRole("button")
      .evaluateAll((els) => els.map((e) => (e.getAttribute("aria-label") || e.textContent || "").trim()).filter(Boolean));
    const openers = [...new Set(names.filter((n) => OPENER.test(n) && n.length < 40))];
    const problems: string[] = [];
    for (const name of openers) {
      await prepare();
      const button = page.getByRole("button", { name, exact: true }).first();
      if (!(await button.isVisible()) || !(await button.isEnabled())) continue;
      await button.click();
      await page.waitForTimeout(900);
      const dialog = page.getByRole("dialog");
      if ((await dialog.count()) === 0) continue;
      const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
      for (const v of result.violations) {
        problems.push(`[${name}] ${v.id}: ${v.nodes.slice(0, 2).map((n) => n.html.slice(0, 90)).join(" || ")}`);
      }
    }
    expect(problems).toEqual([]);
  });
}
