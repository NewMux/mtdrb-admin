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
  | { kind: "lt"; field: string; value: unknown }
  | { kind: "in"; field: string; value: unknown[] }
  | { kind: "or"; expr: string }
  | { kind: "not"; field: string; operator: string; value: unknown };

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

type MockRow = Record<string, unknown>;
type MockTableStore = Record<string, MockRow[]>;

// Keep localhost writes in memory for the lifetime of the app session. The
// demo data remains the initial seed, while reads after a write observe the
// same mutable state instead of reloading the seed on every query.
const MOCK_TABLE_STORE_KEY = "mtdrb.mockTableStore";
let mockTableStore: MockTableStore | null = null;

function getMockTableStore(): MockTableStore {
  if (mockTableStore) return mockTableStore;

  if (typeof window !== "undefined") {
    const persistedStore = window.sessionStorage.getItem(MOCK_TABLE_STORE_KEY);
    if (persistedStore) {
      try {
        const parsedStore = JSON.parse(persistedStore) as MockTableStore;
        if (parsedStore && typeof parsedStore === "object") {
          mockTableStore = parsedStore;
        }
      } catch {
        window.sessionStorage.removeItem(MOCK_TABLE_STORE_KEY);
      }
    }
  }

  mockTableStore ??= {};
  return mockTableStore;
}

function persistMockTableStore(): void {
  if (typeof window !== "undefined" && mockTableStore) {
    window.sessionStorage.setItem(
      MOCK_TABLE_STORE_KEY,
      JSON.stringify(mockTableStore),
    );
  }
}

function getMutableTableRows(table: string): MockRow[] {
  const store = getMockTableStore();
  if (!(table in store)) {
    store[table] = clone(DEMO_TABLES[table] ?? []) as MockRow[];
  }
  return store[table];
}

function getTableRows(table: string): MockRow[] {
  return clone(getMutableTableRows(table));
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
        case "lt": {
          const v = row[f.field];
          return v != null && String(v) < String(f.value);
        }
        case "in":
          return (f.value as unknown[]).includes(row[f.field]);
        case "or":
          return matchesOr(row, f.expr);
        case "not": {
          const v = row[f.field];
          if (f.operator === "is" && f.value === null) return v != null;
          if (f.operator === "eq") return v !== f.value;
          return true;
        }
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

  lt(field: string, value: unknown) {
    this.filters.push({ kind: "lt", field, value });
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

  not(field: string, operator: string, value: unknown) {
    this.filters.push({ kind: "not", field, operator, value });
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
      const incomingRows = (Array.isArray(this.payload) ? this.payload : [this.payload]).filter(
        (row): row is MockRow => Boolean(row) && typeof row === "object",
      );
      const tableRows = getMutableTableRows(this.table);
      const returnedRows: MockRow[] = [];

      for (const incomingRow of incomingRows) {
        let existingIndex = -1;
        if (this.op === "upsert") {
          const conflictField = incomingRow.tenant_id != null ? "tenant_id" : "id";
          if (incomingRow[conflictField] != null) {
            existingIndex = tableRows.findIndex(
              (row) => row[conflictField] === incomingRow[conflictField],
            );
          }
        }

        if (existingIndex >= 0) {
          tableRows[existingIndex] = { ...tableRows[existingIndex], ...clone(incomingRow) };
          returnedRows.push(clone(tableRows[existingIndex]));
        } else {
          const insertedRow = clone(incomingRow);
          tableRows.push(insertedRow);
          returnedRows.push(clone(insertedRow));
        }
      }

      persistMockTableStore();
      return {
        data: this.wantSingle ? returnedRows[0] ?? null : returnedRows,
        error: null,
      };
    }

    if (this.op === "update") {
      const tableRows = getMutableTableRows(this.table);
      const updatedRows: MockRow[] = [];
      for (let index = 0; index < tableRows.length; index += 1) {
        if (!applyFilters([tableRows[index]], this.filters).length) continue;
        tableRows[index] = { ...tableRows[index], ...(this.payload as object) };
        updatedRows.push(clone(tableRows[index]));
      }
      persistMockTableStore();
      return {
        data: this.wantSingle ? updatedRows[0] ?? null : updatedRows,
        error: null,
      };
    }

    if (this.op === "delete") {
      const tableRows = getMutableTableRows(this.table);
      const deletedRows = tableRows.filter(
        (row) => applyFilters([row], this.filters).length > 0,
      );
      getMockTableStore()[this.table] = tableRows.filter(
        (row) => applyFilters([row], this.filters).length === 0,
      );
      persistMockTableStore();
      return {
        data: this.wantSingle ? clone(deletedRows[0] ?? null) : clone(deletedRows),
        error: null,
      };
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
