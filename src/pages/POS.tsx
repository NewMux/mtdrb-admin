import React from "react";
import { motion } from "framer-motion";
import {
  FiBarChart2,
  FiCheck,
  FiCreditCard,
  FiEdit2,
  FiFileText,
  FiHash,
  FiMinus,
  FiPackage,
  FiPlus,
  FiPrinter,
  FiRefreshCw,
  FiRotateCcw,
  FiSearch,
  FiShoppingCart,
  FiTag,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useGymConfig } from "../contexts/gym-config-context";
import { taxRateToApply } from "../config/gymConfig";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../supabaseClient";
import { useRTL } from "../hooks/useRTL";
import type {
  PosCartItem,
  PosCategory,
  PosMovementType,
  PosPaymentMethod,
  PosProduct,
  PosProductInput,
  PosReturnInputItem,
  PosSale,
  PosSaleReceipt,
} from "../types/pos";
import {
  adjustPosInventory,
  completePosSale,
  createPosCategory,
  createPosProduct,
  listPosCategories,
  listPosProducts,
  listPosSales,
  returnPosSale,
  updatePosProduct,
} from "../services/posService";
import { PageHeader } from "../components/ui/PageHeader";
import { StatStrip } from "../components/ui/StatStrip";
import { computePosTotals, moneyInputStep, type PosCartLine } from "../utils/posMath";
import { getCurrencyDecimals } from "../utils/invoiceMath";

interface MemberOption {
  id: string;
  name: string;
  email: string;
}

type PosTab = "checkout" | "inventory" | "sales";
type PosModal = "product" | "stock" | "checkout" | "receipt" | "return" | "category" | null;

type ModalProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
};

