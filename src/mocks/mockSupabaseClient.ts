/**
 * Temporary mock Supabase client for localhost UI preview.
 * Remove when connecting to the real backend.
 */

import type { User, UserAttributes } from "@supabase/supabase-js";
import { DEMO_TABLES, DEMO_TENANT_ID } from "./demoData";

type Filter =
  | { kind: "eq"; field: string; value: unknown }
  | { kind: "neq"; field: string; value: unknown }
  | { kind: "gte"; field: string; value: unknown }
  | { kind: "lte"; field: string; value: unknown }
  | { kind: "in"; field: string; value: unknown[] }
  | { kind: "or"; expr: string };

const MOCK_USER: User = {
  id: "mock-user-localhost",
  aud: "authenticated",
  role: "authenticated",
  email: "dev@localhost.local",
  email_confirmed_at: new Date().toISOString(),
  phone: "",
  confirmed_at: new Date().toISOString(),
  last_sign_in_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: {
    tenant_id: DEMO_TENANT_ID,
    paid: true,
    role: "admin",
    subscription_tier: "enterprise",
    onboarding_completed: true,
    name: "Local Dev User",
  },
  identities: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
} as User;

let currentMockUser = { ...MOCK_USER };

const getMockUser = (): User | null => {
  if (typeof window !== "undefined") {
    const loggedIn = sessionStorage.getItem("mock_logged_in");
    if (loggedIn === "false") {
      return null;
    }
    if (loggedIn === "true") {
      return currentMockUser;
    }
    
    // If it's not set (first load), check the current path
    const path = window.location.pathname;
    const publicRoutes = ["/", "/login", "/signup"];
    if (publicRoutes.includes(path)) {
      return null;
    }
    
    // For protected routes, default to logged in (bypass auth)
    sessionStorage.setItem("mock_logged_in", "true");
    return currentMockUser;
  }
  return currentMockUser;
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function getTableRows(table: string): Record<string, unknown>[] {
  const rows = DEMO_TABLES[table];
  if (!rows) return [];
  return clone(rows) as Record<string, unknown>[];
}

function matchesOr(row: Record<string, unknown>, expr: string): boolean {
  const parts = expr.split(",");
  return parts.some((part) => {
    const match = part.match(/(\w+)\.ilike\.%(.+)%/);
    if (!match) return false;
    const [, field, term] = match;
    const val = String(row[field] ?? "").toLowerCase();
    return val.includes(term.toLowerCase());
  });
}

function applyFilters(
  rows: Record<string, unknown>[],
  filters: Filter[],
): Record<string, unknown>[] {
  return rows.filter((row) =>
    filters.every((f) => {
      switch (f.kind) {
        case "eq":
          return row[f.field] === f.value;
        case "neq":
          return row[f.field] !== f.value;
        case "gte": {
          const v = row[f.field];
          return v != null && String(v) >= String(f.value);
        }
        case "lte": {
          const v = row[f.field];
          return v != null && String(v) <= String(f.value);
        }
        case "in":
          return (f.value as unknown[]).includes(row[f.field]);
        case "or":
          return matchesOr(row, f.expr);
        default:
          return true;
      }
    }),
  );
}

class MockQueryBuilder implements PromiseLike<{ data: unknown; error: unknown; count?: number }> {
  private table: string;
  private filters: Filter[] = [];
  private orderField?: string;
  private orderAsc = true;
  private limitN?: number;
  private rangeFrom?: number;
  private rangeTo?: number;
  private wantSingle = false;
  private op: "select" | "insert" | "update" | "delete" | "upsert" = "select";
  private payload?: unknown;

  constructor(table: string) {
    this.table = table;
  }

  select(columns?: string) {
    void columns;
    if (this.op !== "insert" && this.op !== "update" && this.op !== "upsert") {
      this.op = "select";
    }
    return this;
  }

  insert(data: unknown) {
    this.op = "insert";
    this.payload = data;
    return this;
  }

  update(data: unknown) {
    this.op = "update";
    this.payload = data;
    return this;
  }

  upsert(data: unknown) {
    this.op = "upsert";
    this.payload = data;
    return this;
  }

  delete() {
    this.op = "delete";
    return this;
  }

  eq(field: string, value: unknown) {
    this.filters.push({ kind: "eq", field, value });
    return this;
  }

  neq(field: string, value: unknown) {
    this.filters.push({ kind: "neq", field, value });
    return this;
  }

  gte(field: string, value: unknown) {
    this.filters.push({ kind: "gte", field, value });
    return this;
  }

  lte(field: string, value: unknown) {
    this.filters.push({ kind: "lte", field, value });
    return this;
  }

  in(field: string, values: unknown[]) {
    this.filters.push({ kind: "in", field, value: values });
    return this;
  }

  or(expr: string) {
    this.filters.push({ kind: "or", expr });
    return this;
  }

  order(field: string, opts?: { ascending?: boolean }) {
    this.orderField = field;
    this.orderAsc = opts?.ascending ?? true;
    return this;
  }

  limit(n: number) {
    this.limitN = n;
    return this;
  }

  range(from: number, to: number) {
    this.rangeFrom = from;
    this.rangeTo = to;
    return this;
  }

  single() {
    this.wantSingle = true;
    return this;
  }

  maybeSingle() {
    this.wantSingle = true;
    return this;
  }

  private execute(): { data: unknown; error: unknown; count?: number } {
    if (this.op === "insert" || this.op === "upsert") {
      const rows = Array.isArray(this.payload) ? this.payload : [this.payload];
      return { data: this.wantSingle ? rows[0] : rows, error: null };
    }

    if (this.op === "update") {
      let rows = applyFilters(getTableRows(this.table), this.filters);
      rows = rows.map((r) => ({ ...r, ...(this.payload as object) }));
      return { data: this.wantSingle ? rows[0] ?? null : rows, error: null };
    }

    if (this.op === "delete") {
      return { data: this.wantSingle ? null : [], error: null };
    }

    let rows = applyFilters(getTableRows(this.table), this.filters);

    if (this.orderField) {
      const field = this.orderField;
      const asc = this.orderAsc;
      rows.sort((a, b) => {
        const av = String(a[field] ?? "");
        const bv = String(b[field] ?? "");
        return asc ? av.localeCompare(bv) : bv.localeCompare(av);
      });
    }

    if (this.rangeFrom != null && this.rangeTo != null) {
      rows = rows.slice(this.rangeFrom, this.rangeTo + 1);
    } else if (this.limitN != null) {
      rows = rows.slice(0, this.limitN);
    }

    if (this.wantSingle) {
      if (rows.length === 0) {
        return {
          data: null,
          error: { code: "PGRST116", message: "No rows found" },
        };
      }
      return { data: rows[0], error: null };
    }

    return { data: rows, error: null, count: rows.length };
  }

  then<TResult1 = { data: unknown; error: unknown }, TResult2 = never>(
    onfulfilled?: ((value: { data: unknown; error: unknown }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve(this.execute()).then(onfulfilled, onrejected);
  }
}

function mockRpc(name: string): { data: unknown; error: null } {
  const overview = {
    total_members: 248,
    active_members: 210,
    total_revenue: 187500,
    monthly_growth: 12.4,
    class_utilization: 82,
    member_retention: 91,
  };
  const rpcMap: Record<string, unknown> = {
    get_analytics_overview: overview,
    get_member_metrics: { new_members: 18, churned: 3, retention_rate: 91 },
    get_trainer_metrics: { avg_rating: 4.8, total_classes: 156 },
    get_class_metrics: { utilization: 82, cancellations: 4 },
    get_financial_metrics: { revenue: 187500, expenses: 81700, profit: 105800 },
    get_vat_dashboard_data: {
      vat_collected: 12450,
      vat_paid: 3200,
      compliance_score: 94,
    },
    calculate_vat_compliance_score: 94,
    generate_vat_return: { id: "vr-mock", status: "draft" },
    create_tenant_with_membership: DEMO_TENANT_ID,
  };
  return { data: rpcMap[name] ?? overview, error: null };
}

/**
 * Creates a mock Supabase client that returns hardcoded demo data.
 */
export function createMockSupabaseClient() {
  const noopSub = { unsubscribe: () => {} };

  return {
    from: (table: string) => new MockQueryBuilder(table),
    rpc: (name: string) => Promise.resolve(mockRpc(name)),
    channel: () => ({
      on: () => ({ subscribe: () => noopSub }),
      subscribe: () => noopSub,
    }),
    removeChannel: () => {},
    auth: {
      getUser: async () => ({ data: { user: getMockUser() }, error: null }),
      getSession: async () => {
        const user = getMockUser();
        return {
          data: {
            session: user
              ? {
                  user,
                  access_token: "mock-token",
                  refresh_token: "mock-refresh",
                  expires_at: Math.floor(Date.now() / 1000) + 3600,
                }
              : null,
          },
          error: null,
        };
      },
      refreshSession: async () => {
        const user = getMockUser();
        return {
          data: { session: user ? { user } : null },
          error: null,
        };
      },
      updateUser: async (attributes?: UserAttributes) => {
        if (attributes?.data) {
          currentMockUser = {
            ...currentMockUser,
            user_metadata: {
              ...currentMockUser.user_metadata,
              ...attributes.data,
            },
          };
        }
        return { data: { user: currentMockUser }, error: null };
      },
      signInWithPassword: async () => {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("mock_logged_in", "true");
        }
        currentMockUser = {
          ...MOCK_USER,
          user_metadata: {
            ...MOCK_USER.user_metadata,
            paid: true,
            onboarding_completed: true,
          },
        };
        return {
          data: {
            user: currentMockUser,
            session: {
              user: currentMockUser,
              access_token: "mock-token",
              refresh_token: "mock-refresh",
              expires_at: Math.floor(Date.now() / 1000) + 3600,
            },
          },
          error: null,
        };
      },
      signUp: async () => {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("mock_logged_in", "true");
        }
        currentMockUser = {
          ...MOCK_USER,
          user_metadata: {
            ...MOCK_USER.user_metadata,
            paid: false,
            onboarding_completed: false,
          },
        };
        return {
          data: {
            user: currentMockUser,
            session: {
              user: currentMockUser,
              access_token: "mock-token",
              refresh_token: "mock-refresh",
              expires_at: Math.floor(Date.now() / 1000) + 3600,
            },
          },
          error: null,
        };
      },
      signOut: async () => {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("mock_logged_in", "false");
        }
        currentMockUser = { ...MOCK_USER };
        return { error: null };
      },
      onAuthStateChange: (cb?: (event: string, session: unknown) => void) => {
        const user = getMockUser();
        cb?.("INITIAL_SESSION", user ? { user } : null);
        return { data: { subscription: noopSub } };
      },
    },
    storage: {
      from: () => ({
        upload: async () => ({ data: { path: "mock/path.jpg" }, error: null }),
        getPublicUrl: (path: string) => ({
          data: { publicUrl: `https://placeholder.demo/${path}` },
        }),
      }),
    },
  };
}

export type MockSupabaseClient = ReturnType<typeof createMockSupabaseClient>;
