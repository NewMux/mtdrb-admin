/**
 * Dev-only stand-in for the staff and custom-role functions, used by the mock
 * Supabase client (credential-free `npm run dev`). It is an in-memory model so
 * the Team & roles screen is clickable: roles can be created, people invited and
 * moved. The real rules live in the database (20261026090000_custom_roles.sql).
 *
 * Production builds never include this file (IS_MOCK_MODE is a build-time
 * constant); scripts/check-dist-no-mock.mjs enforces that.
 */

type MockResult = { data: unknown; error: { message: string; code?: string } | null };

interface MockRole {
  id: string;
  name: string;
  base_role: "employee" | "trainer";
  permissions: string[];
}

interface MockPerson {
  user_id: string;
  email: string;
  name: string | null;
  role: "admin" | "employee" | "trainer";
  custom_role_id: string | null;
  joined_at: string;
  last_sign_in_at: string | null;
}

const CATALOG = [
  "members.manage", "billing.view", "billing.manage", "pos.use", "pos.manage",
  "classes.manage", "trainers.manage", "attendance.manage",
];
const TRAINER_OK = ["classes.manage", "billing.view"];
const SELF = "mock-user-localhost";

// Built on first use, not at import time: a module with top-level calls would be
// kept in the production bundle even though nothing reaches it (see the header).
interface MockState {
  roles: MockRole[];
  people: MockPerson[];
}
let state: MockState | null = null;

function getState(): MockState {
  if (!state) {
    const day = 86_400_000;
    state = {
      roles: [],
      people: [
        { user_id: SELF, email: "dev@localhost.local", name: "Dev", role: "admin", custom_role_id: null, joined_at: new Date(Date.now() - 90 * day).toISOString(), last_sign_in_at: new Date().toISOString() },
        { user_id: "mock-staff-1", email: "sara@example.com", name: "Sara Hassan", role: "employee", custom_role_id: null, joined_at: new Date(Date.now() - 40 * day).toISOString(), last_sign_in_at: new Date(Date.now() - day).toISOString() },
        { user_id: "mock-staff-2", email: "omar@example.com", name: null, role: "trainer", custom_role_id: null, joined_at: new Date(Date.now() - 10 * day).toISOString(), last_sign_in_at: null },
      ],
    };
  }
  return state;
}

const fail = (message: string, code?: string): MockResult => ({ data: null, error: { message, code } });
const ok = (data: unknown): MockResult => ({ data, error: null });

/** The current mock rows for `from("tenant_roles")`. */
export const mockRoleRows = (): unknown[] => getState().roles.map((r) => ({ ...r }));

export function mockStaffRpc(name: string, args: Record<string, unknown> = {}): MockResult | undefined {
  const { roles, people } = getState();
  switch (name) {
    case "my_staff_access":
      return ok({ role: "admin", custom_role_id: null, custom_role_name: null, permissions: null });

    case "tenant_staff":
      return ok(
        people.map((p) => ({
          ...p,
          custom_role_name: roles.find((r) => r.id === p.custom_role_id)?.name ?? null,
          pending_invite: p.last_sign_in_at === null,
        })),
      );

    case "staff_role_save": {
      const roleName = String(args.p_name ?? "").trim().replace(/\s+/g, " ");
      const base = args.p_base_role;
      if (base !== "employee" && base !== "trainer") return fail("A custom role is built on the employee or trainer level", "22023");
      if (roleName.length < 1 || roleName.length > 40) return fail("A role name must be 1 to 40 characters", "22023");
      let perms = Array.isArray(args.p_permissions) ? (args.p_permissions as string[]) : [];
      if (perms.some((p) => !CATALOG.includes(p))) return fail("Unknown permission", "22023");
      if (perms.includes("billing.manage") && !perms.includes("billing.view")) perms = [...perms, "billing.view"];
      if (base === "trainer" && perms.some((p) => !TRAINER_OK.includes(p))) {
        return fail("A trainer-level role can only manage classes or view billing", "22023");
      }
      perms = [...new Set(perms)].sort();
      if (roles.some((r) => r.name.toLowerCase() === roleName.toLowerCase() && r.id !== args.p_id)) {
        return fail("A role with that name already exists", "23505");
      }
      if (args.p_id) {
        const existing = roles.find((r) => r.id === args.p_id);
        if (!existing) return fail("Role not found", "P0002");
        Object.assign(existing, { name: roleName, base_role: base, permissions: perms });
        people.filter((p) => p.custom_role_id === existing.id).forEach((p) => (p.role = base));
        return ok({ ...existing });
      }
      const created: MockRole = { id: `mock-role-${roles.length + 1}-${Date.now()}`, name: roleName, base_role: base, permissions: perms };
      roles.push(created);
      return ok({ ...created });
    }

    case "staff_role_delete": {
      const idx = roles.findIndex((r) => r.id === args.p_id);
      if (idx < 0) return fail("Role not found", "P0002");
      if (people.some((p) => p.custom_role_id === args.p_id)) return fail("Move the people on this role to another role first", "55000");
      roles.splice(idx, 1);
      return ok(null);
    }

    case "staff_set_role": {
      if (args.p_user_id === SELF) return fail("You cannot change your own role", "55000");
      const person = people.find((p) => p.user_id === args.p_user_id);
      if (!person) return fail("That person is not on your team", "P0002");
      if (args.p_custom_role_id) {
        const role = roles.find((r) => r.id === args.p_custom_role_id);
        if (!role) return fail("Role not found", "P0002");
        person.custom_role_id = role.id;
        person.role = role.base_role;
      } else if (args.p_role === "admin" || args.p_role === "employee" || args.p_role === "trainer") {
        person.custom_role_id = null;
        person.role = args.p_role;
      } else {
        return fail("Unknown role", "22023");
      }
      return ok(null);
    }

    case "staff_remove": {
      if (args.p_user_id === SELF) return fail("You cannot remove yourself", "55000");
      const idx = people.findIndex((p) => p.user_id === args.p_user_id);
      if (idx < 0) return fail("That person is not on your team", "P0002");
      people.splice(idx, 1);
      return ok(null);
    }

    default:
      return undefined;
  }
}

/** Stand-in for the invite-staff Edge Function. */
export function mockInviteStaff(body: unknown): { data: unknown; error: unknown } {
  const { roles, people } = getState();
  const b = (body ?? {}) as { email?: unknown; role?: unknown; customRoleId?: unknown };
  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { data: null, error: { context: { status: 400, json: async () => ({ error: "Enter a valid email address." }) } } };
  }
  if (people.some((p) => p.email === email)) {
    return { data: null, error: { context: { status: 409, json: async () => ({ error: "That email already has an account." }) } } };
  }
  const custom = typeof b.customRoleId === "string" ? roles.find((r) => r.id === b.customRoleId) : undefined;
  const userId = `mock-staff-${people.length + 1}-${Date.now()}`;
  people.push({
    user_id: userId,
    email,
    name: null,
    role: custom ? custom.base_role : b.role === "trainer" ? "trainer" : "employee",
    custom_role_id: custom?.id ?? null,
    joined_at: new Date().toISOString(),
    last_sign_in_at: null,
  });
  return { data: { userId, email }, error: null };
}