const ModalShell = ({ open, title, description, onClose, children, wide = false }: ModalProps) => {
  const { t } = useTranslation();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label={t("pos.close")}
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className={`relative z-10 max-h-[90vh] w-full overflow-y-auto rounded-3xl bg-white shadow-2xl dark:bg-slate-900 ${wide ? "max-w-3xl" : "max-w-xl"}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pos-modal-title"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white/95 px-6 py-5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
          <div>
            <h2 id="pos-modal-title" className="text-xl font-bold text-slate-900 dark:text-white">{title}</h2>
            {description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>}
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800" aria-label={t("pos.close")}>
            <FiX className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </motion.div>
    </div>
  );
};

const formatMoney = (value: number, currency: string) => {
  const decimals = getCurrencyDecimals(currency);
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency, minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
  } catch {
    return `${currency} ${value.toFixed(decimals)}`;
  }
};

// The cart as posMath sees it. Totals everywhere (cart panel, checkout dialog)
// come from computePosTotals, which mirrors complete_pos_sale() exactly.
const toPosLines = (cart: PosCartItem[]): PosCartLine[] =>
  cart.map((item) => ({ price: item.product.price, quantity: item.quantity, vatRate: item.product.vat_rate }));

const formatDateTime = (value: string) => new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

const getInitials = (name: string) => name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();

const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-sky-900/40";
const labelClass = "mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400";

function ProductModal({
  open,
  product,
  categories,
  tenantId,
  onClose,
  onSaved,
  currency,
}: {
  open: boolean;
  product: PosProduct | null;
  categories: PosCategory[];
  tenantId: string;
  currency: string;
  onClose: () => void;
  onSaved: (product: PosProduct) => void;
}) {
  const { t } = useTranslation();
  // A new product starts at the gym's own tax rate, not 0%.
  const { config: gymConfig } = useGymConfig();
  const defaultVatRate = taxRateToApply(gymConfig);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState<PosProductInput>({
    name: product?.name ?? "",
    sku: product?.sku ?? "",
    barcode: product?.barcode ?? "",
    description: product?.description ?? "",
    category_id: product?.category_id ?? null,
    price: product?.price ?? 0,
    cost_price: product?.cost_price ?? 0,
    vat_rate: product?.vat_rate ?? defaultVatRate,
    stock_quantity: product?.stock_quantity ?? 0,
    reorder_level: product?.reorder_level ?? 0,
    track_inventory: product?.track_inventory ?? true,
    image_url: product?.image_url ?? null,
    is_active: product?.is_active ?? true,
  });

  React.useEffect(() => {
    setForm({
      name: product?.name ?? "",
      sku: product?.sku ?? "",
      barcode: product?.barcode ?? "",
      description: product?.description ?? "",
      category_id: product?.category_id ?? null,
      price: product?.price ?? 0,
      cost_price: product?.cost_price ?? 0,
      vat_rate: product?.vat_rate ?? defaultVatRate,
      stock_quantity: product?.stock_quantity ?? 0,
      reorder_level: product?.reorder_level ?? 0,
      track_inventory: product?.track_inventory ?? true,
      image_url: product?.image_url ?? null,
      is_active: product?.is_active ?? true,
    });
  }, [product, open, defaultVatRate]);

  const update = <K extends keyof PosProductInput>(key: K, value: PosProductInput[K]) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || !form.sku.trim() || form.price < 0) {
      toast.error(t("pos.enterProductDetails"));
      return;
    }
    setSaving(true);
    try {
      const saved = product
        ? await updatePosProduct(tenantId, product.id, form)
        : await createPosProduct(tenantId, form);
      onSaved(saved);
      toast.success(product ? t("pos.productUpdated") : t("pos.productCreated"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("pos.unableToSaveProduct"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell open={open} title={product ? t("pos.editProduct") : t("pos.addProduct")} description={t("pos.productDescription")} onClose={onClose} wide>
      <form onSubmit={submit} className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div><label className={labelClass}>{t("pos.productName")}</label><input className={inputClass} value={form.name} onChange={(event) => update("name", event.target.value)} placeholder={t("pos.productPlaceholder")} required /></div>
          <div><label className={labelClass}>{t("pos.sku")}</label><input className={inputClass} value={form.sku} onChange={(event) => update("sku", event.target.value)} placeholder={t("pos.skuPlaceholder")} required /></div>
          <div><label className={labelClass}>{t("pos.barcode")}</label><input className={inputClass} value={form.barcode ?? ""} onChange={(event) => update("barcode", event.target.value)} placeholder={t("pos.barcodePlaceholder")} /></div>
          <div><label className={labelClass}>{t("pos.category")}</label><select className={inputClass} value={form.category_id ?? ""} onChange={(event) => update("category_id", event.target.value || null)}><option value="">{t("pos.uncategorized")}</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></div>
          <div><label className={labelClass}>{t("pos.sellingPrice")}</label><input className={inputClass} type="number" min="0" step={moneyInputStep(currency)} value={form.price} onChange={(event) => update("price", Number(event.target.value))} required /></div>
          <div><label className={labelClass}>{t("pos.costPrice")}</label><input className={inputClass} type="number" min="0" step={moneyInputStep(currency)} value={form.cost_price} onChange={(event) => update("cost_price", Number(event.target.value))} /></div>
          <div><label className={labelClass}>{t("pos.vatRate")}</label><input className={inputClass} type="number" min="0" max="100" step="0.01" value={form.vat_rate} onChange={(event) => update("vat_rate", Number(event.target.value))} /></div>
          <div><label className={labelClass}>{t("pos.reorderLevel")}</label><input className={inputClass} type="number" min="0" step="0.001" value={form.reorder_level} onChange={(event) => update("reorder_level", Number(event.target.value))} /></div>
        </div>
        {!product && <div><label className={labelClass}>{t("pos.openingStock")}</label><input className={inputClass} type="number" min="0" step="0.001" value={form.stock_quantity ?? 0} onChange={(event) => update("stock_quantity", Number(event.target.value))} /></div>}
        <div><label className={labelClass}>{t("pos.description")}</label><textarea className={`${inputClass} min-h-24`} value={form.description ?? ""} onChange={(event) => update("description", event.target.value)} placeholder={t("pos.optionalProductDetails")} /></div>
        <div className="flex flex-wrap gap-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200"><input type="checkbox" checked={form.track_inventory} onChange={(event) => update("track_inventory", event.target.checked)} /> {t("pos.trackInventory")}</label>
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200"><input type="checkbox" checked={form.is_active} onChange={(event) => update("is_active", event.target.checked)} /> {t("pos.availableAtCheckout")}</label>
        </div>
        <div className="flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">{t("pos.cancel")}</button><button disabled={saving} type="submit" className="rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-sky-700 disabled:opacity-50">{saving ? t("pos.saving") : product ? t("pos.saveChanges") : t("pos.createProduct")}</button></div>
      </form>
    </ModalShell>
  );
}

function StockAdjustmentModal({
  open,
  product,
  onClose,
  onSaved,
}: {
  open: boolean;
  product: PosProduct | null;
  onClose: () => void;
  onSaved: (productId: string, stock: number) => void;
}) {
  const { t } = useTranslation();
  const [saving, setSaving] = React.useState(false);
  const [movementType, setMovementType] = React.useState<PosMovementType>("adjustment");
  const [quantity, setQuantity] = React.useState(0);
  const [reason, setReason] = React.useState("");

  React.useEffect(() => {
    setMovementType("adjustment");
    setQuantity(0);
    setReason("");
  }, [product, open]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!product || quantity === 0) {
      toast.error(t("pos.enterStockAdjustment"));
      return;
    }
    setSaving(true);
    try {
      const result = await adjustPosInventory(product.id, quantity, movementType, reason);
      onSaved(product.id, result.stock_quantity);
      toast.success(t("pos.inventoryUpdated"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("pos.unableToUpdateInventory"));
    } finally {
      setSaving(false);
    }
  };

  return <ModalShell open={open} title={t("pos.adjustStock")} description={product ? t("pos.currentStock", { name: product.name, stock: product.stock_quantity }) : undefined} onClose={onClose}>
    <form onSubmit={submit} className="space-y-5">
      <div><label className={labelClass}>{t("pos.movementType")}</label><select className={inputClass} value={movementType} onChange={(event) => setMovementType(event.target.value as PosMovementType)}><option value="adjustment">{t("pos.manualAdjustment")}</option><option value="purchase">{t("pos.receivedPurchase")}</option><option value="opening">{t("pos.openingBalance")}</option><option value="damage">{t("pos.damageShrinkage")}</option></select></div>
      <div><label className={labelClass}>{t("pos.quantityChange")}</label><input className={inputClass} type="number" step="0.001" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} placeholder={t("pos.removeStockHint")} required /><p className="mt-1 text-xs text-slate-500">{t("pos.addRemoveStockHint")}</p></div>
      <div><label className={labelClass}>{t("pos.reason")}</label><textarea className={`${inputClass} min-h-24`} value={reason} onChange={(event) => setReason(event.target.value)} placeholder={t("pos.stockChangeReason")} required /></div>
      <div className="flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">Cancel</button><button disabled={saving} type="submit" className="rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50">{saving ? t("pos.updating") : t("pos.updateStock")}</button></div>
    </form>
  </ModalShell>;
}

function CategoryModal({ open, tenantId, onClose, onSaved }: { open: boolean; tenantId: string; onClose: () => void; onSaved: (category: PosCategory) => void }) {
  const { t } = useTranslation();
  const [name, setName] = React.useState("");
  const [color, setColor] = React.useState("#0ea5e9");
  const [saving, setSaving] = React.useState(false);
  React.useEffect(() => { if (open) { setName(""); setColor("#0ea5e9"); } }, [open]);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try { const category = await createPosCategory(tenantId, { name, color }); onSaved(category); toast.success(t("pos.categoryCreated")); }
    catch (error) { toast.error(error instanceof Error ? error.message : t("pos.unableToCreateCategory")); }
    finally { setSaving(false); }
  };
  return <ModalShell open={open} title={t("pos.addCategory")} description={t("pos.organizeCatalog")} onClose={onClose}><form onSubmit={submit} className="space-y-5"><div><label className={labelClass}>{t("pos.categoryName")}</label><input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} placeholder={t("pos.categoryPlaceholder")} required /></div><div><label className={labelClass}>{t("pos.accentColor")}</label><div className="flex items-center gap-3"><input type="color" value={color} onChange={(event) => setColor(event.target.value)} className="h-11 w-14 rounded-lg border border-slate-200 bg-white" /><input className={inputClass} value={color} onChange={(event) => setColor(event.target.value)} /></div></div><div className="flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">{t("pos.cancel")}</button><button disabled={saving} className="rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50">{saving ? t("pos.creating") : t("pos.createCategory")}</button></div></form></ModalShell>;
}

function CheckoutModal({
  open,
  cart,
  members,
  memberId,
  discount,
  currency,
  onClose,
  onCompleted,
}: {
  open: boolean;
  cart: PosCartItem[];
  members: MemberOption[];
  memberId: string;
  discount: number;
  currency: string;
  onClose: () => void;
  onCompleted: (receipt: PosSaleReceipt) => void;
}) {
  const { t } = useTranslation();
  const [paymentMethod, setPaymentMethod] = React.useState<PosPaymentMethod>("cash");
  const [paymentReference, setPaymentReference] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const { subtotal, discount: discountTotal, vat: vatTotal, total } = computePosTotals(toPosLines(cart), discount, currency);
  const selectedMember = members.find((member) => member.id === memberId);

  React.useEffect(() => { if (open) { setPaymentMethod("cash"); setPaymentReference(""); setNotes(""); } }, [open]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const receipt = await completePosSale({ memberId: memberId || null, discount: discountTotal, paymentMethod, paymentReference, notes, currency, items: cart.map((item) => ({ product_id: item.product.id, quantity: item.quantity })) });
      onCompleted(receipt);
      toast.success(t("pos.saleCompleted"));
    } catch (error) { toast.error(error instanceof Error ? error.message : t("pos.unableToCompleteSale")); }
    finally { setSaving(false); }
  };

  return <ModalShell open={open} title={t("pos.completeCheckout")} description={t("pos.confirmPayment")} onClose={onClose} wide><form onSubmit={submit} className="space-y-6"><div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60"><div className="flex items-center justify-between text-sm text-slate-500"><span>{t("pos.productLines", { count: cart.length })}</span><span>{selectedMember ? selectedMember.name : t("pos.walkInCustomer")}</span></div><div className="mt-4 space-y-2">{cart.map((item) => <div key={item.product.id} className="flex justify-between gap-4 text-sm"><span className="text-slate-700 dark:text-slate-200">{item.product.name} × {item.quantity}</span><span className="font-semibold text-slate-900 dark:text-white">{formatMoney(item.product.price * item.quantity, currency)}</span></div>)}</div><div className="mt-4 border-t border-slate-200 pt-3 dark:border-slate-700"><div className="flex justify-between text-sm text-slate-500"><span>{t("pos.subtotal")}</span><span>{formatMoney(subtotal, currency)}</span></div><div className="flex justify-between text-sm text-slate-500"><span>{t("pos.discount")}</span><span>-{formatMoney(discountTotal, currency)}</span></div><div className="flex justify-between text-sm text-slate-500"><span>{t("pos.vat")}</span><span>{formatMoney(vatTotal, currency)}</span></div><div className="mt-2 flex justify-between text-lg font-bold text-slate-900 dark:text-white"><span>{t("pos.total")}</span><span>{formatMoney(total, currency)}</span></div></div></div><div className="grid gap-4 md:grid-cols-2"><div><label className={labelClass}>{t("pos.paymentMethod")}</label><select className={inputClass} value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as PosPaymentMethod)}><option value="cash">{t("pos.cash")}</option><option value="card">{t("pos.cardTerminal")}</option><option value="bank_transfer">{t("pos.bankTransfer")}</option><option value="digital_wallet">{t("pos.digitalWallet")}</option><option value="other">{t("pos.other")}</option></select></div><div><label className={labelClass}>{t("pos.paymentReference")}</label><input className={inputClass} value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} placeholder={t("pos.paymentReferencePlaceholder")} /></div></div><div><label className={labelClass}>{t("pos.saleNotes")}</label><textarea className={`${inputClass} min-h-24`} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder={t("pos.saleNotesPlaceholder")} /></div><div className="flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">{t("pos.back")}</button><button disabled={saving} type="submit" className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-emerald-700 disabled:opacity-50"><FiCheck />{saving ? t("pos.processing") : t("pos.completeAmount", { amount: formatMoney(total, currency) })}</button></div></form></ModalShell>;
}

function ReceiptModal({ open, receipt, currency, onClose }: { open: boolean; receipt: PosSaleReceipt | null; currency: string; onClose: () => void }) {
  const { t } = useTranslation();
  const { config: gymConfig } = useGymConfig();
  if (!receipt) return null;
  const business = gymConfig.business;
  const taxNumber = gymConfig.tax.enabled ? gymConfig.tax.number : "";
  const printReceipt = () => window.print();
  return <ModalShell open={open} title={t("pos.saleReceipt")} description={t("pos.receipt", { number: receipt.sale_number })} onClose={onClose}><div className="receipt-print-area rounded-2xl border border-slate-200 p-5 dark:border-slate-700"><div className="text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center text-emerald-700 dark:text-emerald-300"><FiCheck className="h-6 w-6" /></div><h3 className="mt-3 text-base font-semibold text-slate-900 dark:text-white">{t("pos.paymentRecorded")}</h3>{(business.legalName || business.address || taxNumber) && <div className="mt-2 text-xs text-slate-500">{business.legalName && <p className="font-semibold">{business.legalName}</p>}{business.address && <p>{business.address}</p>}{taxNumber && <p>{gymConfig.tax.name}: {taxNumber}</p>}</div>}<p className="mt-1 text-sm text-slate-500">{receipt.sale_number}</p></div><div className="mt-6 space-y-3 text-sm"><div className="flex justify-between text-slate-500"><span>{t("pos.subtotal")}</span><span>{formatMoney(receipt.subtotal, currency)}</span></div><div className="flex justify-between text-slate-500"><span>{t("pos.discount")}</span><span>-{formatMoney(receipt.discount_total, currency)}</span></div>{receipt.tax_breakdown && receipt.tax_breakdown.length > 1 ? receipt.tax_breakdown.map((line) => <div key={line.name} className="flex justify-between text-slate-500"><span>{line.name} ({line.rate}%)</span><span>{formatMoney(line.amount, currency)}</span></div>) : <div className="flex justify-between text-slate-500"><span>{gymConfig.tax.name}</span><span>{formatMoney(receipt.vat_total, currency)}</span></div>}<div className="flex justify-between border-t border-slate-200 pt-3 text-lg font-bold text-slate-900 dark:border-slate-700 dark:text-white"><span>{t("pos.total")}</span><span>{formatMoney(receipt.total, currency)}</span></div></div></div><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">{t("pos.close")}</button><button type="button" onClick={printReceipt} className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700"><FiPrinter />{t("pos.printReceipt")}</button></div></ModalShell>;
}

function ReturnModal({ open, sale, currency, onClose, onReturned }: { open: boolean; sale: PosSale | null; currency: string; onClose: () => void; onReturned: () => void }) {
  const { t } = useTranslation();
  const [items, setItems] = React.useState<PosReturnInputItem[]>([]);
  const [reason, setReason] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setItems((sale?.items ?? []).filter((item) => item.quantity > item.returned_quantity).map((item) => ({ sale_item_id: item.id, quantity: 0 })));
    setReason("");
  }, [sale, open]);

  if (!sale) return null;
  const remainingItems = sale.items?.filter((item) => item.quantity > item.returned_quantity) ?? [];
  const setQuantity = (saleItemId: string, quantity: number) => setItems((current) => current.map((item) => item.sale_item_id === saleItemId ? { ...item, quantity } : item));
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const selected = items.filter((item) => item.quantity > 0);
    if (!selected.length) { toast.error(t("pos.selectReturnQuantity")); return; }
    setSaving(true);
    try { await returnPosSale(sale.id, selected, reason); toast.success(t("pos.returnProcessed")); onReturned(); }
    catch (error) { toast.error(error instanceof Error ? error.message : t("pos.unableToProcessReturn")); }
    finally { setSaving(false); }
  };
  return <ModalShell open={open} title={t("pos.processReturn")} description={t("pos.chooseQuantities", { number: sale.sale_number })} onClose={onClose} wide><form onSubmit={submit} className="space-y-5"><div className="space-y-3">{remainingItems.length === 0 ? <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-800/60">{t("pos.allReturned")}</div> : remainingItems.map((item) => { const selected = items.find((entry) => entry.sale_item_id === item.id); const remaining = item.quantity - item.returned_quantity; return <div key={item.id} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4 dark:border-slate-700"><div><p className="font-semibold text-slate-900 dark:text-white">{item.product_name}</p><p className="text-xs text-slate-500">{item.sku} · {formatMoney(item.line_total / item.quantity, currency)} each · {t("pos.available", { count: remaining })}</p></div><input aria-label={t("pos.returnQuantity", { name: item.product_name })} className={`${inputClass} max-w-28`} type="number" min="0" max={remaining} step="0.001" value={selected?.quantity ?? 0} onChange={(event) => setQuantity(item.id, Math.min(remaining, Math.max(0, Number(event.target.value))))} /></div>; })}</div><div><label className={labelClass}>{t("pos.returnReason")}</label><textarea className={`${inputClass} min-h-24`} value={reason} onChange={(event) => setReason(event.target.value)} placeholder={t("pos.returnReasonPlaceholder")} required /></div><div className="flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">{t("pos.cancel")}</button><button disabled={saving || remainingItems.length === 0} type="submit" className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"><FiRotateCcw />{saving ? t("pos.processing") : t("pos.processReturn")}</button></div></form></ModalShell>;
}

const POS = () => {
  const { t } = useTranslation();
  const { tenantId } = useAuth();
  const { isRTL } = useRTL();
  const [activeTab, setActiveTab] = React.useState<PosTab>("checkout");
  const [products, setProducts] = React.useState<PosProduct[]>([]);
  const [categories, setCategories] = React.useState<PosCategory[]>([]);
  const [sales, setSales] = React.useState<PosSale[]>([]);
  const [members, setMembers] = React.useState<MemberOption[]>([]);
  const [cart, setCart] = React.useState<PosCartItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [inventorySearch, setInventorySearch] = React.useState("");
  const [salesSearch, setSalesSearch] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("all");
  const [saleStatusFilter, setSaleStatusFilter] = React.useState("all");
  const [memberId, setMemberId] = React.useState("");
  const [discount, setDiscount] = React.useState(0);
  const [modal, setModal] = React.useState<PosModal>(null);
  const [selectedProduct, setSelectedProduct] = React.useState<PosProduct | null>(null);
  const [selectedSale, setSelectedSale] = React.useState<PosSale | null>(null);
  const [receipt, setReceipt] = React.useState<PosSaleReceipt | null>(null);

  const { config: gymConfig } = useGymConfig();
  const currency = gymConfig.currency;

  const load = React.useCallback(async () => {
    if (!tenantId) return;
    setRefreshing(true);
    setError("");
    try {
      const [loadedCategories, loadedProducts, loadedSales, memberResult] = await Promise.all([
        listPosCategories(tenantId),
        listPosProducts(tenantId),
        listPosSales(tenantId),
        supabase.from("members").select("id, first_name, last_name, email").eq("tenant_id", tenantId).order("first_name").limit(250),
      ]);
      if (memberResult.error) throw memberResult.error;
      setCategories(loadedCategories);
      setProducts(loadedProducts);
      setSales(loadedSales);
      setMembers((memberResult.data ?? []).map((member) => ({ id: member.id, name: `${member.first_name} ${member.last_name}`.trim(), email: member.email })));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load POS data. Apply the POS database migration, then try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tenantId]);

  React.useEffect(() => { void load(); }, [load]);

  const activeProducts = React.useMemo(() => products.filter((product) => product.is_active), [products]);
  const filteredProducts = React.useMemo(() => activeProducts.filter((product) => {
    const query = search.trim().toLowerCase();
    const matchesQuery = !query || [product.name, product.sku, product.barcode ?? ""].some((value) => value.toLowerCase().includes(query));
    const matchesCategory = categoryFilter === "all" || product.category_id === categoryFilter;
    return matchesQuery && matchesCategory;
  }), [activeProducts, categoryFilter, search]);
  const filteredInventory = React.useMemo(() => products.filter((product) => {
    const query = inventorySearch.trim().toLowerCase();
    return !query || [product.name, product.sku, product.barcode ?? ""].some((value) => value.toLowerCase().includes(query));
  }), [inventorySearch, products]);
  const filteredSales = React.useMemo(() => sales.filter((sale) => {
    const query = salesSearch.trim().toLowerCase();
    const matchesQuery = !query || sale.sale_number.toLowerCase().includes(query) || (sale.member?.name ?? "").toLowerCase().includes(query);
    return matchesQuery && (saleStatusFilter === "all" || sale.status === saleStatusFilter);
  }), [sales, saleStatusFilter, salesSearch]);
  const lowStock = products.filter((product) => product.track_inventory && product.stock_quantity <= product.reorder_level);
  const todaySales = sales.filter((sale) => new Date(sale.created_at).toDateString() === new Date().toDateString() && sale.status !== "voided");
  const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0);
  const { subtotal: cartSubtotal, discount: cartDiscount, vat: cartVat, total: cartTotal } = computePosTotals(toPosLines(cart), discount, currency);

  const addToCart = (product: PosProduct) => {
    setCart((current) => {
      const existing = current.find((item) => item.product.id === product.id);
      if (!existing) return [...current, { product, quantity: 1 }];
      const nextQuantity = existing.quantity + 1;
      if (product.track_inventory && nextQuantity > product.stock_quantity) { toast.error(t("pos.notEnoughStock")); return current; }
      return current.map((item) => item.product.id === product.id ? { ...item, quantity: nextQuantity } : item);
    });
  };
  const updateCartQuantity = (productId: string, quantity: number) => setCart((current) => current.flatMap((item) => {
    if (item.product.id !== productId) return [item];
    const max = item.product.track_inventory ? item.product.stock_quantity : Number.POSITIVE_INFINITY;
    const next = Math.min(max, quantity);
    return next > 0 ? [{ ...item, quantity: next }] : [];
  }));
  const removeFromCart = (productId: string) => setCart((current) => current.filter((item) => item.product.id !== productId));

  const saveProduct = (product: PosProduct) => { setProducts((current) => { const exists = current.some((entry) => entry.id === product.id); return exists ? current.map((entry) => entry.id === product.id ? product : entry) : [...current, product]; }); setModal(null); };
  const adjustProductStock = (productId: string, stock: number) => { setProducts((current) => current.map((product) => product.id === productId ? { ...product, stock_quantity: stock } : product)); setModal(null); };
  const completeSale = (result: PosSaleReceipt) => { setCart([]); setDiscount(0); setMemberId(""); setReceipt(result); setModal("receipt"); void load(); };
  const processReturn = () => { setModal(null); setSelectedSale(null); void load(); };

  const tabs: { id: PosTab; label: string; icon: React.ElementType; helper: string }[] = [
    { id: "checkout", label: t("pos.checkout"), icon: FiShoppingCart, helper: t("pos.sellProducts") },
    { id: "inventory", label: t("pos.inventory"), icon: FiPackage, helper: t("pos.manageStock") },
    { id: "sales", label: t("pos.salesHistory"), icon: FiBarChart2, helper: t("pos.receiptsReturns") },
  ];

  return <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
    <PageHeader title={t("pos.title")} subtitle={t("pos.subtitle")} actions={<><button type="button" onClick={() => void load()} className="btn btn-secondary"><FiRefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />{t("pos.refresh")}</button><button type="button" onClick={() => { setCart([]); setDiscount(0); setMemberId(""); setActiveTab("checkout"); }} className="btn btn-primary"><FiPlus className="w-3.5 h-3.5" />{t("pos.newSale")}</button></>} />

    <StatStrip items={[{ label: t("pos.todayRevenue"), value: formatMoney(todayRevenue, currency), detail: t("pos.completedSales", { count: todaySales.length }) }, { label: t("pos.catalogProducts"), value: String(activeProducts.length), detail: t("pos.activeCategories", { count: categories.length }) }, { label: t("pos.lowStock"), value: String(lowStock.length), detail: lowStock.length ? t("pos.needsAttention") : t("pos.stockHealthy") }, { label: t("pos.averageSale"), value: formatMoney(todaySales.length ? todayRevenue / todaySales.length : 0, currency), detail: t("pos.today") }]} />

    {loading && !error && <div className="rounded-xl bg-gray-50 p-5 text-sm text-slate-500 dark:bg-gray-800">{t("pos.loadingWorkspace")}</div>}
    {error && <div className="flex items-start justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-900/20 dark:text-amber-200"><div><p className="font-bold">{t("pos.setupRequired")}</p><p className="mt-1">{error}</p></div><button type="button" onClick={() => void load()} className="rounded-lg p-2 hover:bg-amber-100 dark:hover:bg-amber-900/30"><FiRefreshCw /></button></div>}

    <div role="tablist" className="mac-segmented max-w-full overflow-x-auto self-start">{tabs.map((tab) => { const Icon = tab.icon; const active = activeTab === tab.id; return <button key={tab.id} type="button" role="tab" aria-selected={active} title={tab.helper} onClick={() => setActiveTab(tab.id)} className={`mac-segment whitespace-nowrap ${active ? "mac-segment-active" : "hover:text-gray-900 dark:hover:text-white"}`}><Icon className="h-3.5 w-3.5" />{tab.label}</button>; })}</div>

    {activeTab === "checkout" && <CheckoutWorkspace products={filteredProducts} categories={categories} categoriesFilter={categoryFilter} setCategoryFilter={setCategoryFilter} search={search} setSearch={setSearch} cart={cart} cartSubtotal={cartSubtotal} cartDiscount={cartDiscount} cartVat={cartVat} cartTotal={cartTotal} currency={currency} members={members} memberId={memberId} setMemberId={setMemberId} discount={discount} setDiscount={setDiscount} addToCart={addToCart} updateCartQuantity={updateCartQuantity} removeFromCart={removeFromCart} onCheckout={() => cart.length ? setModal("checkout") : toast.error(t("pos.addProductsHint"))} />}
    {activeTab === "inventory" && <InventoryWorkspace products={filteredInventory} search={inventorySearch} setSearch={setInventorySearch} lowStock={lowStock} onAdd={() => { setSelectedProduct(null); setModal("product"); }} onEdit={(product) => { setSelectedProduct(product); setModal("product"); }} onAdjust={(product) => { setSelectedProduct(product); setModal("stock"); }} onAddCategory={() => setModal("category")} />}
    {activeTab === "sales" && <SalesWorkspace sales={filteredSales} search={salesSearch} setSearch={setSalesSearch} statusFilter={saleStatusFilter} setStatusFilter={setSaleStatusFilter} currency={currency} onView={(sale) => { setSelectedSale(sale); setReceipt({ sale_id: sale.id, sale_number: sale.sale_number, subtotal: sale.subtotal, discount_total: sale.discount_total, vat_total: sale.vat_total, total: sale.total, currency: sale.currency }); setModal("receipt"); }} onReturn={(sale) => { setSelectedSale(sale); setModal("return"); }} />}

    <ProductModal open={modal === "product"} product={selectedProduct} categories={categories} tenantId={tenantId ?? ""} currency={currency} onClose={() => setModal(null)} onSaved={saveProduct} />
    <StockAdjustmentModal open={modal === "stock"} product={selectedProduct} onClose={() => setModal(null)} onSaved={adjustProductStock} />
    <CategoryModal open={modal === "category"} tenantId={tenantId ?? ""} onClose={() => setModal(null)} onSaved={(category) => { setCategories((current) => [...current, category]); setModal(null); }} />
    <CheckoutModal open={modal === "checkout"} cart={cart} members={members} memberId={memberId} discount={discount} currency={currency} onClose={() => setModal(null)} onCompleted={completeSale} />
    <ReceiptModal open={modal === "receipt"} receipt={receipt} currency={currency} onClose={() => { setModal(null); setReceipt(null); }} />
    <ReturnModal open={modal === "return"} sale={selectedSale} currency={currency} onClose={() => { setModal(null); setSelectedSale(null); }} onReturned={processReturn} />
  </div>;
};


function CheckoutWorkspace({ products, categories, categoriesFilter, setCategoryFilter, search, setSearch, cart, cartSubtotal, cartDiscount, cartVat, cartTotal, currency, members, memberId, setMemberId, discount, setDiscount, addToCart, updateCartQuantity, removeFromCart, onCheckout }: { products: PosProduct[]; categories: PosCategory[]; categoriesFilter: string; setCategoryFilter: (value: string) => void; search: string; setSearch: (value: string) => void; cart: PosCartItem[]; cartSubtotal: number; cartDiscount: number; cartVat: number; cartTotal: number; currency: string; members: MemberOption[]; memberId: string; setMemberId: (value: string) => void; discount: number; setDiscount: (value: number) => void; addToCart: (product: PosProduct) => void; updateCartQuantity: (id: string, quantity: number) => void; removeFromCart: (id: string) => void; onCheckout: () => void }) {
  const { t } = useTranslation();
  return <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]"><section className="rounded-xl bg-gray-50 p-5 dark:bg-gray-800"><div className="flex flex-col gap-3 md:flex-row"><div className="relative flex-1"><FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input className={`${inputClass} pl-10`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("pos.searchProducts")} autoFocus /></div><select className={`${inputClass} md:max-w-52`} value={categoriesFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option value="all">{t("pos.allCategories")}</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></div><div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{products.map((product) => <ProductCard key={product.id} product={product} currency={currency} onAdd={() => addToCart(product)} />)}{products.length === 0 && <EmptyState icon={FiPackage} title={t("pos.noProducts")} description={t("pos.addProductsHint")} />}</div></section><CartPanel cart={cart} subtotal={cartSubtotal} discountTotal={cartDiscount} vatTotal={cartVat} total={cartTotal} currency={currency} members={members} memberId={memberId} setMemberId={setMemberId} discount={discount} setDiscount={setDiscount} updateQuantity={updateCartQuantity} removeItem={removeFromCart} onCheckout={onCheckout} /></div>;
}

function ProductCard({ product, currency, onAdd }: { product: PosProduct; currency: string; onAdd: () => void }) { const { t } = useTranslation(); const outOfStock = product.track_inventory && product.stock_quantity <= 0; const low = product.track_inventory && product.stock_quantity <= product.reorder_level; return <motion.div whileHover={{ y: -2 }} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-sky-300 hover:shadow-lg dark:border-slate-700 dark:bg-slate-950"><div className="flex h-28 items-center justify-center bg-sky-50 text-3xl font-bold text-sky-300 dark:bg-slate-800">{getInitials(product.name)}</div><div className="p-4"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><h3 className="truncate text-sm font-bold text-slate-900 dark:text-white">{product.name}</h3><p className="mt-1 flex items-center gap-1 text-xs text-slate-400"><FiHash />{product.sku}</p></div><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${outOfStock ? "bg-rose-50 text-rose-600" : low ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>{product.track_inventory ? t("pos.inStock", { count: product.stock_quantity }) : t("pos.noTracking")}</span></div><div className="mt-4 flex items-center justify-between gap-3"><span className="text-lg font-bold text-slate-900 dark:text-white">{formatMoney(product.price, currency)}</span><button type="button" disabled={outOfStock} onClick={onAdd} className="inline-flex items-center gap-1 rounded-xl bg-sky-600 px-3 py-2 text-xs font-bold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"><FiPlus />{t("common.add")}</button></div></div></motion.div>; }

function CartPanel({ cart, subtotal, discountTotal, vatTotal, total, currency, members, memberId, setMemberId, discount, setDiscount, updateQuantity, removeItem, onCheckout }: { cart: PosCartItem[]; subtotal: number; discountTotal: number; vatTotal: number; total: number; currency: string; members: MemberOption[]; memberId: string; setMemberId: (value: string) => void; discount: number; setDiscount: (value: number) => void; updateQuantity: (id: string, quantity: number) => void; removeItem: (id: string) => void; onCheckout: () => void }) { const { t } = useTranslation(); return <aside className="rounded-xl bg-gray-50 p-4 text-gray-900 dark:bg-gray-800 dark:text-white"><div className="flex items-center justify-between"><div><p className="text-xs text-gray-500 dark:text-gray-400">{t("pos.currentSale")}</p><h2 className="mt-1 text-base font-semibold">{t("pos.cart")}</h2></div><span className="rounded-full bg-black/5 dark:bg-white/10 px-3 py-1 text-xs font-bold">{t("pos.items", { count: cart.reduce((sum, item) => sum + item.quantity, 0) })}</span></div><div className="mt-5 max-h-72 space-y-3 overflow-y-auto pr-1">{cart.map((item) => <div key={item.product.id} className="rounded-lg bg-gray-50 dark:bg-white/5 p-3"><div className="flex justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-bold">{item.product.name}</p><p className="mt-1 text-xs text-slate-400">{formatMoney(item.product.price, currency)}</p></div><button type="button" onClick={() => removeItem(item.product.id)} className="text-slate-500 hover:text-rose-300" aria-label={`${t("common.delete")}: ${item.product.name}`}><FiTrash2 /></button></div><div className="mt-3 flex items-center justify-between"><div className="flex items-center gap-2 rounded-xl bg-black/5 dark:bg-white/10 p-1"><button type="button" onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="rounded-lg p-1.5 hover:bg-black/5 dark:hover:bg-white/10"><FiMinus /></button><span className="min-w-6 text-center text-sm font-bold">{item.quantity}</span><button type="button" onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="rounded-lg p-1.5 hover:bg-black/5 dark:hover:bg-white/10"><FiPlus /></button></div><span className="text-sm font-bold">{formatMoney(item.product.price * item.quantity, currency)}</span></div></div>)}{cart.length === 0 && <div className="rounded-lg border border-dashed border-black/15 dark:border-white/15 p-6 text-center text-sm text-slate-400">{t("pos.cartEmpty")}</div>}</div><div className="mt-5 space-y-3"><div><label className="mb-1.5 block text-xs font-bold text-slate-400">{t("pos.memberOptional")}</label><select className="w-full rounded-md border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/10 ps-3 pe-9 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-blue-600" value={memberId} onChange={(event) => setMemberId(event.target.value)}><option className="text-slate-900" value="">{t("pos.walkInCustomer")}</option>{members.map((member) => <option className="text-slate-900" key={member.id} value={member.id}>{member.name} · {member.email}</option>)}</select></div><div><label className="mb-1.5 block text-xs font-bold text-slate-400">{t("pos.discount")} ({currency})</label><input className="w-full rounded-md border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/10 px-3 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-blue-600" type="number" min="0" step={moneyInputStep(currency)} value={discount} onChange={(event) => setDiscount(Number(event.target.value))} /></div></div><div className="mt-5 space-y-2 border-t border-black/10 dark:border-white/10 pt-4 text-sm"><div className="flex justify-between text-slate-400"><span>{t("pos.subtotal")}</span><span>{formatMoney(subtotal, currency)}</span></div><div className="flex justify-between text-slate-400"><span>{t("pos.discount")}</span><span>-{formatMoney(discountTotal, currency)}</span></div><div className="flex justify-between text-slate-400"><span>{t("pos.vat")}</span><span>{formatMoney(vatTotal, currency)}</span></div><div className="flex justify-between pt-2 text-xl font-bold"><span>{t("pos.total")}</span><span>{formatMoney(total, currency)}</span></div></div><button type="button" disabled={!cart.length} onClick={onCheckout} className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-default disabled:bg-black/5 disabled:text-gray-400 disabled:shadow-none dark:disabled:bg-white/10"><FiCreditCard />{t("pos.proceedCheckout")}</button></aside>; }

function InventoryWorkspace({ products, search, setSearch, lowStock, onAdd, onEdit, onAdjust, onAddCategory }: { products: PosProduct[]; search: string; setSearch: (value: string) => void; lowStock: PosProduct[]; onAdd: () => void; onEdit: (product: PosProduct) => void; onAdjust: (product: PosProduct) => void; onAddCategory: () => void }) { const { t } = useTranslation(); const { config: gymConfig } = useGymConfig(); const currency = gymConfig.currency; return <section className="space-y-5"><div className="flex flex-col justify-between gap-3 rounded-xl bg-gray-50 p-5 dark:bg-gray-800 md:flex-row md:items-center"><div><h2 className="text-base font-semibold text-slate-900 dark:text-white">{t("pos.inventory")}</h2><p className="mt-1 text-sm text-slate-500">{t("pos.manageCatalogHint")}</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={onAddCategory} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:border-sky-300 dark:border-slate-700 dark:text-slate-200"><FiTag />{t("pos.addCategory")}</button><button type="button" onClick={onAdd} className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-sky-700"><FiPlus />{t("pos.addProduct")}</button></div></div>{lowStock.length > 0 && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-200"><span className="font-bold">{lowStock.length} product{lowStock.length === 1 ? " is" : "s are"} below reorder level.</span> Review stock before the next busy period.</div>}<div className="overflow-hidden rounded-xl bg-gray-50 dark:bg-gray-800"><div className="border-b border-slate-200 p-4 dark:border-slate-800"><div className="relative max-w-md"><FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input className={`${inputClass} pl-10`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("pos.searchInventory")} /></div></div><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-400 dark:bg-slate-800/60"><tr><th className="px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Product</th><th className="px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">SKU</th><th className="px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Price</th><th className="px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Stock</th><th className="px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Status</th><th className="px-5 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Actions</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{products.map((product) => { const low = product.track_inventory && product.stock_quantity <= product.reorder_level; return <tr key={product.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40"><td className="px-5 py-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-xs font-bold text-sky-600 dark:bg-sky-900/30 dark:text-sky-300">{getInitials(product.name)}</div><div><p className="font-bold text-slate-900 dark:text-white">{product.name}</p><p className="text-xs text-slate-400">{product.category?.name ?? "Uncategorized"}</p></div></div></td><td className="px-5 py-4 font-mono text-xs text-slate-500">{product.sku}</td><td className="px-5 py-4 font-semibold text-slate-700 dark:text-slate-200">{formatMoney(product.price, currency)}</td><td className="px-5 py-4"><span className={`font-bold ${low ? "text-amber-600" : "text-slate-700 dark:text-slate-200"}`}>{product.track_inventory ? product.stock_quantity : "—"}</span>{product.track_inventory && <span className="ml-1 text-xs text-slate-400">/ {product.reorder_level} min</span>}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${product.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{product.is_active ? "Active" : "Hidden"}</span></td><td className="px-5 py-4"><div className="flex justify-end gap-1"><button type="button" onClick={() => onAdjust(product)} className="rounded-lg p-2 text-slate-400 hover:bg-sky-50 hover:text-sky-600" title={t("pos.adjustStock")}><FiRefreshCw /></button><button type="button" onClick={() => onEdit(product)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200" title={t("pos.editProduct")}><FiEdit2 /></button></div></td></tr>; })}</tbody></table>{products.length === 0 && <EmptyState icon={FiPackage} title={t("pos.noProducts")} description={t("pos.addProductsHint")} />}</div></div></section>; }

function SalesWorkspace({ sales, search, setSearch, statusFilter, setStatusFilter, currency, onView, onReturn }: { sales: PosSale[]; search: string; setSearch: (value: string) => void; statusFilter: string; setStatusFilter: (value: string) => void; currency: string; onView: (sale: PosSale) => void; onReturn: (sale: PosSale) => void }) { const { t } = useTranslation(); return <section className="space-y-5"><div className="flex flex-col justify-between gap-3 rounded-xl bg-gray-50 p-5 dark:bg-gray-800 md:flex-row md:items-center"><div><h2 className="text-base font-semibold text-slate-900 dark:text-white">{t("pos.salesHistory")}</h2><p className="mt-1 text-sm text-slate-500">{t("pos.noSalesHint")}</p></div><div className="flex flex-col gap-2 sm:flex-row"><div className="relative"><FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input className={`${inputClass} pl-10`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("pos.searchSales")} /></div><select className={inputClass} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">{t("pos.allStatuses")}</option><option value="completed">{t("pos.completed")}</option><option value="partially_returned">{t("pos.partiallyReturned")}</option><option value="returned">{t("pos.returned")}</option></select></div></div><div className="overflow-hidden rounded-xl bg-gray-50 dark:bg-gray-800"><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-400 dark:bg-slate-800/60"><tr><th className="px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">{t("pos.receipt")}</th><th className="px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">{t("pos.customer")}</th><th className="px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">{t("pos.date")}</th><th className="px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">{t("pos.payment")}</th><th className="px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">{t("pos.total")}</th><th className="px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">{t("pos.status")}</th><th className="px-5 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400">{t("pos.actions")}</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{sales.map((sale) => <tr key={sale.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40"><td className="px-5 py-4 font-mono text-xs font-bold text-slate-700 dark:text-slate-200">{sale.sale_number}</td><td className="px-5 py-4 text-slate-600 dark:text-slate-300">{sale.member?.name ?? t("pos.walkInCustomer")}</td><td className="px-5 py-4 text-slate-500">{formatDateTime(sale.created_at)}</td><td className="px-5 py-4 capitalize text-slate-500">{t(sale.payment_method === "bank_transfer" ? "pos.bankTransfer" : sale.payment_method === "digital_wallet" ? "pos.digitalWallet" : sale.payment_method === "card" ? "pos.cardTerminal" : sale.payment_method === "cash" ? "pos.cash" : "pos.other")}</td><td className="px-5 py-4 font-bold text-slate-900 dark:text-white">{formatMoney(sale.total, currency)}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${sale.status === "completed" ? "bg-emerald-50 text-emerald-700" : sale.status === "returned" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"}`}>{t(sale.status === "completed" ? "pos.completed" : sale.status === "partially_returned" ? "pos.partiallyReturned" : sale.status === "returned" ? "pos.returned" : "pos.voided")}</span></td><td className="px-5 py-4"><div className="flex justify-end gap-1"><button type="button" onClick={() => onView(sale)} className="rounded-lg p-2 text-slate-400 hover:bg-sky-50 hover:text-sky-600" title={t("pos.viewReceipt")}><FiFileText /></button><button type="button" disabled={sale.status === "returned" || sale.status === "voided"} onClick={() => onReturn(sale)} className="rounded-lg p-2 text-slate-400 hover:bg-amber-50 hover:text-amber-600 disabled:cursor-not-allowed disabled:opacity-30" title={t("pos.processReturn")}><FiRotateCcw /></button></div></td></tr>)}</tbody></table>{sales.length === 0 && <EmptyState icon={FiBarChart2} title={t("pos.noSales")} description={t("pos.noSalesHint")} />}</div></div></section>; }

function EmptyState({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) { return <div className="col-span-full flex min-h-48 flex-col items-center justify-center px-6 py-12 text-center"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800"><Icon className="h-6 w-6" /></div><h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">{title}</h3><p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p></div>; }

export default POS;
