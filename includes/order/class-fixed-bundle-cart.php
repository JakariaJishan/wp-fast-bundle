<?php // phpcs:ignore
/**
 * Fixed Bundle storefront: renders the bundle widget on the single product
 * page and handles the "Add Bundle to Cart" AJAX request. The generic
 * cart/checkout mechanics (pricing, labeling, cascade removal, order meta)
 * live in `Grouped_Offer_Cart`, shared with every other offer type.
 *
 * @package FBND\Includes\Order
 */

namespace FBND\Includes\Order;

use FBND\Includes\Services\Fixed_Bundle;
use FBND\Includes\Xpo;

defined( 'ABSPATH' ) || exit;

/**
 * Fixed_Bundle_Cart class.
 */
class Fixed_Bundle_Cart {

	/**
	 * Bundle domain/pricing service.
	 *
	 * @var Fixed_Bundle
	 */
	private $service;

	/**
	 * Shared grouped-cart-item mechanics.
	 *
	 * @var Grouped_Offer_Cart
	 */
	private $grouped_cart;

	/**
	 * Setup class.
	 *
	 * @param Grouped_Offer_Cart $grouped_cart Shared grouped-cart-item mechanics.
	 */
	public function __construct( Grouped_Offer_Cart $grouped_cart ) {
		$this->service      = new Fixed_Bundle();
		$this->grouped_cart = $grouped_cart;

		add_action( 'woocommerce_single_product_summary', array( $this, 'render_widget' ), 35 );

		add_action( 'wp_ajax_fbnd_add_fixed_bundle', array( $this, 'ajax_add_to_cart' ) );
		add_action( 'wp_ajax_nopriv_fbnd_add_fixed_bundle', array( $this, 'ajax_add_to_cart' ) );
	}

