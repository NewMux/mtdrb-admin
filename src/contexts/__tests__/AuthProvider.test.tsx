import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, act, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation, useNavigate } from "react-router-dom";
import type { User } from "@supabase/supabase-js";

type AuthCallback = (event: string, session: { user: User } | null) => Promise<void>;
const h = vi.hoisted(() => ({ callback: null as null | AuthCallback, current: null as User | null }));

function makeUser(over: Partial<User> = {}): User {
  return {
    id: "u1",
    email: "a@b.dev",
    updated_at: "2026-10-22T10:00:00Z",
    app_metadata: {},
    aud: "authenticated",
    created_at: "2026-10-01T00:00:00Z",
    user_metadata: {},
    ...over,
  } as User;
}

vi.mock("../../supabaseClient", () => {
  const chain = (data: unknown) => {
    const c: Record<string, unknown> = {};
    for (const k of ["select", "eq", "order", "limit"]) c[k] = () => c;
    c.maybeSingle = () => Promise.resolve({ data, error: null });
    return c;
  };
  return {
    IS_MOCK_MODE: false,
    getCurrentUser: async () => ({ user: h.current, error: null }),
    supabase: {
      from: (table: string) =>
        chain(
          table === "memberships"
            ? { tenant_id: "t1", role: "admin" }
            : { status: "active", plan_tier: "starter", trial_end: null, current_period_end: null, grace_until: null },
        ),
      rpc: async () => ({ data: null, error: null }),
      auth: {
        onAuthStateChange: (cb: AuthCallback) => {
          h.callback = cb;
          return { data: { subscription: { unsubscribe: () => {} } } };
        },
      },
    },
  };
});

import { AuthProvider } from "../AuthProvider";
import { useAuth } from "../auth-context";

const seen: { users: Array<User | null>; path: string; go: (to: string) => void } = {
  users: [],
  path: "",
  go: () => {},
};

function Probe() {
  const { user } = useAuth();
  const location = useLocation();
  seen.go = useNavigate();
  seen.users.push(user);
  seen.path = location.pathname;
  return null;
}

beforeEach(() => {
  seen.users = [];
  seen.path = "";
  h.callback = null;
  h.current = makeUser();
});

async function mount(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <Probe />
      </AuthProvider>
    </MemoryRouter>,
  );
  await waitFor(() => expect(h.callback).not.toBeNull());
}

describe("AuthProvider session events", () => {
  it("does not move the user again when SIGNED_IN repeats on tab refocus", async () => {
    await mount("/dashboard/members");
    // Paid user who never finished onboarding: the first SIGNED_IN routes them there.
    await act(async () => {
      await h.callback!("SIGNED_IN", { user: makeUser() });
    });
    expect(seen.path).toBe("/onboarding");

    // supabase-js re-emits SIGNED_IN whenever the tab regains focus. The user has
    // meanwhile moved on (here: to the dashboard); they must stay there.
    await act(async () => {
      seen.go("/dashboard");
    });
    await waitFor(() => expect(seen.path).toBe("/dashboard"));
    await act(async () => {
      await h.callback!("SIGNED_IN", { user: makeUser() });
    });
    expect(seen.path).toBe("/dashboard");
  });

  it("keeps the same user object when an identical session is re-emitted", async () => {
    await mount("/dashboard/members");
    await act(async () => {
      await h.callback!("SIGNED_IN", { user: makeUser() });
    });
    const first = seen.users.at(-1);
    expect(first?.id).toBe("u1");

    await act(async () => {
      await h.callback!("TOKEN_REFRESHED", { user: makeUser() }); // new object, same user
    });
    expect(seen.users.at(-1)).toBe(first);
  });

  it("does adopt a changed user (profile update)", async () => {
    await mount("/dashboard/members");
    await act(async () => {
      await h.callback!("SIGNED_IN", { user: makeUser() });
    });
    await act(async () => {
      await h.callback!("USER_UPDATED", { user: makeUser({ updated_at: "2026-10-22T11:00:00Z", email: "new@b.dev" }) });
    });
    expect(seen.users.at(-1)?.email).toBe("new@b.dev");
  });
});
