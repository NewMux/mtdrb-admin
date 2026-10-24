import type { Page } from "@playwright/test";

export type Theme = "light" | "dark";
export type Lang = "en" | "ar";

/** Sets the saved theme and language before the app boots (the way a returning user has them). */
export async function useAppearance(page: Page, theme: Theme = "light", lang: Lang = "en") {
  await page.addInitScript(
    ([t, l]) => {
      try {
        localStorage.setItem("theme", t);
        localStorage.setItem("i18nextLng", l);
      } catch {
        // storage unavailable: the defaults apply
      }
    },
    [theme, lang],
  );
}

/** Opens a screen and waits until it has stopped loading. */
export async function openPage(page: Page, path: string) {
  await page.goto(path, { waitUntil: "networkidle" });
  // Lazy chunks and entrance animations settle shortly after the network goes quiet.
  await page.waitForTimeout(600);
}

/** Puts the demo gym on a platform plan (it is on the top plan by default). */
export async function useDemoPlan(page: Page, tier: "starter" | "pro") {
  await page.addInitScript((planTier) => {
    try {
      sessionStorage.setItem("mtdrb.demoPlan", planTier);
    } catch {
      // storage unavailable: the demo's own default applies
    }
  }, tier);
}
