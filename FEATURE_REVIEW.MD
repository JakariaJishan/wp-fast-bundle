# Fixed Bundle feature for Fast Bundle (WooCommerce plugin)

## Context

Fast Bundle is a WooCommerce plugin built around a single `fbnd_option` custom
post type ("Option Set"): a block-based canvas assigned to products, meant to
let shoppers configure paid add-ons. Investigation of the current codebase
found:

- The **CRUD / listing / product-assignment infrastructure is solid and
  reusable**: `fbnd_option` CPT, `/fbnd/set_option`, `/fbnd/get_option`,
  `/fbnd/option_list`, `/fbnd/set_assign`, `/fbnd/get_assign`,
  `/fbnd/product_search`, `/fbnd/products_details`, `/fbnd/assign_search` are
  all implemented and working (`includes/restapi/class-request-api.php`).
- The **admin builder UI (canvas/drawer) is an intentional placeholder** —
  a flat list of `{blockid, type: 'item', label}` items with a label-only
  settings drawer (explicit comments in `src/pages/editor/canvas/index.js`
  and `src/pages/editor/drawer/index.js` say so).
- The **cart/checkout pricing pipeline is dead code**: `CartPage` is never
  instantiated in `includes/class-initialization.php`, and it depends on
  `FBND\Includes\Order\PriceHandler` and
  `FBND\Includes\Services\Product_Blocks_Service`, neither of which exists
  in this plugin. There is also **no hook that renders anything on the
  single-product page today** — `src/frontend_script/init.js` is a literal
  placeholder.
- There is **no "Assign to product" editing UI** in the admin app yet either
  (only a read-only `assigned-show.js` badge) — but the store actions
  (`settingsSlice.js`: `assignedData`, `handleAssignedData`,
  `setAssignedProducts`, `fetchAssignedProducts`) and the backend endpoints
  are fully implemented and ready to be wired to a UI.

Given this, "Fixed Bundle" (a merchant-curated, fixed set of products sold
together at a discount, added to cart as one unit) is new, mostly-greenfield
functionality. Rather than trying to resurrect the unrelated/broken generic
option-pricing pipeline (`PriceHandler`, `Product_Blocks_Service`,
`CartPage`), Fixed Bundle gets its **own small, self-contained pipeline** on
both ends, while reusing the CPT/listing/search/assignment plumbing that
already works. This avoids scope creep into an unrelated, currently-inert
feature and keeps the new code easy to reason about.

**Confirmed scope for v1** (per user decisions):
- Discount methods: percentage off, fixed amount off, and fixed total price.
- Bundle items: simple products only (no variations).
- Storefront placement: on the page(s) of whichever product(s) the bundle is
  assigned to (reuses the existing assign system), not a separate shortcode.
- One bundle widget shown per product (first published Fixed Bundle assigned
  to it); no bundle-level quantity multiplier — the "Add bundle to cart"
  button adds each item at its configured quantity, once.

## Data model

Reuse the `fbnd_option` CPT. Add one new post meta to distinguish bundle
posts from regular option sets:

- `fbnd_option_type`: `'custom'` (default, existing behavior) |
  `'fixed_bundle'`.

For `fixed_bundle` posts, `fbnd_addons_blocks` (already the generic
"content" meta key used by `set_option`/`get_option`) stores an object
instead of a block array — nothing in PHP validates its shape today, so this
is a safe, additive reuse:

```json
{
  "items": [
    { "product_id": 123, "quantity": 2, "name": "...", "image": "...",
      "price": "19.99", "permalink": "..." }
  ],
  "discount": { "type": "percentage|fixed_amount|fixed_price", "value": 20 },
  "display": { "description": "", "buttonText": "Add Bundle to Cart" }
}
```

Product assignment (which product page(s) show the widget) reuses the
existing `set_assign`/`get_assign` meta exactly as-is — no backend change
needed there.

## Backend (PHP)

**Modify `includes/restapi/class-request-api.php`:**
- `set_option_callback` (~line 400): read `$params['option_type']`
  (default `'custom'`), persist via
  `update_post_meta($id, 'fbnd_option_type', $option_type)` in both the
  create and update branches.
- `get_option_callback` (~line 308): add
  `'type' => get_post_meta($id, 'fbnd_option_type', true) ?: 'custom'` to
  the returned `$data`.
- `option_listing_callback` (~line 773): add the same `'type'` field to each
  row, and make the `'options'` count type-aware (count `items` for
  `fixed_bundle`, keep the existing `blockid` substring count otherwise).

**New `includes/services/class-fixed-bundle.php`** (`FBND\Includes\Services\Fixed_Bundle`):
- `get_for_product( $product_id )`: calls the existing
  `fast_bundle()->get_product_option_ids($product_id)`, filters to published
  posts with `fbnd_option_type === 'fixed_bundle'`, returns the first match
  (or null).
