import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { openPage } from "./helpers";

test.describe("point of sale", () => {
  test("creates a product, sells it with a discount and completes checkout", async ({ page }) => {
    await openPage(page, "/dashboard/pos");

    await page.getByText("Inventory", { exact: true }).click();
    await page.getByRole("button", { name: /add product/i }).first().click();
    const form = page.getByRole("dialog");
    await expect(form).toBeVisible();
    await page.waitForTimeout(600); // let the open animation finish before measuring colours
    const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    expect(axe.violations.map((v) => `${v.id}: ${v.nodes[0].target.join(" ")}`)).toEqual([]);

    await form.getByLabel(/product name/i).fill("Protein shake");
    await form.getByLabel(/^sku/i).fill("SHAKE-E2E");
    await form.getByLabel(/selling price/i).fill("2.500");
    await form.getByLabel(/opening stock/i).fill("20");
    await form.getByRole("button", { name: /create product/i }).click();
    await expect(form).toBeHidden();

    await page.getByText("Checkout", { exact: true }).click();
    await page.getByRole("button", { name: /add: protein shake/i }).click();
    await page.getByRole("button", { name: /increase quantity of protein shake/i }).click();

    // 2 x 2.500 = 5.000, less a 0.500 discount, plus 5% VAT on what is left (0.225 -> 0.23).
    const cart = page.locator("aside");
    await page.getByRole("spinbutton", { name: /discount/i }).fill("0.5");
    await expect(cart).toContainText("Subtotal");
    await expect(cart.getByText("SAR 4.73")).toBeVisible();
    await page.getByRole("button", { name: /proceed to checkout/i }).click();

    const checkout = page.getByRole("dialog");
    await expect(checkout).toContainText("Protein shake × 2");
    await checkout.getByRole("button", { name: /complete sar 4\.73/i }).click();

    const receipt = page.getByRole("dialog");
    await expect(receipt).toContainText("Payment recorded");
    await expect(receipt).toContainText("SAR 4.73");
    await receipt.getByRole("button", { name: /^close$/i }).first().click();
    await expect(receipt).toBeHidden();

    // The sale took two units out of the twenty in stock.
    await page.getByText("Inventory", { exact: true }).click();
    await expect(page.getByRole("row", { name: /protein shake/i })).toContainText("18");
  });

  test("the cart never holds more than is in stock", async ({ page }) => {
    await openPage(page, "/dashboard/pos");
    await page.getByText("Inventory", { exact: true }).click();
    await page.getByRole("button", { name: /add product/i }).first().click();
    const form = page.getByRole("dialog");
    await form.getByLabel(/product name/i).fill("Water");
    await form.getByLabel(/^sku/i).fill("WATER-E2E");
    await form.getByLabel(/selling price/i).fill("1");
    await form.getByLabel(/opening stock/i).fill("1");
    await form.getByRole("button", { name: /create product/i }).click();
    await expect(form).toBeHidden();

    await page.getByText("Checkout", { exact: true }).click();
    await page.getByRole("button", { name: /add: water/i }).click();
    await page.getByRole("button", { name: /increase quantity of water/i }).click();
    // One in stock: the second click changes nothing.
    await expect(page.locator("aside").getByText("SAR 1.00").first()).toBeVisible();
    await expect(page.locator("aside")).not.toContainText("SAR 2.00");
  });
});
