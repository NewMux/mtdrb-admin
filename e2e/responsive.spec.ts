import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { openPage, useAppearance, type Lang } from "./helpers";
import { MAIN_PAGES, PUBLIC_PAGES } from "./pages";

// Runs on the phone (Pixel 5, 393 px) and tablet (768 px) projects. A screen must
// fit the width without sideways scrolling, and everything tappable must be big
// enough to hit (WCAG 2.2 target size, checked by axe).
const LANGS: Lang[] = ["en", "ar"];

for (const lang of LANGS) for (const { path, name } of [...PUBLIC_PAGES, ...MAIN_PAGES]) {
  test(`${name} fits the screen (${lang})`, async ({ page }) => {
    await useAppearance(page, "light", lang);
    await openPage(page, path);
    const overflow = await page.evaluate(() => {
      const width = document.documentElement.clientWidth;
      const offenders: string[] = [];
      for (const el of Array.from(document.body.querySelectorAll<HTMLElement>("*"))) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        // Anything inside an intentional scroller (tables, tab bars) is allowed to be wider.
        let scroller = el.parentElement;
        let inside = false;
        while (scroller && scroller !== document.body && scroller.tagName !== "MAIN") {
          const o = getComputedStyle(scroller).overflowX;
          if (o === "auto" || o === "scroll") { inside = true; break; }
          scroller = scroller.parentElement;
        }
        if (!inside && (r.right > width + 1 || r.left < -1)) {
          offenders.push(`${el.tagName.toLowerCase()}.${String(el.className).split(" ").slice(0, 3).join(".")}`);
        }
      }
      // <main> is the app's scrolling pane: it may scroll down, never sideways.
      const main = document.querySelector("main");
      const mainScroll = main ? main.scrollWidth - main.clientWidth : 0;
      return { pageScroll: Math.max(document.documentElement.scrollWidth - width, mainScroll), offenders: offenders.slice(0, 5) };
    });
    expect(overflow.pageScroll, `page scrolls sideways; offenders: ${overflow.offenders.join(", ")}`).toBeLessThanOrEqual(1);
    expect(overflow.offenders).toEqual([]);

    const result = await new AxeBuilder({ page }).withRules(["target-size", "color-contrast"]).analyze();
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`)).toEqual([]);
  });
}

test("the menu button opens the navigation and a link closes it", async ({ page, viewport }) => {
  test.skip(!viewport || viewport.width >= 1024, "the sidebar is always visible on wide screens");
  await openPage(page, "/dashboard");
  await page.getByRole("button", { name: /toggle menu/i }).click();
  const nav = page.getByRole("navigation").last();
  await expect(nav).toBeVisible();
  await nav.getByRole("link", { name: /members/i }).first().click();
  await expect(page).toHaveURL(/\/dashboard\/members/);
  await expect(page.getByRole("button", { name: /toggle menu/i })).toBeVisible();
});
