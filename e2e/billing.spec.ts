import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { openPage } from "./helpers";

test.describe("billing", () => {
  test("creates a paid invoice, adds VAT and lists it", async ({ page }) => {
    await openPage(page, "/dashboard/billing");
    await page.getByRole("button", { name: /add invoice/i }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await page.waitForTimeout(600); // let the open animation finish before measuring colours
    const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    expect(axe.violations.map((v) => `${v.id}: ${v.nodes[0].target.join(" ")}`)).toEqual([]);

    await dialog.getByPlaceholder(/enter invoice title/i).fill("E2E monthly fee");
    await dialog.getByPlaceholder("0.00").first().fill("100");
    await dialog.getByLabel(/category/i).selectOption({ label: "Membership Subscription" });
    await dialog.getByLabel(/client \/ member/i).selectOption({ label: "David Miller" });
    await dialog.getByLabel(/payment method/i).selectOption({ label: "Cash" });
    await dialog.getByLabel(/status/i).selectOption({ label: "Paid" });
    await dialog.getByRole("button", { name: /^add invoice$/i }).click();
    await expect(dialog).toBeHidden();

    // The list refreshes by itself: one more invoice, paid.
    await page.getByText("Invoices", { exact: true }).first().click();
    const row = page.locator("tbody tr").filter({ hasText: "SAR 105.00" }); // 100 plus 5% VAT
    await expect(row).toHaveCount(1);
    await expect(row).toContainText("Paid");
  });

  test("the invoice form will not save without the required details", async ({ page }) => {
    await openPage(page, "/dashboard/billing");
    await page.getByRole("button", { name: /add invoice/i }).click();
    const dialog = page.getByRole("dialog");
    // Nothing can be saved until the required fields are filled in.
    await expect(dialog.getByRole("button", { name: /^add invoice$/i })).toBeDisabled();
    await dialog.getByPlaceholder(/enter invoice title/i).fill("Half done");
    await expect(dialog.getByRole("button", { name: /^add invoice$/i })).toBeDisabled();
  });

  test("records an expense", async ({ page }) => {
    await openPage(page, "/dashboard/billing");
    await page.getByText("Expenses", { exact: true }).first().click();
    await page.getByRole("button", { name: /add expense/i }).first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await page.waitForTimeout(600); // let the open animation finish before measuring colours
    const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    expect(axe.violations.map((v) => `${v.id}: ${v.nodes[0].target.join(" ")}`)).toEqual([]);

    await dialog.getByPlaceholder(/title|expense/i).first().fill("E2E towels");
    await dialog.getByPlaceholder("0.00").first().fill("40");
    await dialog.getByLabel(/category/i).selectOption({ index: 1 });
    await dialog.getByLabel(/payment method/i).selectOption({ index: 1 });
    await dialog.getByLabel(/status/i).selectOption({ index: 1 });
    await dialog.getByRole("button", { name: /^add expense$/i }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByText(/expense (added|created|saved)/i).first()).toBeVisible();
  });
});
