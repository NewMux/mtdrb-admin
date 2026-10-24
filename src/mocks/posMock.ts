/**
 * Dev-only stand-in for the point-of-sale functions (adjust_pos_inventory,
 * complete_pos_sale), used by the mock Supabase client so the shop can be clicked
 * through without a database. Stock and sales live in the mock table store. The
 * real rules (tax components, rounding, return limits) are in the database
 * functions; this only keeps a demo sale self-consistent.
 *
 * Production builds never include this file (IS_MOCK_MODE is a build-time
 * constant); scripts/check-dist-no-mock.mjs enforces that.
 */

type Row = Record<string, unknown>;
type MockResult = { data: unknown; error: { message: string; code?: string } | null };

export interface MockTables {
  rows: (table: string) => Row[];
  persist: () => void;
}

const num = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};
const round = (value: number): number => Math.round(value * 1000) / 1000;

export function mockPosRpc(
  name: string,
  args: Record<string, unknown> = {},
  tables: MockTables,
): MockResult | undefined {
  if (name === "adjust_pos_inventory") {
    const product = tables.rows("pos_products").find((p) => p.id === args.p_product_id);
    if (!product) return { data: null, error: { message: "Product not found", code: "P0002" } };
    const next = num(product.stock_quantity) + num(args.p_quantity_delta);
    if (next < 0) return { data: null, error: { message: "Stock cannot go below zero", code: "23514" } };
    product.stock_quantity = next;
    tables.persist();
    return { data: { product_id: product.id, stock_quantity: next }, error: null };
  }

  if (name === "complete_pos_sale") {
    const products = tables.rows("pos_products");
    const items = (Array.isArray(args.p_items) ? args.p_items : []) as Array<{ product_id: string; quantity: number }>;
    const lines = items.map((item) => ({ item, product: products.find((p) => p.id === item.product_id) }));
    if (lines.length === 0 || lines.some((l) => !l.product)) {
      return { data: null, error: { message: "Add at least one product", code: "22023" } };
    }
    for (const { item, product } of lines) {
      if (product!.track_inventory && num(product!.stock_quantity) < item.quantity) {
        return { data: null, error: { message: `Not enough stock for ${String(product!.name)}`, code: "23514" } };
      }
    }

    const subtotal = round(lines.reduce((sum, l) => sum + num(l.product!.price) * l.item.quantity, 0));
    const discount = Math.min(Math.max(0, num(args.p_discount)), subtotal);
    let vat = 0;
    for (const { item, product } of lines) {
      const gross = num(product!.price) * item.quantity;
      const net = subtotal > 0 ? gross - (discount * gross) / subtotal : gross;
      vat += (net * num(product!.vat_rate)) / 100;
    }
    vat = round(vat);

    for (const { item, product } of lines) {
      if (product!.track_inventory) product!.stock_quantity = num(product!.stock_quantity) - item.quantity;
    }

    const sales = tables.rows("pos_sales");
    const saleId = `demo-sale-${sales.length + 1}`;
    const receipt = {
      sale_id: saleId,
      sale_number: `POS-${String(sales.length + 1).padStart(5, "0")}`,
      subtotal,
      discount_total: round(discount),
      vat_total: vat,
      tax_breakdown: null,
      total: round(subtotal - discount + vat),
      currency: args.p_currency,
    };
    sales.unshift({
      id: saleId,
      tenant_id: products[0]?.tenant_id,
      sale_number: receipt.sale_number,
      status: "completed",
      payment_method: args.p_payment_method,
      member_id: args.p_member_id ?? null,
      subtotal,
      discount_total: receipt.discount_total,
      vat_total: vat,
      total: receipt.total,
      currency: args.p_currency,
      created_at: new Date().toISOString(),
      items: lines.map(({ item, product }, index) => ({
        id: `${saleId}-item-${index + 1}`,
        product_id: product!.id,
        product_name: product!.name,
        sku: product!.sku,
        quantity: item.quantity,
        returned_quantity: 0,
        line_total: round(num(product!.price) * item.quantity),
      })),
    });
    tables.persist();
    return { data: receipt, error: null };
  }

  return undefined;
}
