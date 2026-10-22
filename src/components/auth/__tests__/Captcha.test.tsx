import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, renderHook } from "@testing-library/react";
import Captcha from "../Captcha";
import { useCaptcha, type CaptchaState } from "../../../hooks/useCaptcha";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: "en" } }),
}));

function state(over: Partial<CaptchaState> = {}): CaptchaState {
  return {
    siteKey: "site-key",
    pending: true,
    token: undefined,
    resetKey: 0,
    setToken: vi.fn(),
    reset: vi.fn(),
    ...over,
  };
}

describe("useCaptcha", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("does not block the form when no site key is configured", () => {
    vi.stubEnv("VITE_TURNSTILE_SITE_KEY", "");
    const { result } = renderHook(() => useCaptcha());
    expect(result.current.siteKey).toBeNull();
    expect(result.current.pending).toBe(false);
    expect(result.current.token).toBeUndefined();
  });

  it("blocks until solved, then hands out the token, and re-blocks after reset", () => {
    vi.stubEnv("VITE_TURNSTILE_SITE_KEY", "site-key");
    const { result } = renderHook(() => useCaptcha());
    expect(result.current.pending).toBe(true);

    act(() => result.current.setToken("tok-1"));
    expect(result.current.pending).toBe(false);
    expect(result.current.token).toBe("tok-1");

    const before = result.current.resetKey;
    act(() => result.current.reset());
    expect(result.current.pending).toBe(true);
    expect(result.current.token).toBeUndefined();
    expect(result.current.resetKey).toBe(before + 1);
  });
});

describe("Captcha", () => {
  const render_ = vi.fn();
  const remove = vi.fn();

  beforeEach(() => {
    render_.mockReset().mockReturnValue("widget-1");
    remove.mockReset();
    (window as unknown as { turnstile: unknown }).turnstile = { render: render_, remove, reset: vi.fn() };
  });
  afterEach(() => {
    delete (window as unknown as { turnstile?: unknown }).turnstile;
  });

  it("renders nothing without a site key", () => {
    const { container } = render(<Captcha captcha={state({ siteKey: null, pending: false })} />);
    expect(container).toBeEmptyDOMElement();
    expect(render_).not.toHaveBeenCalled();
  });

  it("draws the widget and reports the token it solves", async () => {
    const setToken = vi.fn();
    render(<Captcha captcha={state({ setToken })} />);
    await act(async () => {});
    expect(render_).toHaveBeenCalledTimes(1);
    const opts = render_.mock.calls[0][1];
    expect(opts.sitekey).toBe("site-key");

    opts.callback("solved");
    expect(setToken).toHaveBeenLastCalledWith("solved");
    opts["expired-callback"]();
    expect(setToken).toHaveBeenLastCalledWith(null);
  });

  it("removes the widget on unmount", async () => {
    const { unmount } = render(<Captcha captcha={state()} />);
    await act(async () => {});
    unmount();
    expect(remove).toHaveBeenCalledWith("widget-1");
  });

  it("draws a fresh challenge when the reset key changes", async () => {
    const { rerender } = render(<Captcha captcha={state({ resetKey: 0 })} />);
    await act(async () => {});
    rerender(<Captcha captcha={state({ resetKey: 1 })} />);
    await act(async () => {});
    expect(render_).toHaveBeenCalledTimes(2);
    expect(remove).toHaveBeenCalledTimes(1);
  });

  it("shows an error if the script cannot load", async () => {
    delete (window as unknown as { turnstile?: unknown }).turnstile;
    const append = vi.spyOn(document.head, "appendChild").mockImplementation((node) => {
      queueMicrotask(() => (node as HTMLScriptElement).onerror?.(new Event("error")));
      return node;
    });
    render(<Captcha captcha={state()} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("auth.captchaLoadFailed");
    append.mockRestore();
  });
});
