# MTDRB POS and inventory design

## Product scope

The first production version provides a tenant-scoped point of sale for gym merchandise and add-ons. Staff can search products by name, SKU, or barcode, add items to a cart, associate a sale with an optional member, apply a discount, collect a payment method, print a receipt, review sales history, and process full or partial returns. Employees and administrators can create or edit products, manage categories, and adjust inventory with an auditable stock movement record.

The module is intentionally designed as an internal operational POS. It does not claim to process card payments online. A card or digital-wallet selection records the tender method entered by staff; an external payment provider can be added later behind the same sale/payment boundary.

## Data model

| Entity | Purpose | Key rules |
|---|---|---|
| `pos_categories` | Product grouping | Tenant-scoped; active flag; employee/admin management |
| `pos_products` | Catalog and inventory master | Tenant-scoped SKU/barcode uniqueness; price, cost, VAT, stock, reorder level; optional branch |
| `pos_stock_movements` | Immutable inventory audit log | Every adjustment, sale, return, or damage movement has a signed quantity delta and actor |
| `pos_sales` | Checkout header and receipt record | Tenant-scoped sale number, totals, tender method, cashier, optional member, status |
| `pos_sale_items` | Snapshot of products sold | Stores product name, SKU, price, VAT, quantity, and returned quantity at sale time |
| `pos_returns` | Return header | Links to a sale, records reason, actor, status, and total |
| `pos_return_items` | Returned quantities | Prevents returns beyond sold minus already returned quantities |

## Transaction workflows

Checkout is performed through a database transaction in `complete_pos_sale`. The function authenticates the caller, verifies employee-level tenant membership, validates each product, locks inventory rows, rejects insufficient stock, computes the authoritative subtotal/discount/VAT/total from server-side product data, inserts the sale and item snapshots, decrements stock, and writes sale stock movements. The client never controls the final total.

Inventory adjustment is performed through `adjust_pos_inventory`, which locks the product, prevents negative inventory when tracking is enabled, updates stock, and writes a movement row. Product creation and editing are ordinary RLS-protected tenant operations.

Returns are performed through `return_pos_sale`. The function locks the sale and its items, validates return quantities against remaining quantities, records the return, increments stock for tracked products, updates returned quantities and sale status, and returns the return id. The UI exposes both full-return and partial-return flows through one modal.

## Role and security rules

All POS tables have row-level security enabled. Reads are limited to the caller's tenant through `public.get_user_tenant_id()`. Product, category, and inventory management require employee-level membership; checkout and returns also require employee-level membership. Anonymous access is revoked from all POS RPCs. Security-definer functions use an empty search path and derive the caller from `auth.uid()` rather than accepting a tenant id from the browser.

## UI surface

The `/dashboard/pos` route contains a three-tab workspace: Checkout, Inventory, and Sales. Checkout provides search/filter, product cards, cart, member selection, discount, checkout modal, and printable receipt modal. Inventory provides low-stock metrics, product search, category filter, product management modal, and stock-adjustment modal. Sales provides date/status/search filters, sale details, receipt printing, and return modal.

## Out of scope for this release

The first release does not claim to integrate a card terminal, online payment gateway, barcode scanner hardware SDK, accounting export, or offline-first queue. Barcode text entry is supported through the input field and works with USB scanners that act as keyboards. The database boundary keeps payment processing replaceable without weakening inventory correctness.

## Verification evidence

The migration was applied successfully to the connected Supabase production project. A bounded schema query confirmed the following live tables: `pos_categories`, `pos_products`, `pos_stock_movements`, `pos_sales`, `pos_sale_items`, `pos_returns`, and `pos_return_items`. Typecheck, lint, the existing test suite, dependency audit, and production build all pass. A local headless browser smoke test mounted `/dashboard/pos`, rendered the checkout, inventory, and sales-history tabs, and reported no error boundary.

The Supabase security advisor still reports the project’s pre-existing pattern of authenticated callers being able to execute security-definer RPCs. The three new POS RPCs are intentionally authenticated-only and internally verify the caller’s tenant and employee role; anonymous and public execution was revoked. The advisor warning is retained as a project-wide hardening item rather than treated as a POS-specific exposure.
