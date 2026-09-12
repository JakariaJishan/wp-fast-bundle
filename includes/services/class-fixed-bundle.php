<?php // phpcs:ignore
/**
 * Fixed Bundle domain logic: reading a bundle's saved items/discount and
 * pricing them against live WooCommerce product data.
 *
 * @package FBND\Includes\Services
 */

namespace FBND\Includes\Services;

defined( 'ABSPATH' ) || exit;

/**
 * Fixed_Bundle class.
 */
class Fixed_Bundle {

	/**
	 * The `fbnd_option_type` meta value that marks a post as a Fixed Bundle.
	 *
	 * @var string
	 */
	const OPTION_TYPE = 'fixed_bundle';

	/**
	 * Finds the first published Fixed Bundle assigned to a product.
	 *
	 * Reuses the existing generic assignment lookup (`get_product_option_ids`)
	 * and filters it down to Fixed Bundle posts only, so it shares the exact
	 * same all/specific-product/specific-category resolution logic as the
	 * generic Option Sets.
	 *
	 * @param int $product_id The product ID.
	 * @return int Bundle post ID, or 0 when none applies.
	 */
	public function get_for_product( $product_id ) {
		$option_ids = fast_bundle()->get_product_option_ids( (int) $product_id );

		foreach ( $option_ids as $option_id ) {
			if ( 'publish' !== get_post_status( $option_id ) ) {
				continue;
			}
			if ( self::OPTION_TYPE !== get_post_meta( $option_id, 'fbnd_option_type', true ) ) {
				continue;
			}
			return (int) $option_id;
		}

		return 0;
	}

	/**
	 * Reads a bundle's saved items and hydrates them with live product data.
	 *
	 * The saved `name`/`image`/`price` in post meta are only a display cache
	 * written by the editor — pricing and availability always come from the
	 * live product here, so a bundle never charges a stale price.
	 *
	 * @param int $bundle_id Bundle post ID.
	 * @return array List of hydrated items, skipping any deleted product.
	 */
	public function get_items( $bundle_id ) {
		$content = get_post_meta( $bundle_id, 'fbnd_addons_blocks', true );
		$items   = ( is_array( $content ) && isset( $content['items'] ) && is_array( $content['items'] ) )
			? $content['items']
			: array();

		$hydrated = array();

		foreach ( $items as $item ) {
			$product_id = isset( $item['product_id'] ) ? absint( $item['product_id'] ) : 0;
			$quantity   = isset( $item['quantity'] ) ? max( 1, absint( $item['quantity'] ) ) : 1;

			if ( ! $product_id ) {
				continue;
			}

			$product = wc_get_product( $product_id );
			if ( ! $product ) {
				continue;
			}

			$image_id = $product->get_image_id();

			$hydrated[] = array(
				'product_id'  => $product_id,
				'quantity'    => $quantity,
				'name'        => $product->get_name(),
				'image'       => $image_id ? wp_get_attachment_image_url( $image_id, 'thumbnail' ) : wc_placeholder_img_src(),
				'permalink'   => get_permalink( $product_id ),
				'price'       => (float) wc_get_price_to_display( $product ),
				'purchasable' => $product->is_purchasable(),
				'in_stock'    => $product->is_in_stock(),
				'is_variable' => $product->is_type( 'variable' ),
			);
		}

		return $hydrated;
	}

	/**
	 * Reads a bundle's saved discount settings.
	 *
	 * @param int $bundle_id Bundle post ID.
	 * @return array { type: percentage|fixed_amount|fixed_price, value: float }.
	 */
	public function get_discount( $bundle_id ) {
		$content  = get_post_meta( $bundle_id, 'fbnd_addons_blocks', true );
		$discount = ( is_array( $content ) && isset( $content['discount'] ) && is_array( $content['discount'] ) )
			? $content['discount']
			: array();

		$type = isset( $discount['type'] ) ? sanitize_text_field( $discount['type'] ) : 'percentage';
		if ( ! in_array( $type, array( 'percentage', 'fixed_amount', 'fixed_price' ), true ) ) {
			$type = 'percentage';
		}

		return array(
			'type'  => $type,
			'value' => isset( $discount['value'] ) ? floatval( $discount['value'] ) : 0,
		);
	}

