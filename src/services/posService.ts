import { supabase } from "../supabaseClient";
import type {
  PosCategory,
  PosProduct,
  PosProductInput,
  PosReturnInputItem,
  PosReturnResult,
  PosSale,
  PosSaleInputItem,
  PosSaleReceipt,
  PosStockMovement,
  PosPaymentMethod,
  PosMovementType,
} from "../types/pos";

// The migration for this feature is deployed alongside the app. Keep this
// adapter narrow while the generated Supabase schema types are refreshed.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const posClient = supabase as any;

type PosRow = Record<string, unknown>;

type PosError = {
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
};

const toNumber = (value: unknown): number => {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
};

const getErrorMessage = (error: PosError | null | undefined, fallback: string): string => {
  if (!error) return fallback;
  return [error.message, error.details, error.hint, error.code].filter(Boolean).join(" ") || fallback;
};

const normalizeCategory = (row: PosRow): PosCategory => ({
  id: String(row.id),
  tenant_id: String(row.tenant_id),
  name: String(row.name ?? ""),
  color: String(row.color ?? "#0ea5e9"),
  is_active: row.is_active !== false,
  created_at: String(row.created_at ?? ""),
  updated_at: String(row.updated_at ?? ""),
});

const normalizeProduct = (row: PosRow): PosProduct => ({
  id: String(row.id),
  tenant_id: String(row.tenant_id),
  category_id: row.category_id ? String(row.category_id) : null,
  name: String(row.name ?? ""),
  sku: String(row.sku ?? ""),
  barcode: row.barcode ? String(row.barcode) : null,
  description: row.description ? String(row.description) : null,
  price: toNumber(row.price),
  cost_price: toNumber(row.cost_price),
  vat_rate: toNumber(row.vat_rate),
  stock_quantity: toNumber(row.stock_quantity),
  reorder_level: toNumber(row.reorder_level),
  track_inventory: row.track_inventory !== false,
  image_url: row.image_url ? String(row.image_url) : null,
  is_active: row.is_active !== false,
  created_at: String(row.created_at ?? ""),
  updated_at: String(row.updated_at ?? ""),
  category:
    row.category && typeof row.category === "object"
      ? (() => {
          const category = row.category as PosRow;
          return {
            id: String(category.id),
            name: String(category.name ?? ""),
            color: String(category.color ?? "#0ea5e9"),
          };
        })()
      : null,
});

const normalizeSale = (row: PosRow): PosSale => ({
  id: String(row.id),
  tenant_id: String(row.tenant_id),
  sale_number: String(row.sale_number ?? ""),
  member_id: row.member_id ? String(row.member_id) : null,
  cashier_id: String(row.cashier_id ?? ""),
  status: (row.status ?? "completed") as PosSale["status"],
  subtotal: toNumber(row.subtotal),
  discount_total: toNumber(row.discount_total),
  vat_total: toNumber(row.vat_total),
  total: toNumber(row.total),
  currency: String(row.currency ?? "AED"),
  payment_method: (row.payment_method ?? "cash") as PosPaymentMethod,
  payment_reference: row.payment_reference ? String(row.payment_reference) : null,
  notes: row.notes ? String(row.notes) : null,
  created_at: String(row.created_at ?? ""),
  member:
    row.member && typeof row.member === "object"
      ? (() => {
          const member = row.member as PosRow;
          return {
            name: `${String(member.first_name ?? "")} ${String(member.last_name ?? "")}`.trim() || "Member",
            email: String(member.email ?? ""),
          };
        })()
      : null,
  items:
    Array.isArray(row.items)
      ? row.items.map((item) => {
          const value = item as PosRow;
          return {
            id: String(value.id),
            tenant_id: String(value.tenant_id),
            sale_id: String(value.sale_id),
            product_id: value.product_id ? String(value.product_id) : null,
            product_name: String(value.product_name ?? ""),
            sku: String(value.sku ?? ""),
            unit_price: toNumber(value.unit_price),
            cost_price: toNumber(value.cost_price),
            vat_rate: toNumber(value.vat_rate),
            quantity: toNumber(value.quantity),
            returned_quantity: toNumber(value.returned_quantity),
            line_subtotal: toNumber(value.line_subtotal),
            line_discount: toNumber(value.line_discount),
            line_vat: toNumber(value.line_vat),
            line_total: toNumber(value.line_total),
            created_at: String(value.created_at ?? ""),
          };
        })
      : [],
});

const unwrapRpcResult = <T>(data: unknown): T => {
  if (Array.isArray(data)) return (data[0] ?? {}) as T;
  return data as T;
};

export async function listPosCategories(tenantId: string): Promise<PosCategory[]> {
  const { data, error } = await posClient
    .from("pos_categories")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .order("name");
  if (error) throw new Error(getErrorMessage(error, "Unable to load product categories."));
  return (data ?? []).map(normalizeCategory);
}

export async function createPosCategory(
  tenantId: string,
  input: Pick<PosCategory, "name" | "color">,
): Promise<PosCategory> {
  const { data, error } = await posClient
    .from("pos_categories")
    .insert({ tenant_id: tenantId, name: input.name.trim(), color: input.color })
    .select()
    .single();
  if (error) throw new Error(getErrorMessage(error, "Unable to create the category."));
  return normalizeCategory(data);
}

