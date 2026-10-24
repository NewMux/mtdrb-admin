import { expect, test } from "@playwright/test";
import { openPage, useAppearance } from "./helpers";

test.describe("public pages", () => {
  test("the landing page leads to sign up and to the legal pages", async ({ page }) => {
    await openPage(page, "/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.getByRole("link", { name: /get started/i }).first().click();
    await expect(page).toHaveURL(/\/signup/);
  });

  test("the legal pages are reachable and readable", async ({ page }) => {
    for (const [path, heading] of [["/terms", /terms/i], ["/privacy", /privacy/i], ["/refund", /refund/i]] as const) {
      await openPage(page, path);
      await expect(page.getByRole("heading", { level: 1 })).toContainText(heading);
    }
  });

  test("an unknown address shows the not-found page with a way back", async ({ page }) => {
    await openPage(page, "/this-page-does-not-exist");
    await expect(page.getByRole("heading").first()).toBeVisible();
    await expect(page.getByRole("link").first()).toBeVisible();
  });
});

test.describe("language and appearance", () => {
  test("switching to Arabic flips the page to right-to-left and is remembered", async ({ page }) => {
    await openPage(page, "/");
    await page.getByRole("button", { name: /العربية/ }).first().click();
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");

    await page.reload({ waitUntil: "networkidle" });
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    expect(await page.evaluate(() => localStorage.getItem("i18nextLng"))).toBe("ar");

    await page.getByRole("button", { name: /^EN/ }).first().click();
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  });

  test("the signed-in app lays out right-to-left in Arabic", async ({ page }) => {
    await useAppearance(page, "light", "ar");
    await openPage(page, "/dashboard/members");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    // The sidebar sits on the right edge in right-to-left.
    const box = await page.locator("aside, nav").first().boundingBox();
    const width = page.viewportSize()!.width;
    expect(box!.x + box!.width).toBeGreaterThan(width / 2);
  });

  test("dark mode toggles from the top bar and is remembered", async ({ page }) => {
    await openPage(page, "/dashboard");
    await expect(page.locator("html")).not.toHaveClass(/dark/);
    await page.getByRole("button", { name: /switch to dark mode/i }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.locator("html")).toHaveClass(/dark/);
    await page.getByRole("button", { name: /switch to light mode/i }).click();
    await expect(page.locator("html")).not.toHaveClass(/dark/);
  });
});

test.describe("navigation", () => {
  test("every sidebar entry opens its page", async ({ page }) => {
    await openPage(page, "/dashboard");
    const nav = page.getByRole("navigation").first();
    const links = await nav.getByRole("link").evaluateAll((els) => els.map((el) => (el as HTMLAnchorElement).getAttribute("href")));
    expect(links.length).toBeGreaterThan(6);
    for (const href of links) {
      if (!href || !href.startsWith("/dashboard")) continue;
      await page.goto(href, { waitUntil: "networkidle" });
      await expect(page.getByRole("main")).toBeVisible();
      await expect(page.getByRole("main").getByRole("heading").first()).toBeVisible();
    }
  });

  test("the skip link jumps to the main content", async ({ page }) => {
    await openPage(page, "/dashboard");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: /skip to main content/i });
    await expect(skip).toBeFocused();
    await skip.press("Enter");
    await expect(page.getByRole("main")).toBeFocused();
  });
});

test.describe("owner console", () => {
  test("lists the gyms", async ({ page }) => {
    await openPage(page, "/superadmin/tenants");
    await expect(page.getByRole("main")).toBeVisible();
    await expect(page.locator("tbody tr").first()).toBeVisible();
  });
});
