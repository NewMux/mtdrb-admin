export type PosPaymentMethod =
  | "cash"
  | "card"
  | "bank_transfer"
  | "digital_wallet"
  | "other";

export type PosSaleStatus =
  | "completed"
  | "partially_returned"
  | "returned"
  | "voided";

export type PosMovementType =
  | "opening"
  | "purchase"
  | "adjustment"
  | "damage";

export interface PosCategory {
  id: string;
  tenant_id: string;
  name: string;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PosProduct {
  id: string;
  tenant_id: string;
  category_id: string | null;
  name: string;
  sku: string;
  barcode: string | null;
  description: string | null;
  price: number;
  cost_price: number;
  vat_rate: number;
  stock_quantity: number;
  reorder_level: number;
  track_inventory: boolean;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category?: Pick<PosCategory, "id" | "name" | "color"> | null;
}

export interface PosStockMovement {
  id: string;
  tenant_id: string;
  product_id: string;
  movement_type: string;
  quantity_delta: number;
  quantity_before: number;
  quantity_after: number;
  reason: string | null;
  reference_type: string | null;
  reference_id: string | null;
  created_by: string;
  created_at: string;
}

export interface PosSale {
  id: string;
  tenant_id: string;
  sale_number: string;
  member_id: string | null;
  cashier_id: string;
  status: PosSaleStatus;
  subtotal: number;
  discount_total: number;
  vat_total: number;
  total: number;
  currency: string;
  payment_method: PosPaymentMethod;
  payment_reference: string | null;
  notes: string | null;
  created_at: string;
  member?: { name: string; email: string } | null;
  items?: PosSaleItem[];
}

export interface PosSaleItem {
  id: string;
  tenant_id: string;
  sale_id: string;
  product_id: string | null;
  product_name: string;
  sku: string;
  unit_price: number;
  cost_price: number;
  vat_rate: number;
  quantity: number;
  returned_quantity: number;
  line_subtotal: number;
  line_discount: number;
  line_vat: number;
  line_total: number;
  created_at: string;
}

export interface PosReturn {
  id: string;
  tenant_id: string;
  sale_id: string;
  return_number: string;
  cashier_id: string;
  reason: string | null;
  status: "completed" | "cancelled";
  total: number;
  created_at: string;
  items?: PosReturnItem[];
}

export interface PosReturnItem {
  id: string;
  tenant_id: string;
  return_id: string;
  sale_item_id: string;
  product_id: string | null;
  quantity: number;
  line_total: number;
  created_at: string;
}

export interface PosCartItem {
  product: PosProduct;
  quantity: number;
}

export interface PosSaleInputItem {
  product_id: string;
  quantity: number;
}

export interface PosSaleReceipt {
  sale_id: string;
  sale_number: string;
  subtotal: number;
  discount_total: number;
  vat_total: number;
  total: number;
  currency: string;
}

export interface PosReturnInputItem {
  sale_item_id: string;
  quantity: number;
}

export interface PosReturnResult {
  return_id: string;
  return_number: string;
  sale_id: string;
  total: number;
}

export interface PosProductInput {
  category_id?: string | null;
  name: string;
  sku: string;
  barcode?: string | null;
  description?: string | null;
  price: number;
  cost_price: number;
  vat_rate: number;
  stock_quantity?: number;
  reorder_level: number;
  track_inventory: boolean;
  image_url?: string | null;
  is_active: boolean;
}