	/**
	 * Renders the Fixed Bundle widget below the Add to Cart form of the
	 * current single product, when a published bundle is assigned to it.
	 *
	 * @return void
	 */
	public function render_widget() {
		global $product;

		if ( ! $product instanceof \WC_Product ) {
			return;
		}

		$bundle_id = $this->service->get_for_product( $product->get_id() );
		if ( ! $bundle_id ) {
			return;
		}

		$data = $this->service->validate_and_price( $bundle_id );
		if ( is_wp_error( $data ) ) {
			return;
		}

		$this->grouped_cart->enqueue_assets();
		wp_localize_script(
			'fbnd-front-script',
			'fbndFixedBundle',
			array(
				'ajaxUrl'           => admin_url( 'admin-ajax.php' ),
				'nonce'             => wp_create_nonce( 'fbnd-nonce' ),
				'currency'          => fast_bundle()->get_currency_format(),
				'enableSavingsText' => (bool) Xpo::get_fbnd_settings_item( 'enableSavingsText', true ),
				'i18n'              => array(
					'adding'        => __( 'Adding…', 'fast-bundle' ),
					'added'         => __( 'Bundle added to your cart.', 'fast-bundle' ),
					'viewCart'      => __( 'View cart', 'fast-bundle' ),
					'error'         => __( 'Something went wrong. Please try again.', 'fast-bundle' ),
					'selectOptions' => __( 'Please select options for all products.', 'fast-bundle' ),
					/* translators: %s: a `%s` placeholder the JS substitutes with a formatted price. */
					'youSave'       => Xpo::get_fbnd_settings_item( 'savingsText', __( 'You save %s', 'fast-bundle' ) ),
					/* translators: %s: a `%s` placeholder the JS substitutes with a formatted price. */
					'save'          => __( 'SAVE %s', 'fast-bundle' ),
					/* translators: %s: a `%s` placeholder the JS substitutes with a rounded savings percentage. */
					'instantSavings' => __( 'Instant %s% Savings', 'fast-bundle' ),
				),
			)
		);

		$totals            = $data['totals'];
		$has_saving        = $totals['savings'] > 0;
		$show_savings_text = $has_saving && Xpo::get_fbnd_settings_item( 'enableSavingsText', true );
		$savings_percent   = $totals['original_total'] > 0 ? ( $totals['savings'] / $totals['original_total'] ) * 100 : 0;

		// Lets the storefront JS recompute totals live as a shopper resolves
		// variable items, reusing the same proportional-discount math as
		// `Fixed_Bundle::calculate_totals()`, without another round trip.
		$pricing_data = array(
			'items'    => array_map(
				function ( $item ) {
					return array(
						'product_id' => $item['product_id'],
						'quantity'   => $item['quantity'],
						'price'      => $item['price'],
					);
				},
				$data['items']
			),
			'discount' => $data['discount'],
		);
		?>
		<div
			class="fbnd-fixed-bundle"
			data-bundle-id="<?php echo esc_attr( $bundle_id ); ?>"
			data-pricing="<?php echo esc_attr( wp_json_encode( $pricing_data ) ); ?>"
		>
			<?php if ( $has_saving ) : ?>
				<span class="fbnd-fixed-bundle__ribbon">
					<?php
					printf(
						/* translators: %s: amount saved, already formatted as a price */
						esc_html__( 'SAVE %s', 'fast-bundle' ),
						wp_kses_post( wc_price( $totals['savings'] ) )
					);
					?>
				</span>
			<?php endif; ?>

			<div class="fbnd-fixed-bundle__header">
				<span class="fbnd-fixed-bundle__icon" aria-hidden="true"></span>
				<div class="fbnd-fixed-bundle__heading">
					<h3 class="fbnd-fixed-bundle__title"><?php echo esc_html( $data['title'] ); ?></h3>
					<p class="fbnd-fixed-bundle__savings" <?php echo $show_savings_text ? '' : 'hidden'; ?>>
						<?php
						printf(
							/* translators: %s: amount saved, already formatted as a price */
							esc_html( Xpo::get_fbnd_settings_item( 'savingsText', __( 'You save %s', 'fast-bundle' ) ) ),
							wp_kses_post( wc_price( $totals['savings'] ) )
						);
						?>
					</p>
				</div>
			</div>

			<?php if ( ! empty( $data['display']['description'] ) ) : ?>
				<div class="fbnd-fixed-bundle__desc"><?php echo wp_kses_post( $data['display']['description'] ); ?></div>
			<?php endif; ?>

			<div class="fbnd-fixed-bundle__strip">
				<?php foreach ( $data['items'] as $index => $item ) : ?>
					<?php if ( $index > 0 ) : ?>
						<span class="fbnd-fixed-bundle__strip-plus" aria-hidden="true">+</span>
					<?php endif; ?>
					<span class="fbnd-fixed-bundle__strip-item">
						<img src="<?php echo esc_url( $item['image'] ); ?>" alt="<?php echo esc_attr( $item['name'] ); ?>" />
						<?php if ( $item['quantity'] > 1 ) : ?>
							<span class="fbnd-fixed-bundle__strip-qty"><?php echo esc_html( $item['quantity'] ); ?>&times;</span>
						<?php endif; ?>
					</span>
				<?php endforeach; ?>
			</div>

			<ul class="fbnd-fixed-bundle__items">
				<?php foreach ( $data['items'] as $index => $item ) : ?>
					<li class="fbnd-fixed-bundle__item">
						<span class="fbnd-fixed-bundle__item-check" aria-hidden="true">✓</span>
						<div class="fbnd-fixed-bundle__item-main">
							<div class="fbnd-fixed-bundle__item-row">
								<span class="fbnd-fixed-bundle__item-name">
									<?php if ( 0 === $index ) : ?>
										<?php esc_html_e( 'This item:', 'fast-bundle' ); ?>
									<?php endif; ?>
									<?php echo esc_html( $item['name'] ); ?>
									<?php if ( $item['quantity'] > 1 ) : ?>
										<span class="fbnd-fixed-bundle__item-qty">(<?php echo esc_html( $item['quantity'] ); ?>&times;)</span>
									<?php endif; ?>
								</span>
								<span class="fbnd-fixed-bundle__item-price" data-product-id="<?php echo esc_attr( $item['product_id'] ); ?>">
									<?php echo wp_kses_post( wc_price( $item['price'] * $item['quantity'] ) ); ?>
								</span>
							</div>
							<?php $this->grouped_cart->render_variation_picker( $item, $data['display']['variantSelectorType'] ); ?>
						</div>
					</li>
				<?php endforeach; ?>
			</ul>

			<div class="fbnd-fixed-bundle__summary">
				<div class="fbnd-fixed-bundle__summary-row">
					<span class="fbnd-fixed-bundle__summary-label"><?php esc_html_e( 'Bundle Price:', 'fast-bundle' ); ?></span>
					<span class="fbnd-fixed-bundle__savings-percent" <?php echo $has_saving ? '' : 'hidden'; ?>>
						<?php
						printf(
							/* translators: %s: savings percentage, rounded to a whole number */
							esc_html__( 'Instant %s%% Savings', 'fast-bundle' ),
							esc_html( round( $savings_percent ) )
						);
						?>
					</span>
				</div>
				<div class="fbnd-fixed-bundle__price-row">
					<span class="fbnd-fixed-bundle__discounted"><?php echo wp_kses_post( wc_price( $totals['discounted_total'] ) ); ?></span>
					<span class="fbnd-fixed-bundle__original" <?php echo $has_saving ? '' : 'hidden'; ?>>
						<?php echo wp_kses_post( wc_price( $totals['original_total'] ) ); ?>
					</span>
				</div>
			</div>

			<?php if ( 'free_shipping' === $data['discount']['type'] ) : ?>
				<span class="fbnd-fixed-bundle__free-shipping">
					<?php echo esc_html( Xpo::get_fbnd_settings_item( 'freeShippingBadgeText', __( 'Free Shipping', 'fast-bundle' ) ) ); ?>
				</span>
			<?php endif; ?>

			<button type="button" class="fbnd-fixed-bundle__button button alt" data-bundle-id="<?php echo esc_attr( $bundle_id ); ?>">
				<?php echo esc_html( $data['display']['buttonText'] ); ?>
			</button>
			<p class="fbnd-fixed-bundle__microcopy">
				<?php esc_html_e( '1-Click purchase • Native WooCommerce cart session', 'fast-bundle' ); ?>
			</p>

			<div class="fbnd-fixed-bundle__message" role="status" aria-live="polite"></div>
		</div>
		<?php
	}

