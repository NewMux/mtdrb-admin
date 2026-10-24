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
    await expect(page.getByRole("link", { name: /upgrade to pro/i })).toBeVisible();
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

test.describe("Upgrading from Starter to Pro", () => {
  test.beforeEach(async ({ page }) => {
    await useDemoPlan(page, "starter");
  });

  test("shows the price first, then unlocks Analytics without a reload", async ({ page }) => {
    await openPage(page, "/dashboard/analytics");
    await page.getByRole("link", { name: /upgrade to pro/i }).click();

    // The link opens the upgrade on the billing tab, with the cost spelled out before anything is paid.
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText(/charged to your card today/i)).toBeVisible();
    await expect(dialog.getByText(/per month, before tax/i)).toBeVisible();
    await page.waitForTimeout(900); // let the dialog finish animating in before measuring contrast
    const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    expect(axe.violations.map((v) => `${v.id}: ${v.nodes[0].target.join(" ")}`)).toEqual([]);

    await dialog.getByRole("button", { name: /upgrade and pay/i }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByText(/^pro plan$/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /upgrade to pro/i })).toHaveCount(0);

    // Same page session: the sidebar and the screen now follow the new plan.
    await page.getByRole("navigation").getByRole("link", { name: /analytics/i }).click();
    await expect(page.getByRole("heading", { name: /analytics is part of the pro plan/i })).toHaveCount(0);
  });

  test("the billing tab offers the upgrade to a Starter gym only", async ({ page }) => {
    await openPage(page, "/dashboard/settings?tab=billing");
    await expect(page.getByRole("button", { name: /upgrade to pro/i })).toBeVisible();
    await page.getByRole("button", { name: /upgrade to pro/i }).click();
    await expect(page.getByRole("dialog").getByRole("button", { name: /upgrade and pay/i })).toBeEnabled();
    await page.getByRole("dialog").getByRole("button", { name: /^cancel$/i }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
  });
});

test("a Pro gym is not offered the upgrade", async ({ page }) => {
  await useDemoPlan(page, "pro");
  await openPage(page, "/dashboard/settings?tab=billing");
  await expect(page.getByText(/^pro plan$/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /upgrade to pro/i })).toHaveCount(0);
});
