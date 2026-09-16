<?php // phpcs:ignore
/**
 * Buy X Get Y domain logic: reading a deal's saved trigger/reward products
 * and pricing them against live WooCommerce product data.
 *
 * Mirrors `Fixed_Bundle` closely — same CPT, same assignment system, same
 * "validate then price" shape — differing mainly in that a deal has two
 * item lists (triggers kept at full price, rewards discounted) instead of
 * one bundle-wide discount.
 *
 * @package FBND\Includes\Services
 */

namespace FBND\Includes\Services;

use FBND\Includes\Xpo;

defined( 'ABSPATH' ) || exit;

/**
 * Buy_X_Get_Y class.
 */
class Buy_X_Get_Y {

	/**
	 * The `fbnd_option_type` meta value that marks a post as a Buy X Get Y deal.
	 *
	 * @var string
	 */
	const OPTION_TYPE = 'buy_x_get_y';

	/**
	 * Finds the first published Buy X Get Y deal assigned to a product.
	 *
	 * @param int $product_id The product ID.
	 * @return int Deal post ID, or 0 when none applies.
	 */
	public function get_for_product( $product_id ) {
		return fast_bundle()->get_first_offer_for_product( (int) $product_id, self::OPTION_TYPE );
	}

	/**
	 * Hydrates a saved `{ product_id, quantity }` list with live product
	 * data. Shared by both the trigger and reward lists — same shape, same
	 * "never trust the saved display cache for price/availability" rule as
	 * `Fixed_Bundle::get_items()`.
	 *
	 * @param array $saved_items Saved items from post meta.
	 * @return array Hydrated items, skipping any deleted product.
	 */
	private function hydrate_items( $saved_items ) {
		$hydrated = array();

		foreach ( (array) $saved_items as $item ) {
			$product_id = isset( $item['product_id'] ) ? absint( $item['product_id'] ) : 0;
			$quantity   = isset( $item['quantity'] ) ? max( 1, absint( $item['quantity'] ) ) : 1;

			if ( ! $product_id ) {
				continue;
			}

			$product = wc_get_product( $product_id );
			if ( ! $product ) {
				continue;
			}

			$image_id    = $product->get_image_id();
			$is_variable = $product->is_type( 'variable' );

			$hydrated_item = array(
				'product_id'  => $product_id,
				'quantity'    => $quantity,
				'name'        => $product->get_name(),
				'image'       => $image_id ? wp_get_attachment_image_url( $image_id, 'thumbnail' ) : wc_placeholder_img_src(),
				'permalink'   => get_permalink( $product_id ),
				'price'       => (float) wc_get_price_to_display( $product ),
				'purchasable' => $product->is_purchasable(),
				'in_stock'    => $product->is_in_stock(),
				'is_variable' => $is_variable,
			);

			if ( $is_variable ) {
				$variable_data = fast_bundle()->hydrate_variable_product_data( $product );
				$prices        = wp_list_pluck( $variable_data['variations'], 'price' );

				$hydrated_item['attributes'] = $variable_data['attributes'];
				$hydrated_item['variations'] = $variable_data['variations'];
				// The parent has no single price — use the cheapest available
				// variation as a display estimate until a shopper picks one.
				$hydrated_item['price']      = $prices ? min( $prices ) : 0.0;
			}

			$hydrated[] = $hydrated_item;
		}

		return $hydrated;
	}

	/**
	 * Reads a deal's saved trigger items ("buy these").
	 *
	 * @param int $deal_id Deal post ID.
	 * @return array Hydrated items.
	 */
	public function get_triggers( $deal_id ) {
		$content = get_post_meta( $deal_id, 'fbnd_addons_blocks', true );
		return $this->hydrate_items(
			( is_array( $content ) && isset( $content['triggers'] ) && is_array( $content['triggers'] ) )
				? $content['triggers']
				: array()
		);
	}

	/**
	 * Reads a deal's saved reward items ("get these").
	 *
	 * @param int $deal_id Deal post ID.
	 * @return array Hydrated items.
	 */
	public function get_rewards( $deal_id ) {
		$content = get_post_meta( $deal_id, 'fbnd_addons_blocks', true );
		return $this->hydrate_items(
			( is_array( $content ) && isset( $content['rewards'] ) && is_array( $content['rewards'] ) )
				? $content['rewards']
				: array()
		);
	}

	/**
	 * Reads a deal's saved reward discount settings.
	 *
	 * @param int $deal_id Deal post ID.
	 * @return array { type: free|percentage|fixed_price, value: float }.
	 */
	public function get_reward_discount( $deal_id ) {
		$content  = get_post_meta( $deal_id, 'fbnd_addons_blocks', true );
		$discount = ( is_array( $content ) && isset( $content['rewardDiscount'] ) && is_array( $content['rewardDiscount'] ) )
			? $content['rewardDiscount']
			: array();

		$type = isset( $discount['type'] ) ? sanitize_text_field( $discount['type'] ) : 'free';
		if ( ! in_array( $type, array( 'free', 'percentage', 'fixed_price' ), true ) ) {
			$type = 'free';
		}

		return array(
			'type'  => $type,
			'value' => isset( $discount['value'] ) ? floatval( $discount['value'] ) : 0,
		);
	}