	/**
	 * Handles the "Add Bundle to Cart" AJAX request: revalidates and reprices
	 * the bundle server-side (never trusting anything from the request beyond
	 * the bundle id), then adds every item to the cart as one group.
	 *
	 * @return void
	 */
	public function ajax_add_to_cart() {
		check_ajax_referer( 'fbnd-nonce', 'nonce' );

		if ( ! function_exists( 'WC' ) || ! WC()->cart ) {
			wp_send_json_error( array( 'message' => __( 'Cart is not available right now.', 'fast-bundle' ) ) );
		}

		$bundle_id  = isset( $_POST['bundle_id'] ) ? absint( $_POST['bundle_id'] ) : 0; // phpcs:ignore WordPress.Security.NonceVerification.Missing
		$selections = $this->grouped_cart->parse_selections( $_POST['selections'] ?? '' ); // phpcs:ignore WordPress.Security.NonceVerification.Missing

		$data = $this->service->validate_and_price( $bundle_id, $selections );

		if ( is_wp_error( $data ) ) {
			wp_send_json_error( array( 'message' => $data->get_error_message() ) );
		}

		$items = array();
		foreach ( $data['items'] as $item ) {
			$items[] = array(
				'product_id'   => $item['product_id'],
				'quantity'     => $item['quantity'],
				'unit_price'   => $data['totals']['per_item'][ $item['product_id'] ] ?? $item['price'],
				'variation_id' => $item['variation_id'] ?? 0,
				'variation'    => $item['variation'] ?? array(),
			);
		}

		$result = $this->grouped_cart->add_group_to_cart(
			$items,
			$bundle_id,
			__( 'Bundle', 'fast-bundle' ),
			'free_shipping' === $data['discount']['type']
		);

		if ( is_wp_error( $result ) ) {
			wp_send_json_error( array( 'message' => $result->get_error_message() ) );
		}

		wp_send_json_success(
			array(
				'message'    => __( 'Bundle added to your cart.', 'fast-bundle' ),
				'cart_count' => WC()->cart->get_cart_contents_count(),
				'cart_url'   => wc_get_cart_url(),
			)
		);
	}
}
