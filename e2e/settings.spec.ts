import { expect, test } from "@playwright/test";
import { openPage } from "./helpers";

test.describe("settings: team and roles", () => {
  test("invites a person, moves them to another role and removes them", async ({ page }) => {
    await openPage(page, "/dashboard/settings?tab=team");
    await expect(page.getByRole("heading", { name: /your team|team & roles/i }).first()).toBeVisible();

    await page.getByRole("textbox", { name: /email address/i }).fill("newhire@example.com");
    await page.getByRole("combobox", { name: /^role$/i }).selectOption({ label: "Trainer" });
    await page.getByRole("button", { name: /send invitation/i }).click();

    const row = page.getByRole("listitem").filter({ hasText: "newhire@example.com" });
    await expect(row).toBeVisible();
    await expect(row).toContainText(/invited, not signed in yet/i);

    await row.getByRole("combobox").selectOption({ label: "Employee" });
    await expect(row.getByRole("combobox")).toHaveValue(/employee/);

    page.once("dialog", (dialog) => void dialog.accept());
    await row.getByRole("button", { name: /remove newhire@example\.com/i }).click();
    await expect(row).toHaveCount(0);
  });

  test("your own role cannot be changed or removed here", async ({ page }) => {
    await openPage(page, "/dashboard/settings?tab=team");
    const self = page.getByRole("listitem").filter({ hasText: /\(you\)/i });
    await expect(self.getByRole("combobox")).toBeDisabled();
    await expect(self.getByRole("button")).toHaveCount(0);
  });

  test("creates a custom role from a preset and lists what it can do", async ({ page }) => {
    await openPage(page, "/dashboard/settings?tab=team");
    await page.getByRole("button", { name: /^new role$/i }).click();
    await page.getByRole("button", { name: /^front desk$/i }).click();
    await expect(page.getByRole("textbox", { name: /role name/i })).toHaveValue("Front desk");
    await page.getByRole("textbox", { name: /role name/i }).fill("Weekend desk");
    await expect(page.getByRole("group", { name: /what this role can do/i }).getByRole("checkbox").first()).toBeVisible();
    await page.getByRole("button", { name: /^save role$/i }).click();

    const created = page.locator("li").filter({ has: page.locator("p", { hasText: /^Weekend desk$/ }) });
    await expect(created).toBeVisible();
    await expect(created).toContainText(/employee level/i);

    // The new role is now offered when inviting.
    await expect(page.getByRole("combobox", { name: /^role$/i }).locator("option", { hasText: "Weekend desk" })).toHaveCount(1);
  });

  test("a trainer-level role cannot be given billing management", async ({ page }) => {
    await openPage(page, "/dashboard/settings?tab=team");
    await page.getByRole("button", { name: /^new role$/i }).click();
    await page.getByRole("combobox", { name: /^level$/i }).selectOption("trainer");
    const boxes = page.getByRole("group", { name: /what this role can do/i }).getByRole("checkbox");
    // Trainer level offers only classes and viewing billing.
    await expect(boxes).toHaveCount(2);
  });
});

test.describe("settings: expense categories", () => {
  test("adds and removes an expense category and saves it", async ({ page }) => {
    await openPage(page, "/dashboard/settings?tab=business");
    const input = page.getByRole("textbox", { name: /new category/i });
    await input.fill("Towels");
    await page.getByRole("button", { name: /^add$/i }).click();
    await expect(page.getByRole("button", { name: /remove towels/i })).toBeVisible();

    // Duplicates (including the standard ones) are refused with a message.
    await input.fill("towels");
    await page.getByRole("button", { name: /^add$/i }).click();
    await expect(page.getByRole("alert").filter({ hasText: /.+/ }).first()).toBeVisible();

    await page.getByRole("button", { name: /^save/i }).first().click();
    await expect(page.getByText(/saved/i).first()).toBeVisible();

    await page.getByRole("button", { name: /remove towels/i }).click();
    await expect(page.getByRole("button", { name: /remove towels/i })).toHaveCount(0);
  });
});
