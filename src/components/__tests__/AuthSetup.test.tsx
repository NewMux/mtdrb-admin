import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

const rpc = vi.fn();
const maybeMembership = vi.fn();

vi.mock("../../supabaseClient", () => {
  const chain = (result: () => unknown) => {
    const q: Record<string, unknown> = {};
    q.select = () => q;
    q.eq = () => q;
    q.limit = () => Promise.resolve({ error: null });
    q.single = () => Promise.resolve(result());
    return q;
  };
  return {
    IS_MOCK_MODE: false,
    supabase: {
      from: (table: string) =>
        table === "tenants"
          ? chain(() => ({ error: null }))
          : chain(() => maybeMembership()),
      rpc: (...args: unknown[]) => rpc(...args),
      auth: {
        getSession: async () => ({
          data: { session: { expires_at: Math.floor(Date.now() / 1000) + 3600 } },
          error: null,
        }),
        getUser: async () => ({
          data: { user: { id: "u1", user_metadata: { gym_name: "Test Gym" } } },
          error: null,
        }),
        refreshSession: async () => ({ error: null }),
      },
    },
  };
});

import AuthSetup from "../AuthSetup";

const NO_MEMBERSHIP = { data: null, error: { code: "PGRST116", message: "no rows" } };
const HAS_MEMBERSHIP = { data: { id: "m1", tenant_id: "t1", role: "admin" }, error: null };

function renderAt() {
  return render(
    <MemoryRouter initialEntries={["/dashboard"]}>
      <Routes>
        <Route
          path="/dashboard"
          element={
            <AuthSetup>
              <div>gym dashboard</div>
            </AuthSetup>
          }
        />
        <Route path="/superadmin" element={<div>owner console</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

const rpcCalls = (name: string) => rpc.mock.calls.filter((c) => c[0] === name);

beforeEach(() => {
  rpc.mockReset();
  maybeMembership.mockReset();
});

describe("AuthSetup platform-owner routing", () => {
  it("sends a membership-less platform admin to the console WITHOUT creating a tenant", async () => {
    maybeMembership.mockReturnValue(NO_MEMBERSHIP);
    rpc.mockImplementation(async (name: string) =>
      name === "platform_admin_status" ? { data: "ok", error: null } : { data: "new-tenant", error: null },
    );
    renderAt();
    expect(await screen.findByText("owner console")).toBeInTheDocument();
    expect(rpcCalls("create_tenant_with_membership")).toHaveLength(0);
  });

  it("also routes an allowlisted admin who still needs MFA", async () => {
    maybeMembership.mockReturnValue(NO_MEMBERSHIP);
    rpc.mockImplementation(async (name: string) =>
      name === "platform_admin_status" ? { data: "mfa_required", error: null } : { data: "x", error: null },
    );
    renderAt();
    expect(await screen.findByText("owner console")).toBeInTheDocument();
    expect(rpcCalls("create_tenant_with_membership")).toHaveLength(0);
  });

  it("still creates a gym for an ordinary new user", async () => {
    maybeMembership.mockReturnValue(NO_MEMBERSHIP);
    rpc.mockImplementation(async (name: string) =>
      name === "platform_admin_status" ? { data: "not_admin", error: null } : { data: "new-tenant", error: null },
    );
    renderAt();
    expect(await screen.findByText("gym dashboard")).toBeInTheDocument();
    expect(rpcCalls("create_tenant_with_membership")).toHaveLength(1);
  });

  it("keeps the old behaviour when the platform check itself fails", async () => {
    maybeMembership.mockReturnValue(NO_MEMBERSHIP);
    rpc.mockImplementation(async (name: string) =>
      name === "platform_admin_status"
        ? { data: null, error: { message: "function does not exist" } }
        : { data: "new-tenant", error: null },
    );
    renderAt();
    expect(await screen.findByText("gym dashboard")).toBeInTheDocument();
    expect(rpcCalls("create_tenant_with_membership")).toHaveLength(1);
  });

  it("does not even ask when the user already has a gym", async () => {
    maybeMembership.mockReturnValue(HAS_MEMBERSHIP);
    renderAt();
    await waitFor(() => expect(screen.getByText("gym dashboard")).toBeInTheDocument());
    expect(rpcCalls("platform_admin_status")).toHaveLength(0);
  });
});
