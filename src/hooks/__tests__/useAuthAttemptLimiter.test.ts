import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAuthAttemptLimiter } from "../useAuthAttemptLimiter";

describe("useAuthAttemptLimiter", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("locks out after the default 5 attempts when no maxAttempts is given", () => {
    const { result } = renderHook(() =>
      useAuthAttemptLimiter("login", "test@example.com"),
    );

    expect(result.current.maxAttempts).toBe(5);
    act(() => {
      for (let i = 0; i < 4; i++) result.current.registerFailure();
    });
    expect(result.current.isLocked).toBe(false);
    act(() => result.current.registerFailure());
    expect(result.current.isLocked).toBe(true);
  });

  it("locks out after a tenant-configured threshold instead", () => {
    const { result } = renderHook(() =>
      useAuthAttemptLimiter("login", "configured@example.com", 2),
    );

    expect(result.current.maxAttempts).toBe(2);
    act(() => result.current.registerFailure());
    expect(result.current.isLocked).toBe(false);
    act(() => result.current.registerFailure());
    expect(result.current.isLocked).toBe(true);
  });

  it("reset() clears the lockout", () => {
    const { result } = renderHook(() =>
      useAuthAttemptLimiter("login", "reset@example.com", 1),
    );

    act(() => result.current.registerFailure());
    expect(result.current.isLocked).toBe(true);

    act(() => result.current.reset());
    expect(result.current.isLocked).toBe(false);
  });
});
