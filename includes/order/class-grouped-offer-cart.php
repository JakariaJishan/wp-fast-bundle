<?php // phpcs:ignore
/**
 * Shared cart mechanics for any "offer" that adds several products to the
 * cart as one group — a Fixed Bundle, a Buy X Get Y deal, and whatever
 * offer type comes after those.
 *
 * Each offer type only needs to build a priced item list and call
 * `add_group_to_cart()`; this class owns everything generic about a group
 * once it's in the cart: pricing it, labeling it, removing it as a unit, and
 * recording it on the order. Registered once in `Initialization`, not once
 * per offer type.
 *
 * @package FBND\Includes\Order
 */

namespace FBND\Includes\Order;

defined( 'ABSPATH' ) || exit;

/**
 * Grouped_Offer_Cart class.
 */
class Grouped_Offer_Cart {

	/**
	 * Setup class.
	 */
	public function __construct() {
		add_action( 'woocommerce_before_calculate_totals', array( $this, 'apply_group_prices' ), 20 );
		add_filter( 'woocommerce_get_item_data', array( $this, 'add_item_data' ), 10, 2 );
		add_action( 'woocommerce_cart_item_removed', array( $this, 'cascade_remove' ), 10, 2 );
		add_action( 'woocommerce_checkout_create_order_line_item', array( $this, 'add_order_line_item_meta' ), 10, 4 );
		add_filter( 'woocommerce_shipping_free_shipping_is_available', array( $this, 'maybe_force_free_shipping' ), 10, 2 );
	}

	/**
	 * Adds a set of already-priced items to the cart as one group: a shared
	 * key ties them together so they can be priced, labeled, and removed as
	 * a unit.
	 *
	 * @param array  $items         List of `{ product_id, quantity, unit_price }`, plus
	 *                               `variation_id`/`variation` for a resolved variable item.
	 * @param int    $offer_id      The `fbnd_option` post id this group belongs to.
	 * @param string $label         Human label for cart/order display, e.g. 'Bundle' or 'Deal'.
	 * @param bool   $free_shipping Whether this group's discount is the "free shipping"
	 *                              type — flags the cart so `maybe_force_free_shipping()`
	 *                              unlocks the shop's Free Shipping method, same as a
	 *                              coupon's "Allow free shipping" checkbox does.
	 *
	 * @return true|\WP_Error
	 */
	public function add_group_to_cart( array $items, $offer_id, $label, $free_shipping = false ) {
		$group_key = 'fbnd_grp_' . $offer_id . '_' . wp_generate_password( 8, false, false );

		foreach ( $items as $item ) {
			$cart_item_data = array(
				'fbnd_group_key'        => $group_key,
				'fbnd_group_offer_id'   => $offer_id,
				'fbnd_group_label'      => $label,
				'fbnd_group_item_price' => $item['unit_price'],
			);

			if ( $free_shipping ) {
				$cart_item_data['fbnd_group_free_shipping'] = true;
			}

			$added = WC()->cart->add_to_cart(
				$item['product_id'],
				$item['quantity'],
				$item['variation_id'] ?? 0,
				$item['variation'] ?? array(),
				$cart_item_data
			);

			if ( ! $added ) {
				return new \WP_Error( 'fbnd_add_to_cart_failed', __( 'Could not add this to your cart. Please try again.', 'fast-bundle' ) );
			}
		}

		return true;
	}

	/**
	 * Unlocks the shop's "Free Shipping" shipping method (if configured in
	 * the matching shipping zone) when the cart contains a group whose
	 * discount type is "free_shipping" — the same mechanism a WooCommerce
	 * coupon's "Allow free shipping" checkbox uses, so it composes correctly
	 * with however the merchant already has shipping configured rather than
	 * forcing a cost override on every method.
	 *
	 * @param bool  $is_available Whether the Free Shipping method is already available.
	 * @param array $package      The shipping package being priced.
	 * @return bool
	 */
	public function maybe_force_free_shipping( $is_available, $package ) {
		if ( $is_available || ! WC()->cart ) {
			return $is_available;
		}

		foreach ( WC()->cart->get_cart() as $cart_item ) {
			if ( ! empty( $cart_item['fbnd_group_free_shipping'] ) ) {
				return true;
			}
		}

		return $is_available;
	}

	/**
	 * Renders the attribute picker (dropdowns or swatch buttons) for a
	 * variable item, shared by every offer type's `render_widget()`. Embeds
	 * the item's purchasable variations as JSON so the storefront JS
	 * (`variation-selector.js`) can resolve a selection to a variation id
	 * and price without another round trip.
	 *
	 * No-op for a simple item.
	 *
	 * @param array  $item          Hydrated item, from a service's `get_items()`/`hydrate_items()`.
	 * @param string $selector_type 'dropdown' or 'swatches', from the offer's display settings.
	 * @return void
	 */
	public function render_variation_picker( $item, $selector_type ) {
		if ( empty( $item['is_variable'] ) ) {
			return;
		}
		?>
		<div
			class="fbnd-variation-picker fbnd-variation-picker--<?php echo esc_attr( $selector_type ); ?>"
			data-product-id="<?php echo esc_attr( $item['product_id'] ); ?>"
			data-variations="<?php echo esc_attr( wp_json_encode( $item['variations'] ) ); ?>"
		>
			<?php foreach ( $item['attributes'] as $attribute_key => $attribute ) : ?>
				<div class="fbnd-variation-picker__attribute" data-attribute="<?php echo esc_attr( $attribute_key ); ?>">
					<span class="fbnd-variation-picker__attribute-label"><?php echo esc_html( $attribute['label'] ); ?></span>
					<?php if ( 'swatches' === $selector_type ) : ?>
						<div class="fbnd-variation-picker__swatches">
							<?php foreach ( $attribute['options'] as $option ) : ?>
								<button type="button" class="fbnd-variation-picker__swatch" data-value="<?php echo esc_attr( $option['value'] ); ?>">
									<?php echo esc_html( $option['label'] ); ?>
								</button>
							<?php endforeach; ?>
						</div>
					<?php else : ?>
						<select class="fbnd-variation-picker__select">
							<option value=""><?php esc_html_e( 'Choose an option', 'fast-bundle' ); ?></option>
							<?php foreach ( $attribute['options'] as $option ) : ?>
								<option value="<?php echo esc_attr( $option['value'] ); ?>"><?php echo esc_html( $option['label'] ); ?></option>
							<?php endforeach; ?>
						</select>
					<?php endif; ?>
				</div>
			<?php endforeach; ?>
			<input type="hidden" class="fbnd-variation-picker__variation-id" value="" />
			<p class="fbnd-variation-picker__unavailable" hidden><?php esc_html_e( 'This combination is unavailable.', 'fast-bundle' ); ?></p>
		</div>
		<?php
	}

