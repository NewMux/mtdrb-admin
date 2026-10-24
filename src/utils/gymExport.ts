// Exporting a gym's data (the right to data portability / access): everything
// the signed-in admin can read for their gym, as one JSON file, plus a
// per-member export for a member's own data request.
//
// Reads go through the normal Supabase client, so row level security decides
// what is included - this can never export another gym's rows. Tables are read
// page by page (PostgREST caps a response at 1000 rows).

import { fetchAllRows } from "./fetchAllRows";

/** Every table that holds the gym's own data. Internal platform tables are left out on purpose. */
export const GYM_EXPORT_TABLES = [
  "gym_settings",
  "branches",
  "rooms",
  "plans",
  "trainers",
  "trainer_schedule",
  "members",
  "subscriptions",
  "classes",
  "class_bookings",
  "class_waitlist",
  "attendance_connectors",
  "attendance_devices",
  "attendance_member_identities",
  "attendance_events",
  "invoices",
  "expenses",
  "vat_returns",
  "tasks",
  "member_tasks",
  "activities",
  "notifications",
  "pos_categories",
  "pos_products",
  "pos_sales",
  "pos_sale_items",
  "pos_returns",
  "pos_return_items",
  "pos_stock_movements",
  "memberships",
  "platform_subscriptions",
] as const;

export type ExportTable = (typeof GYM_EXPORT_TABLES)[number];

/** Tables with a member_id column: what a single member's data request covers. */
export const MEMBER_EXPORT_TABLES = [
  "subscriptions",
  "class_bookings",
  "class_waitlist",
  "attendance_member_identities",
  "attendance_events",
  "invoices",
  "member_tasks",
  "tasks",
  "pos_sales",
] as const;

export interface ExportError {
  message: string;
}

/** The slice of the Supabase client the export uses (so tests can supply a fake). */
export interface ExportClient {
  from(table: string): {
    select(columns: string): {
      eq(column: string, value: string): {
        order(column: string, options: { ascending: boolean }): {
          range(from: number, to: number): PromiseLike<{ data: Record<string, unknown>[] | null; error: ExportError | null }>;
        };
      };
    };
  };
}

export type Row = Record<string, unknown>;

async function readTable(client: ExportClient, table: string, column: string, value: string): Promise<Row[]> {
  return fetchAllRows<Row>((from, to) =>
    client.from(table).select("*").eq(column, value).order("id", { ascending: true }).range(from, to),
  );
}

export interface GymExportDocument {
  format: "mtdrb-gym-export";
  version: 1;
  exported_at: string;
  tenant_id: string;
  tables: Record<string, Row[]>;
  /** Tables that could not be read, so the file is never silently incomplete */
  errors: Record<string, string>;
}

/** Reads every gym table. A table that fails is recorded in `errors`, not dropped silently. */
export async function exportGymData(
  client: ExportClient,
  tenantId: string,
  onProgress?: (done: number, total: number, table: string) => void,
  now: Date = new Date(),
): Promise<GymExportDocument> {
  const tables: Record<string, Row[]> = {};
  const errors: Record<string, string> = {};

  let done = 0;
  for (const table of GYM_EXPORT_TABLES) {
    try {
      tables[table] = await readTable(client, table, "tenant_id", tenantId);
    } catch (err) {
      errors[table] = err instanceof Error ? err.message : (err as ExportError | null)?.message ?? "could not be read";
    }
    done += 1;
    onProgress?.(done, GYM_EXPORT_TABLES.length, table);
  }

  return { format: "mtdrb-gym-export", version: 1, exported_at: now.toISOString(), tenant_id: tenantId, tables, errors };
}

export interface MemberExportDocument {
  format: "mtdrb-member-export";
  version: 1;
  exported_at: string;
  tenant_id: string;
  member_id: string;
  member: Row | null;
  tables: Record<string, Row[]>;
  errors: Record<string, string>;
}

/** Everything held about one member (their record plus rows that point at them). */
export async function exportMemberData(
  client: ExportClient,
  tenantId: string,
  memberId: string,
  now: Date = new Date(),
): Promise<MemberExportDocument> {
  const tables: Record<string, Row[]> = {};
  const errors: Record<string, string> = {};

  let member: Row | null = null;
  try {
    const rows = await readTable(client, "members", "id", memberId);
    member = rows.find((r) => r.tenant_id === tenantId) ?? null;
  } catch (err) {
    errors.members = err instanceof Error ? err.message : (err as ExportError | null)?.message ?? "could not be read";
  }

  for (const table of MEMBER_EXPORT_TABLES) {
    try {
      const rows = await readTable(client, table, "member_id", memberId);
      tables[table] = rows.filter((r) => r.tenant_id === tenantId);
    } catch (err) {
      errors[table] = err instanceof Error ? err.message : (err as ExportError | null)?.message ?? "could not be read";
    }
  }

  // A sale's line items point at the sale, not at the member.
  try {
    const items: Row[] = [];
    for (const sale of tables.pos_sales ?? []) {
      items.push(...(await readTable(client, "pos_sale_items", "sale_id", String(sale.id))));
    }
    tables.pos_sale_items = items.filter((r) => r.tenant_id === tenantId);
  } catch (err) {
    errors.pos_sale_items = err instanceof Error ? err.message : (err as ExportError | null)?.message ?? "could not be read";
  }

  return {
    format: "mtdrb-member-export",
    version: 1,
    exported_at: now.toISOString(),
    tenant_id: tenantId,
    member_id: memberId,
    member,
    tables,
    errors,
  };
}

export function exportFileName(kind: "gym" | "member", now: Date = new Date()): string {
  return `mtdrb-${kind}-export-${now.toISOString().slice(0, 10)}.json`;
}

/** Saves a document as a JSON file in the browser. */
export function downloadJson(filename: string, document_: unknown): void {
  const blob = new Blob([JSON.stringify(document_, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = window.document.createElement("a");
  link.href = url;
  link.download = filename;
  window.document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