	/**
	 * Reads a deal's saved display settings.
	 *
	 * @param int $deal_id Deal post ID.
	 * @return array { description: string, buttonText: string, variantSelectorType: dropdown|swatches }.
	 */
	public function get_display( $deal_id ) {
		$content = get_post_meta( $deal_id, 'fbnd_addons_blocks', true );
		$display = ( is_array( $content ) && isset( $content['display'] ) && is_array( $content['display'] ) )
			? $content['display']
			: array();

		$button_text = isset( $display['buttonText'] ) ? sanitize_text_field( $display['buttonText'] ) : '';

		$selector_type = isset( $display['variantSelectorType'] ) ? sanitize_text_field( $display['variantSelectorType'] ) : 'dropdown';
		if ( ! in_array( $selector_type, array( 'dropdown', 'swatches' ), true ) ) {
			$selector_type = 'dropdown';
		}

		return array(
			'description'         => isset( $display['description'] ) ? wp_kses_post( $display['description'] ) : '',
			'buttonText'          => '' !== $button_text ? $button_text : Xpo::get_fbnd_settings_item( 'buyXGetYButtonText', __( 'Add Deal to Cart', 'fast-bundle' ) ),
			'variantSelectorType' => $selector_type,
		);
	}

	/**
	 * Computes each reward item's discounted unit price. Triggers are never
	 * discounted — they stay at their own live price.
	 *
	 * @param array $rewards  Hydrated reward items, from `get_rewards()`.
	 * @param array $discount Reward discount settings, from `get_reward_discount()`.
	 * @return array { type, value, per_item: [ product_id => unit_price ], total_savings }.
	 */
	public function calculate_reward_pricing( $rewards, $discount ) {
		$decimals = wc_get_price_decimals();
		$type     = isset( $discount['type'] ) ? $discount['type'] : 'free';
		$value    = isset( $discount['value'] ) ? (float) $discount['value'] : 0;

		$per_item      = array();
		$total_savings = 0.0;

		foreach ( $rewards as $reward ) {
			switch ( $type ) {
				case 'free':
					$unit_price = 0.0;
					break;
				case 'fixed_price':
					$unit_price = max( 0, $value );
					break;
				case 'percentage':
				default:
					$unit_price = max( 0, $reward['price'] * ( 1 - ( $value / 100 ) ) );
					break;
			}

			$unit_price                       = round( $unit_price, $decimals );
			$per_item[ $reward['product_id'] ] = $unit_price;
			$total_savings                    += ( $reward['price'] - $unit_price ) * $reward['quantity'];
		}

		return array(
			'per_item'      => $per_item,
			'total_savings' => round( max( 0, $total_savings ), $decimals ),
		);
	}

	/**
	 * Loads, validates and prices a deal in one call — the single source of
	 * truth used both to render the storefront widget and to add it to
	 * cart, so the displayed price and the charged price never drift apart.
	 *
	 * @param int   $deal_id    Deal post ID.
	 * @param array $selections Map of `product_id => variation_id`, the shopper's picks for
	 *                          any variable trigger/reward. Empty when just rendering the
	 *                          widget — required (and resolved) only when adding to cart.
	 * @return array|\WP_Error Deal data, or a WP_Error describing why it can't be sold right now.
	 */
	public function validate_and_price( $deal_id, $selections = array() ) {
		$deal_id = absint( $deal_id );

		if ( ! $deal_id || 'fbnd_option' !== get_post_type( $deal_id ) || 'publish' !== get_post_status( $deal_id ) ) {
			return new \WP_Error( 'fbnd_invalid_deal', __( 'This deal is no longer available.', 'fast-bundle' ) );
		}

		if ( self::OPTION_TYPE !== get_post_meta( $deal_id, 'fbnd_option_type', true ) ) {
			return new \WP_Error( 'fbnd_invalid_deal', __( 'This deal is no longer available.', 'fast-bundle' ) );
		}

		$triggers = $this->get_triggers( $deal_id );
		$rewards  = $this->get_rewards( $deal_id );

		if ( empty( $triggers ) || empty( $rewards ) ) {
			return new \WP_Error( 'fbnd_empty_deal', __( 'This deal has no items.', 'fast-bundle' ) );
		}

		foreach ( array_merge( $triggers, $rewards ) as $item ) {
			$available = $item['is_variable']
				? ! empty( $item['variations'] )
				: ( $item['purchasable'] && $item['in_stock'] );

			if ( ! $available ) {
				return new \WP_Error(
					'fbnd_unavailable_item',
					/* translators: %s: product name */
					sprintf( __( '"%s" is currently unavailable.', 'fast-bundle' ), $item['name'] )
				);
			}
		}

		if ( ! empty( $selections ) ) {
			$resolved = fast_bundle()->resolve_variation_selections( $triggers, $selections );
			if ( is_wp_error( $resolved ) ) {
				return $resolved;
			}

			$resolved = fast_bundle()->resolve_variation_selections( $rewards, $selections );
			if ( is_wp_error( $resolved ) ) {
				return $resolved;
			}
		}

		$discount = $this->get_reward_discount( $deal_id );
		$pricing  = $this->calculate_reward_pricing( $rewards, $discount );

		$trigger_total = 0.0;
		foreach ( $triggers as $item ) {
			$trigger_total += $item['price'] * $item['quantity'];
		}
		$reward_total = 0.0;
		foreach ( $rewards as $item ) {
			$reward_total += ( $pricing['per_item'][ $item['product_id'] ] ?? $item['price'] ) * $item['quantity'];
		}

		return array(
			'deal_id'        => $deal_id,
			'title'          => get_the_title( $deal_id ),
			'triggers'       => $triggers,
			'rewards'        => $rewards,
			'rewardDiscount' => $discount,
			'display'        => $this->get_display( $deal_id ),
			'pricing'        => array(
				'reward_per_item' => $pricing['per_item'],
				'trigger_total'   => round( $trigger_total, wc_get_price_decimals() ),
				'reward_total'    => round( $reward_total, wc_get_price_decimals() ),
				'total'           => round( $trigger_total + $reward_total, wc_get_price_decimals() ),
				'savings'         => $pricing['total_savings'],
			),
		);
	}
}
