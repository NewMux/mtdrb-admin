import "@testing-library/jest-dom";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Note: @testing-library/jest-dom automatically extends expect
// No need to manually extend if using the import above

// Browser shims below only apply under jsdom; a few suites (e.g. the
// Edge Function helpers in supabase/functions/_shared) opt into the plain
// node environment, where there is no window.
const hasWindow = typeof window !== "undefined";

// jsdom doesn't implement matchMedia; gsap's ScrollTrigger requires it.
if (hasWindow && !window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }) as unknown as MediaQueryList;
}

// jsdom doesn't implement IntersectionObserver; framer-motion's viewport features require it.
if (hasWindow && !("IntersectionObserver" in window)) {
  class MockIntersectionObserver implements IntersectionObserver {
    readonly root: Element | Document | null = null;
    readonly rootMargin: string = "";
    readonly thresholds: ReadonlyArray<number> = [];
    observe = () => {};
    unobserve = () => {};
    disconnect = () => {};
    takeRecords = () => [];
  }
  (window as unknown as { IntersectionObserver: typeof IntersectionObserver }).IntersectionObserver =
    MockIntersectionObserver as unknown as typeof IntersectionObserver;
}

// Runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
});
