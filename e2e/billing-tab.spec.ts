import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { openPage, useAppearance, useDemoPlan, type Lang, type Theme } from "./helpers";

// Settings -> Billing for a gym with a self-service subscription: the plan, the card
// on file and the invoices. Runs on every project, so the phone and tablet layouts
// are checked too.
const CASES: Array<[Theme, Lang]> = [
  ["light", "en"],
  ["dark", "en"],
  ["light", "ar"],
];

for (const [theme, lang] of CASES) {
  test(`billing tab shows plan, card and invoices (${theme}, ${lang})`, async ({ page }) => {
    await useAppearance(page, theme, lang);
    await useDemoPlan(page, "starter");
    await openPage(page, "/dashboard/settings?tab=billing");

    const main = page.getByRole("main");
    await expect(main.getByRole("link", { name: /(update payment method|تحديث وسيلة الدفع)/i })).toBeVisible();
    await expect(main.getByText(lang === "en" ? "Visa ending 4242" : /4242/)).toBeVisible();
    await expect(main.getByRole("table")).toBeVisible();
    await expect(main.getByRole("row")).toHaveCount(4); // header + three invoices

    // Nothing sticks out sideways; the invoice table scrolls inside its own wrapper.
    const sideways = await page.evaluate(() => {
      const m = document.querySelector("main");
      return Math.max(document.documentElement.scrollWidth - document.documentElement.clientWidth, m ? m.scrollWidth - m.clientWidth : 0);
    });
    expect(sideways).toBeLessThanOrEqual(1);

    await page.waitForTimeout(400);
    const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    expect(axe.violations.map((v) => `${v.id}: ${v.nodes[0].target.join(" ")}`)).toEqual([]);
  });
}

test("the billing tab has no dead buttons: every action does something", async ({ page }) => {
  await useDemoPlan(page, "starter");
  await openPage(page, "/dashboard/settings?tab=billing");
  const main = page.getByRole("main");

  // The card is changed on the payment provider's own page, in a new tab.
  const update = main.getByRole("link", { name: /update payment method/i });
  await expect(update).toHaveAttribute("target", "_blank");
  await expect(update).toHaveAttribute("href", /^https:\/\//);

  // The old "Manage plan" / "Upgrade" buttons that led back to the dashboard are gone.
  await expect(main.getByRole("button", { name: /manage plan/i })).toHaveCount(0);
  await expect(main.getByRole("button", { name: /^upgrade$/i })).toHaveCount(0);

  // Upgrading opens the upgrade dialog; adding locations goes to Branches.
  await main.getByRole("button", { name: /upgrade to pro/i }).click();
  await expect(page.getByRole("dialog").getByText(/charged to your card today/i)).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: /^cancel$/i }).click();
  await main.getByRole("link", { name: /add locations/i }).click();
  await expect(page).toHaveURL(/\/dashboard\/branches/);
});

test("a gym on Pro sees its plan and card but no upgrade button", async ({ page }) => {
  await useDemoPlan(page, "pro");
  await openPage(page, "/dashboard/settings?tab=billing");
  const main = page.getByRole("main");
  await expect(main.getByRole("heading", { name: "Pro plan" })).toBeVisible();
  await expect(main.getByText("Visa ending 4242")).toBeVisible();
  await expect(main.getByRole("button", { name: /upgrade/i })).toHaveCount(0);
});