- `get_items( $bundle_id )`: reads/decodes `fbnd_addons_blocks`, hydrates
  each item with the *live* `wc_get_product()` price/stock/purchasable
  state (never trust stored price/name — they're a display cache).
- `calculate_totals( $items, $discount )`: returns
  `['original_total', 'discounted_total', 'savings', 'per_item' => [id => discounted_unit_price]]`.
  Original total uses each product's current effective price
  (`$product->get_price()`, i.e. sale price if active) × quantity. Discount
  math:
  - `percentage`: `discounted_total = original_total * (1 - value/100)`
  - `fixed_amount`: `discounted_total = max(0, original_total - value)`
  - `fixed_price`: `discounted_total = max(0, value)`
  - Per-item discounted unit price is the item's share of `original_total`
    scaled by `discounted_total / original_total` (guards divide-by-zero).
- `validate_and_price( $bundle_id )`: loads the bundle, rejects if not
  published/not `fixed_bundle` type, rejects if any item's product is
  missing/not purchasable/out of stock, otherwise returns the computed
  totals — this is the single source of truth called both when rendering
  the widget and when adding to cart, so displayed and charged prices never
  drift.

**New `includes/order/class-fixed-bundle-cart.php`** (`FBND\Includes\Order\Fixed_Bundle_Cart`):
- Constructor registers:
  - `woocommerce_single_product_summary` priority 35 → `render_widget()`:
    calls `Fixed_Bundle::get_for_product(get_the_ID())`; if found, prints
    the bundle container (items with image/name/qty, strikethrough original
    total, discounted total, savings badge, "Add Bundle to Cart" button)
    and enqueues `fixed-bundle.js`/`.css` with the bundle id + a nonce
    (`wp_create_nonce('fbnd-nonce')`, matching the existing convention in
    `get_fbnd_option_front_data()`) localized to it.
  - `wp_ajax_fbnd_add_fixed_bundle` / `wp_ajax_nopriv_fbnd_add_fixed_bundle`
    → `ajax_add_to_cart()`: verifies nonce, calls
    `Fixed_Bundle::validate_and_price($bundle_id)`, generates
    `$bundle_key = 'fbnd_fb_' . $bundle_id . '_' . wp_generate_password(8, false)`,
    and for each item calls
    `WC()->cart->add_to_cart($product_id, $qty, '', '', ['fbnd_bundle_key' => $bundle_key, 'fbnd_bundle_id' => $bundle_id, 'fbnd_bundle_item_price' => $discounted_unit_price])`.
    Responds with `{success, cart_count, cart_url}` or a validation error
    message.
  - `woocommerce_before_calculate_totals` priority 20 → for any cart item
    carrying `fbnd_bundle_item_price`, call
    `$cart_item['data']->set_price($cart_item['fbnd_bundle_item_price'])`.
  - `woocommerce_get_item_data` → append a "Bundle: {title}" row for cart
    items carrying `fbnd_bundle_id`.
  - `woocommerce_cart_item_removed` → cascade-remove every other cart item
    sharing the same `fbnd_bundle_key`, so the bundle behaves as one unit.
  - `woocommerce_checkout_create_order_line_item` → persist
    `_fbnd_bundle_id` (meta) and a plain "Bundle" meta row (non
    `_`-prefixed, same convention as the existing — unrelated —
    `CheckoutPage` class) so it's visible on order/thank-you/admin screens.
- This class is independent of the existing (non-functional) `CartPage`/
  `PriceHandler`/`CheckoutPage` classes — no changes to those, no risk of
  interacting with that dead code path.

**Modify `includes/class-initialization.php`:** instantiate
`new \FBND\Includes\Services\Fixed_Bundle()` (if it needs to self-register
anything) and `new \FBND\Includes\Order\Fixed_Bundle_Cart()` in `requires()`.

## Storefront (JS/CSS)

**New `src/frontend_script/fixed-bundle.js`**: vanilla JS (no framework,
matching the plugin's existing storefront script style), scoped to
`.fbnd-fixed-bundle` containers. On "Add Bundle to Cart" click: POST to
`admin-ajax.php` (`action=fbnd_add_fixed_bundle`, bundle id, nonce) via
`fetch`; on success, trigger `jQuery(document.body).trigger('wc_fragment_refresh')`
(the standard WooCommerce mini-cart refresh event) and show an inline
success message with a "View cart" link; on failure, show the returned
error message. Localized data comes from `wp_localize_script` in
`render_widget()` (bundle id + nonce; prices are already server-rendered
into the markup, so no separate price payload is needed client-side).

**New `src/scss/fixed-bundle.scss`**: widget styling (item rows, price
summary, savings badge, button), following the plugin's existing SCSS
conventions (see `src/scss/frontend.scss` for structure/variables).

**Modify `webpack.config.js`**: add two entries mirroring the existing
`frontend-script` / `fastbundle-frontend` pattern —
`'fixed-bundle': src/frontend_script/fixed-bundle.js` and a CSS-only
`'fastbundle-fixed-bundle': src/scss/fixed-bundle.scss` — output to
`assets/js/fixed-bundle.js` / `assets/css/fastbundle-fixed-bundle.css`.
`Fixed_Bundle_Cart::render_widget()` enqueues both via
`fast_bundle()->enqueue_style()` / the plugin's existing
`get_script_asset()` helper (same pattern as `class-hooks.php`'s
`enqueue_block_js_callback`).

## Admin builder (React)

**New `src/pages/fixed-bundle/index.js`** — top-level Fixed Bundle editor
screen. Self-contained (its own `useState`, not the generic
`useEditorStore`/`blocksSlice`, since the data model — `items` +
`discount` + `display` — doesn't fit the block-tree abstraction). Mirrors
`src/pages/editor/index.js`'s header chrome (back button, title field,
draft/publish toggle, save button, unsaved-changes guard) and calls the
same `/fbnd/set_option` / `/fbnd/get_option` endpoints, passing
`option_type: 'fixed_bundle'` and `content` shaped as above. Renders three
sections in the body:

- **`src/pages/fixed-bundle/product-picker.js`**: search box hitting
  `/fbnd/product_search` (already returns `isVariable`; filter out variable
  products client-side per the "simple products only" scope), a results
  dropdown with an "Add" affordance, and a selected-items list with a
  quantity stepper and remove button per row. On load with an existing
  bundle id, rehydrate saved `product_id`s via `/fbnd/products_details`.
- **`src/pages/fixed-bundle/discount-settings.js`**: radio group
  (percentage / fixed amount / fixed price) + numeric input, with a live
  client-side preview of original vs. discounted total (mirrors the PHP
  math in `Fixed_Bundle::calculate_totals` — server always recalculates
  authoritatively on add-to-cart, so this preview being approximate is
  fine).
- **`src/pages/fixed-bundle/assign-panel.js`**: the first real UI for the
  existing-but-unwired assign system. Radio for `all_product` /
  `specific_product` / `specific_category` (reusing the `assignType` array
  already exported from `src/store/editor/slices/settingsSlice.js`), and
  for the specific options a type-ahead search against `/fbnd/assign_search`
  with a selected-chips list. Wires to `useEditorStore`'s existing
  `assignedData` / `handleAssignedData` / `setAssignedProducts` /
  `fetchAssignedProducts` actions (reused as-is — they're already generic
  to any `fbnd_option` post).

**New `src/components/create-fixed-bundle-button.js`**: mirrors
`src/components/create-option-dropdown.js`, navigates to
`fbndBackendData.db_url + 'bundle/new'` instead of `'lists/new'`.

**Modify `src/pages/option-lists/index.js`**: render
`<CreateFixedBundleButton>` next to the existing `<CreateOptionDropdown>`;
add a small "Type" badge next to the title (Option Set vs Fixed Bundle)
using the new `item.type` field from `/fbnd/option_list`; make the
id/title column's click handler navigate to `#bundle/{id}` instead of
`#lists/{id}` when `item.type === 'fixed_bundle'`.

**Modify `src/index.js`**: extend `Dashboard()`'s hash parsing (currently
only recognizes `#lists/{id}`) to also recognize `#bundle` / `#bundle/{id}`
and render the new `FixedBundleEditor` instead of `<Editor>` in that case;
extend `useRouteRenderer`'s `currentNav.includes('lists')` check to also
match `'bundle'` so the top-level nav router defers to `<Dashboard>` for
both hash families.

## Verification

1. `npm run build` (or the project's existing build script) to confirm the
   new webpack entries compile without errors.
2. In WP admin, create a Fixed Bundle: add 2-3 simple products with
   quantities, set each discount type in turn and confirm the preview math,
   assign it to a specific product, publish.
3. Visit that product's single-product page on the storefront: confirm the
   widget renders with correct items/prices/savings, click "Add Bundle to
   Cart", confirm all items land in the cart at the discounted per-unit
   price (check cart subtotal math), confirm the "Bundle: {title}" line
   shows under each item.
4. Remove one bundle item from the cart — confirm the rest of that bundle's
   items are cascade-removed.
5. Complete checkout with a bundle in the cart — confirm the order line
   items carry the "Bundle" meta row on the thank-you page and in
   WooCommerce admin's order screen.
6. Confirm a regular (non-bundle) Option Set still lists, opens, and saves
   correctly (`#lists/{id}` path untouched) — regression check that the new
   `fbnd_option_type` meta defaulting to `'custom'` doesn't break existing
   posts that never had it set.