	/**
	 * Decodes and sanitizes the `selections` field every offer type's AJAX
	 * add-to-cart handler accepts: the shopper's variation picks, sent as a
	 * JSON object of `{ [product_id]: variation_id }`.
	 *
	 * @param string $raw Raw `$_POST['selections']` value (a JSON string), possibly empty.
	 * @return array Map of `product_id => variation_id`, both ints; malformed input yields an empty array.
	 */
	public function parse_selections( $raw ) {
		if ( ! is_string( $raw ) || '' === $raw ) {
			return array();
		}

		$decoded = json_decode( wp_unslash( $raw ), true );
		if ( ! is_array( $decoded ) ) {
			return array();
		}

		$selections = array();
		foreach ( $decoded as $product_id => $variation_id ) {
			$selections[ absint( $product_id ) ] = absint( $variation_id );
		}

		return $selections;
	}

	/**
	 * Enqueues the single shared storefront script/style bundle. Safe to
	 * call from every offer type's `render_widget()` — WordPress dedupes
	 * enqueues by handle, so only the first call on a page actually does
	 * anything.
	 *
	 * @return void
	 */
	public function enqueue_assets() {
		fast_bundle()->enqueue_style( 'fbnd-frontend-css', 'fastbundle-frontend' );

		$asset = fast_bundle()->get_script_asset( 'assets/js/frontend-script.js', array( 'wp-api-fetch', 'jquery', 'wp-i18n' ) );
		wp_enqueue_script( 'fbnd-front-script', FBND_URL . 'assets/js/frontend-script.js', $asset['dependencies'], $asset['version'], true );
	}

	/**
	 * Overrides each grouped cart item's price with the unit price computed
	 * at add-to-cart time.
	 *
	 * @param \WC_Cart $cart The cart being totalled.
	 * @return void
	 */
	public function apply_group_prices( $cart ) {
		if ( is_admin() && ! defined( 'DOING_AJAX' ) ) {
			return;
		}

		foreach ( $cart->get_cart() as $cart_item ) {
			if ( isset( $cart_item['fbnd_group_item_price'] ) ) {
				$cart_item['data']->set_price( $cart_item['fbnd_group_item_price'] );
			}
		}
	}

	/**
	 * Shows which offer a cart line belongs to, under the item in cart and
	 * checkout.
	 *
	 * @param array $item_data Existing item data rows.
	 * @param array $cart_item The cart item.
	 * @return array Item data rows.
	 */
	public function add_item_data( $item_data, $cart_item ) {
		if ( ! empty( $cart_item['fbnd_group_offer_id'] ) && ! empty( $cart_item['fbnd_group_label'] ) ) {
			$item_data[] = array(
				'name'  => $cart_item['fbnd_group_label'],
				'value' => get_the_title( $cart_item['fbnd_group_offer_id'] ),
			);
		}
		return $item_data;
	}

	/**
	 * Cascades removal of the rest of a group's items when one of them is
	 * removed from the cart, so every offer type behaves as one unit.
	 *
	 * @param string   $cart_item_key The removed item's cart key.
	 * @param \WC_Cart $cart          The cart.
	 * @return void
	 */
	public function cascade_remove( $cart_item_key, $cart ) {
		if ( empty( $cart->removed_cart_contents[ $cart_item_key ] ) ) {
			return;
		}

		$removed = $cart->removed_cart_contents[ $cart_item_key ];
		if ( empty( $removed['fbnd_group_key'] ) ) {
			return;
		}

		$group_key = $removed['fbnd_group_key'];

		foreach ( $cart->get_cart() as $key => $item ) {
			if ( $key !== $cart_item_key && isset( $item['fbnd_group_key'] ) && $item['fbnd_group_key'] === $group_key ) {
				$cart->remove_cart_item( $key );
			}
		}
	}

	/**
	 * Persists which offer an order line item belonged to.
	 *
	 * @param \WC_Order_Item_Product $item          The order line item.
	 * @param string                 $cart_item_key The cart item key.
	 * @param array                  $cart_item     The cart item.
	 * @param \WC_Order              $order         The order.
	 * @return void
	 */
	public function add_order_line_item_meta( $item, $cart_item_key, $cart_item, $order ) {
		if ( empty( $cart_item['fbnd_group_offer_id'] ) ) {
			return;
		}

		$item->add_meta_data( '_fbnd_group_offer_id', $cart_item['fbnd_group_offer_id'] );

		if ( ! empty( $cart_item['fbnd_group_label'] ) ) {
			$item->add_meta_data( $cart_item['fbnd_group_label'], get_the_title( $cart_item['fbnd_group_offer_id'] ) );
		}
	}
}