	/**
	 * Reads a bundle's saved display settings.
	 *
	 * @param int $bundle_id Bundle post ID.
	 * @return array { description: string, buttonText: string }.
	 */
	public function get_display( $bundle_id ) {
		$content = get_post_meta( $bundle_id, 'fbnd_addons_blocks', true );
		$display = ( is_array( $content ) && isset( $content['display'] ) && is_array( $content['display'] ) )
			? $content['display']
			: array();

		$button_text = isset( $display['buttonText'] ) ? sanitize_text_field( $display['buttonText'] ) : '';

		return array(
			'description' => isset( $display['description'] ) ? wp_kses_post( $display['description'] ) : '',
			'buttonText'  => '' !== $button_text ? $button_text : __( 'Add Bundle to Cart', 'fast-bundle' ),
		);
	}

	/**
	 * Computes original/discounted totals and a per-item discounted unit price.
	 *
	 * The discount is applied to the bundle total, then spread back across
	 * items proportionally to each item's share of the original total, so
	 * every line still carries a sensible per-unit price for cart/order
	 * display and tax calculation.
	 *
	 * @param array $items    Hydrated items, from `get_items()`.
	 * @param array $discount Discount settings, from `get_discount()`.
	 * @return array { original_total, discounted_total, savings, per_item: [ product_id => unit_price ] }.
	 */
	public function calculate_totals( $items, $discount ) {
		$decimals       = wc_get_price_decimals();
		$original_total = 0.0;

		foreach ( $items as $item ) {
			$original_total += $item['price'] * $item['quantity'];
		}

		$type  = isset( $discount['type'] ) ? $discount['type'] : 'percentage';
		$value = isset( $discount['value'] ) ? (float) $discount['value'] : 0;

		switch ( $type ) {
			case 'fixed_amount':
				$discounted_total = max( 0, $original_total - $value );
				break;
			case 'fixed_price':
				$discounted_total = max( 0, $value );
				break;
			case 'percentage':
			default:
				$discounted_total = max( 0, $original_total * ( 1 - ( $value / 100 ) ) );
				break;
		}

		$ratio    = $original_total > 0 ? ( $discounted_total / $original_total ) : 0;
		$per_item = array();

		foreach ( $items as $item ) {
			$per_item[ $item['product_id'] ] = round( $item['price'] * $ratio, $decimals );
		}

		return array(
			'original_total'   => round( $original_total, $decimals ),
			'discounted_total' => round( $discounted_total, $decimals ),
			'savings'          => round( max( 0, $original_total - $discounted_total ), $decimals ),
			'per_item'         => $per_item,
		);
	}

	/**
	 * Loads, validates and prices a bundle in one call — the single source of
	 * truth used both to render the storefront widget and to add it to cart,
	 * so the displayed price and the charged price never drift apart.
	 *
	 * @param int $bundle_id Bundle post ID.
	 * @return array|\WP_Error Bundle data, or a WP_Error describing why it can't be sold right now.
	 */
	public function validate_and_price( $bundle_id ) {
		$bundle_id = absint( $bundle_id );

		if ( ! $bundle_id || 'fbnd_option' !== get_post_type( $bundle_id ) || 'publish' !== get_post_status( $bundle_id ) ) {
			return new \WP_Error( 'fbnd_invalid_bundle', __( 'This bundle is no longer available.', 'fast-bundle' ) );
		}

		if ( self::OPTION_TYPE !== get_post_meta( $bundle_id, 'fbnd_option_type', true ) ) {
			return new \WP_Error( 'fbnd_invalid_bundle', __( 'This bundle is no longer available.', 'fast-bundle' ) );
		}

		$items = $this->get_items( $bundle_id );

		if ( empty( $items ) ) {
			return new \WP_Error( 'fbnd_empty_bundle', __( 'This bundle has no items.', 'fast-bundle' ) );
		}

		foreach ( $items as $item ) {
			if ( ! $item['purchasable'] || ! $item['in_stock'] ) {
				return new \WP_Error(
					'fbnd_unavailable_item',
					/* translators: %s: product name */
					sprintf( __( '"%s" is currently unavailable.', 'fast-bundle' ), $item['name'] )
				);
			}
		}

		$discount = $this->get_discount( $bundle_id );

		return array(
			'bundle_id' => $bundle_id,
			'title'     => get_the_title( $bundle_id ),
			'items'     => $items,
			'discount'  => $discount,
			'display'   => $this->get_display( $bundle_id ),
			'totals'    => $this->calculate_totals( $items, $discount ),
		);
	}
}
