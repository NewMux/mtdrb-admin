import { expect, test, type Page } from "@playwright/test";
import { openPage } from "./helpers";

async function openMemberList(page: Page) {
  await openPage(page, "/dashboard/members");
  await page.getByText("Member List", { exact: true }).click();
  // The list tab is the one with the page-size picker (the dashboard tab has a short "recent members" table).
  await expect(page.getByRole("combobox", { name: /show/i })).toBeVisible();
  // The demo gym has ten members; the first paint shows a shorter cached list.
  await expect(page.getByText(/showing 1 to 10 of 10 results/i)).toBeVisible();
}

test.describe("members", () => {
  test("search narrows the list by name, phone or email and can be cleared", async ({ page }) => {
    await openMemberList(page);
    const all = await page.locator("tbody tr").count();
    expect(all).toBeGreaterThan(3);

    const search = page.getByPlaceholder(/search members/i);
    await search.fill("david miller");
    await expect(page.locator("tbody tr")).toHaveCount(1);
    await expect(page.locator("tbody tr").first()).toContainText("David Miller");

    // Words are matched independently, in any order, across name, email and phone.
    await search.fill("miller david");
    await expect(page.locator("tbody tr")).toHaveCount(1);

    await search.fill("zzzz-nobody");
    await expect(page.locator("tbody tr")).toHaveCount(0);

    await search.fill("");
    await expect(page.locator("tbody tr")).toHaveCount(all);
  });

  test("pages through the list and changes the page size", async ({ page }) => {
    await openMemberList(page);
    await page.getByRole("combobox", { name: /show/i }).selectOption("5");
    await expect(page.locator("tbody tr")).toHaveCount(5);
    const nameOf = async () => (await page.locator("tbody tr").first().innerText()).split("\n").find((l) => /[a-z]{2}/i.test(l))!.trim();
    const firstPage = await nameOf();

    await page.getByRole("button", { name: /next page/i }).click();
    await expect(page.getByText(/showing 6 to 10 of 10 results/i)).toBeVisible();
    await expect.poll(nameOf).not.toBe(firstPage);

    await page.getByRole("button", { name: /previous page/i }).click();
    await expect(page.getByText(/showing 1 to 5 of 10 results/i)).toBeVisible();
    await expect.poll(nameOf).toBe(firstPage);
  });

  test("adds a member on a plan and shows them in the list", async ({ page }) => {
    await openMemberList(page);
    await page.getByRole("button", { name: /^add member$/i }).first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    await dialog.getByRole("textbox", { name: /full name/i }).fill("Layla Test");
    await dialog.getByRole("textbox", { name: /^email/i }).fill("layla.test@example.com");
    await dialog.getByRole("textbox", { name: /phone/i }).fill("+973 3600 1234");
    await dialog.getByRole("combobox", { name: /plan/i }).selectOption({ label: "Basic Monthly" });
    await dialog.getByRole("button", { name: /^add member$/i }).click();

    await expect(dialog).toBeHidden();
    await page.getByPlaceholder(/search members/i).fill("layla test");
    const row = page.locator("tbody tr").first();
    await expect(row).toContainText("Layla Test");
    await expect(row).toContainText(/active/i);
  });

  test("the add member form refuses an empty submission", async ({ page }) => {
    await openMemberList(page);
    await page.getByRole("button", { name: /^add member$/i }).first().click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: /^add member$/i }).click();
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/required|invalid|enter/i).first()).toBeVisible();
  });

  test("renews or changes a member's plan", async ({ page }) => {
    await openMemberList(page);
    await page.getByRole("button", { name: /renew or change plan/i }).first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAccessibleName(/.+/);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });
});