export async function listPosProducts(tenantId: string): Promise<PosProduct[]> {
  const { data, error } = await posClient
    .from("pos_products")
    .select("*, category:pos_categories(id,name,color)")
    .eq("tenant_id", tenantId)
    .order("name");
  if (error) throw new Error(getErrorMessage(error, "Unable to load products."));
  return (data ?? []).map(normalizeProduct);
}

export async function createPosProduct(
  tenantId: string,
  input: PosProductInput,
): Promise<PosProduct> {
  const openingStock = Math.max(0, input.stock_quantity ?? 0);
  const { data, error } = await posClient
    .from("pos_products")
    .insert({
      tenant_id: tenantId,
      category_id: input.category_id || null,
      name: input.name.trim(),
      sku: input.sku.trim(),
      barcode: input.barcode?.trim() || null,
      description: input.description?.trim() || null,
      price: input.price,
      cost_price: input.cost_price,
      vat_rate: input.vat_rate,
      stock_quantity: 0,
      reorder_level: input.reorder_level,
      track_inventory: input.track_inventory,
      image_url: input.image_url || null,
      is_active: input.is_active,
    })
    .select("*, category:pos_categories(id,name,color)")
    .single();
  if (error) throw new Error(getErrorMessage(error, "Unable to create the product."));
  let product = normalizeProduct(data);
  if (openingStock > 0 && input.track_inventory) {
    const result = await adjustPosInventory(product.id, openingStock, "opening", "Opening stock");
    product = { ...product, stock_quantity: result.stock_quantity };
  }
  return product;
}

export async function updatePosProduct(
  tenantId: string,
  productId: string,
  input: PosProductInput,
): Promise<PosProduct> {
  const { data, error } = await posClient
    .from("pos_products")
    .update({
      category_id: input.category_id || null,
      name: input.name.trim(),
      sku: input.sku.trim(),
      barcode: input.barcode?.trim() || null,
      description: input.description?.trim() || null,
      price: input.price,
      cost_price: input.cost_price,
      vat_rate: input.vat_rate,
      reorder_level: input.reorder_level,
      track_inventory: input.track_inventory,
      image_url: input.image_url || null,
      is_active: input.is_active,
    })
    .eq("id", productId)
    .eq("tenant_id", tenantId)
    .select("*, category:pos_categories(id,name,color)")
    .single();
  if (error) throw new Error(getErrorMessage(error, "Unable to update the product."));
  return normalizeProduct(data);
}

export async function adjustPosInventory(
  productId: string,
  quantityDelta: number,
  movementType: PosMovementType,
  reason: string,
): Promise<{ product_id: string; stock_quantity: number }> {
  const { data, error } = await posClient.rpc("adjust_pos_inventory", {
    p_product_id: productId,
    p_quantity_delta: quantityDelta,
    p_movement_type: movementType,
    p_reason: reason.trim() || null,
  });
  if (error) throw new Error(getErrorMessage(error, "Unable to adjust inventory."));
  const result = unwrapRpcResult<{ product_id: string; stock_quantity: number }>(data);
  return { product_id: result.product_id, stock_quantity: toNumber(result.stock_quantity) };
}

export async function listPosSales(tenantId: string): Promise<PosSale[]> {
  const { data, error } = await posClient
    .from("pos_sales")
    .select("*, member:members(first_name,last_name,email), items:pos_sale_items(*)")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(150);
  if (error) throw new Error(getErrorMessage(error, "Unable to load sales history."));
  return (data ?? []).map(normalizeSale);
}

export async function completePosSale(input: {
  memberId?: string | null;
  discount: number;
  paymentMethod: PosPaymentMethod;
  paymentReference?: string;
  notes?: string;
  items: PosSaleInputItem[];
  currency: string;
}): Promise<PosSaleReceipt> {
  const { data, error } = await posClient.rpc("complete_pos_sale", {
    p_member_id: input.memberId || null,
    p_discount: input.discount,
    p_payment_method: input.paymentMethod,
    p_payment_reference: input.paymentReference?.trim() || null,
    p_notes: input.notes?.trim() || null,
    p_items: input.items,
    p_currency: input.currency,
  });
  if (error) throw new Error(getErrorMessage(error, "Unable to complete the sale."));
  const result = unwrapRpcResult<PosSaleReceipt>(data);
  return {
    sale_id: result.sale_id,
    sale_number: result.sale_number,
    subtotal: toNumber(result.subtotal),
    discount_total: toNumber(result.discount_total),
    vat_total: toNumber(result.vat_total),
    total: toNumber(result.total),
    currency: String(result.currency ?? input.currency),
  };
}

export async function returnPosSale(
  saleId: string,
  items: PosReturnInputItem[],
  reason: string,
): Promise<PosReturnResult> {
  const { data, error } = await posClient.rpc("return_pos_sale", {
    p_sale_id: saleId,
    p_items: items,
    p_reason: reason.trim() || null,
  });
  if (error) throw new Error(getErrorMessage(error, "Unable to process the return."));
  const result = unwrapRpcResult<PosReturnResult>(data);
  return {
    return_id: result.return_id,
    return_number: result.return_number,
    sale_id: result.sale_id,
    total: toNumber(result.total),
  };
}

export async function listPosStockMovements(
  tenantId: string,
  productId: string,
): Promise<PosStockMovement[]> {
  const { data, error } = await posClient
    .from("pos_stock_movements")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("product_id", productId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(getErrorMessage(error, "Unable to load stock movements."));
  return (data ?? []) as PosStockMovement[];
}
