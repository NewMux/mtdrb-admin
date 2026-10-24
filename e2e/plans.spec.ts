import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { openPage, useDemoPlan } from "./helpers";

// Analytics is part of Pro and above; Starter does not get the screen or the
// Analytics tabs inside other screens.
test.describe("Starter plan", () => {
  test.beforeEach(async ({ page }) => {
    await useDemoPlan(page, "starter");
  });

  test("has no Analytics item in the sidebar", async ({ page }) => {
    await openPage(page, "/dashboard");
    await expect(page.getByRole("navigation").getByRole("link", { name: /^members$/i })).toBeVisible();
    await expect(page.getByRole("navigation").getByRole("link", { name: /analytics/i })).toHaveCount(0);
  });

  test("sees an upgrade explanation instead of the Analytics screen", async ({ page }) => {
    await openPage(page, "/dashboard/analytics");
    await expect(page.getByRole("heading", { name: /analytics is part of the pro plan/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /see your plan/i })).toBeVisible();
    const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    expect(axe.violations.map((v) => `${v.id}: ${v.nodes[0].target.join(" ")}`)).toEqual([]);
  });

  test("has no Analytics tab on the dashboard, members, trainers, billing or tasks screens", async ({ page }) => {
    for (const path of ["/dashboard", "/dashboard/members", "/dashboard/trainers", "/dashboard/billing", "/dashboard/tasks"]) {
      await openPage(page, path);
      await expect(page.getByRole("main").getByText(/^analytics$/i), path).toHaveCount(0);
    }
  });
});

test.describe("Pro plan", () => {
  test.beforeEach(async ({ page }) => {
    await useDemoPlan(page, "pro");
  });

  test("keeps the Analytics screen and its sidebar item", async ({ page }) => {
    await openPage(page, "/dashboard/analytics");
    await expect(page.getByRole("heading", { name: /analytics is part of the pro plan/i })).toHaveCount(0);
    await expect(page.getByRole("navigation").getByRole("link", { name: /analytics/i })).toBeVisible();
  });

  test("keeps the Analytics tab on the members screen", async ({ page }) => {
    await openPage(page, "/dashboard/members");
    await expect(page.getByRole("main").getByText(/^analytics$/i).first()).toBeVisible();
  });
});
