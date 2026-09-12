<?php // phpcs:ignore
/**
 * Fixed Bundle storefront + cart wiring: renders the bundle widget on the
 * single product page, handles the "Add Bundle to Cart" AJAX request, and
 * keeps the bundle's items priced/grouped as one unit through cart, cart
 * changes, and checkout.
 *
 * Deliberately independent of the existing `CartPage`/`CheckoutPage`
 * classes, which belong to a separate (currently unwired) generic option
 * pricing feature — Fixed Bundle owns its own small pipeline end to end.
 *
 * @package FBND\Includes\Order
 */

namespace FBND\Includes\Order;

use FBND\Includes\Services\Fixed_Bundle;

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
	 * Setup class.
	 */
	public function __construct() {
		$this->service = new Fixed_Bundle();

		add_action( 'woocommerce_single_product_summary', array( $this, 'render_widget' ), 35 );

		add_action( 'wp_ajax_fbnd_add_fixed_bundle', array( $this, 'ajax_add_to_cart' ) );
		add_action( 'wp_ajax_nopriv_fbnd_add_fixed_bundle', array( $this, 'ajax_add_to_cart' ) );

		add_action( 'woocommerce_before_calculate_totals', array( $this, 'apply_bundle_prices' ), 20 );
		add_filter( 'woocommerce_get_item_data', array( $this, 'add_item_data' ), 10, 2 );
		add_action( 'woocommerce_cart_item_removed', array( $this, 'cascade_remove' ), 10, 2 );
		add_action( 'woocommerce_checkout_create_order_line_item', array( $this, 'add_order_line_item_meta' ), 10, 4 );
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

		$this->enqueue_assets();

		$totals    = $data['totals'];
		$has_saving = $totals['savings'] > 0;
		?>
		<div class="fbnd-fixed-bundle" data-bundle-id="<?php echo esc_attr( $bundle_id ); ?>">
			<h3 class="fbnd-fixed-bundle__title"><?php echo esc_html( $data['title'] ); ?></h3>
			<?php if ( ! empty( $data['display']['description'] ) ) : ?>
				<div class="fbnd-fixed-bundle__desc"><?php echo wp_kses_post( $data['display']['description'] ); ?></div>
			<?php endif; ?>

			<ul class="fbnd-fixed-bundle__items">
				<?php foreach ( $data['items'] as $item ) : ?>
					<li class="fbnd-fixed-bundle__item">
						<img class="fbnd-fixed-bundle__item-image" src="<?php echo esc_url( $item['image'] ); ?>" alt="<?php echo esc_attr( $item['name'] ); ?>" />
						<span class="fbnd-fixed-bundle__item-name">
							<?php echo esc_html( $item['name'] ); ?>
							<?php if ( $item['quantity'] > 1 ) : ?>
								<span class="fbnd-fixed-bundle__item-qty">&times;&nbsp;<?php echo esc_html( $item['quantity'] ); ?></span>
							<?php endif; ?>
						</span>
					</li>
				<?php endforeach; ?>
			</ul>

			<div class="fbnd-fixed-bundle__summary">
				<?php if ( $has_saving ) : ?>
					<span class="fbnd-fixed-bundle__original"><?php echo wp_kses_post( wc_price( $totals['original_total'] ) ); ?></span>
				<?php endif; ?>
				<span class="fbnd-fixed-bundle__discounted"><?php echo wp_kses_post( wc_price( $totals['discounted_total'] ) ); ?></span>
				<?php if ( $has_saving ) : ?>
					<span class="fbnd-fixed-bundle__savings">
						<?php
						printf(
							/* translators: %s: amount saved, already formatted as a price */
							esc_html__( 'You save %s', 'fast-bundle' ),
							wp_kses_post( wc_price( $totals['savings'] ) )
						);
						?>
					</span>
				<?php endif; ?>
			</div>

			<button type="button" class="fbnd-fixed-bundle__button button alt" data-bundle-id="<?php echo esc_attr( $bundle_id ); ?>">
				<?php echo esc_html( $data['display']['buttonText'] ); ?>
			</button>

			<div class="fbnd-fixed-bundle__message" role="status" aria-live="polite"></div>
		</div>
		<?php
	}

	/**
	 * Enqueues the storefront widget's script and style, once per page load.
	 *
	 * @return void
	 */
	private function enqueue_assets() {
		if ( wp_style_is( 'fbnd-fixed-bundle-style', 'enqueued' ) ) {
			return;
		}

		fast_bundle()->enqueue_style( 'fbnd-fixed-bundle-style', 'fastbundle-fixed-bundle' );

		$asset = fast_bundle()->get_script_asset( 'assets/js/fixed-bundle.js', array( 'jquery' ) );
		wp_enqueue_script( 'fbnd-fixed-bundle-script', FBND_URL . 'assets/js/fixed-bundle.js', $asset['dependencies'], $asset['version'], true );

		wp_localize_script(
			'fbnd-fixed-bundle-script',
			'fbndFixedBundle',
			array(
				'ajaxUrl' => admin_url( 'admin-ajax.php' ),
				'nonce'   => wp_create_nonce( 'fbnd-nonce' ),
				'i18n'    => array(
					'adding'   => __( 'Adding…', 'fast-bundle' ),
					'added'    => __( 'Bundle added to your cart.', 'fast-bundle' ),
					'viewCart' => __( 'View cart', 'fast-bundle' ),
					'error'    => __( 'Something went wrong. Please try again.', 'fast-bundle' ),
				),
			)
		);
	}

	/**
	 * Handles the "Add Bundle to Cart" AJAX request: revalidates and reprices
	 * the bundle server-side (never trusting anything from the request beyond
	 * the bundle id), then adds every item to the cart tagged with a shared
	 * bundle key so it can be priced and removed as one unit.
	 *
	 * @return void
	 */
	public function ajax_add_to_cart() {
		check_ajax_referer( 'fbnd-nonce', 'nonce' );

		if ( ! function_exists( 'WC' ) || ! WC()->cart ) {
			wp_send_json_error( array( 'message' => __( 'Cart is not available right now.', 'fast-bundle' ) ) );
		}

		$bundle_id = isset( $_POST['bundle_id'] ) ? absint( $_POST['bundle_id'] ) : 0; // phpcs:ignore WordPress.Security.NonceVerification.Missing

		$data = $this->service->validate_and_price( $bundle_id );

		if ( is_wp_error( $data ) ) {
			wp_send_json_error( array( 'message' => $data->get_error_message() ) );
		}

		$bundle_key = 'fbnd_fb_' . $bundle_id . '_' . wp_generate_password( 8, false, false );

		foreach ( $data['items'] as $item ) {
			$unit_price = isset( $data['totals']['per_item'][ $item['product_id'] ] )
				? $data['totals']['per_item'][ $item['product_id'] ]
				: $item['price'];

			$added = WC()->cart->add_to_cart(
				$item['product_id'],
				$item['quantity'],
				0,
				array(),
				array(
					'fbnd_bundle_key'        => $bundle_key,
					'fbnd_bundle_id'         => $bundle_id,
					'fbnd_bundle_item_price' => $unit_price,
				)
			);

			if ( ! $added ) {
				wp_send_json_error( array( 'message' => __( 'Could not add the bundle to your cart. Please try again.', 'fast-bundle' ) ) );
			}
		}

		wp_send_json_success(
			array(
				'message'    => __( 'Bundle added to your cart.', 'fast-bundle' ),
				'cart_count' => WC()->cart->get_cart_contents_count(),
				'cart_url'   => wc_get_cart_url(),
			)
		);
	}

	/**
	 * Overrides each bundle item's cart price with the discounted unit price
	 * computed at add-to-cart time.
	 *
	 * @param \WC_Cart $cart The cart being totalled.
	 * @return void
	 */
	public function apply_bundle_prices( $cart ) {
		if ( is_admin() && ! defined( 'DOING_AJAX' ) ) {
			return;
		}

		foreach ( $cart->get_cart() as $cart_item ) {
			if ( isset( $cart_item['fbnd_bundle_item_price'] ) ) {
				$cart_item['data']->set_price( $cart_item['fbnd_bundle_item_price'] );
			}
		}
	}

	/**
	 * Shows which bundle a cart line belongs to, under the item in cart and
	 * checkout.
	 *
	 * @param array $item_data Existing item data rows.
	 * @param array $cart_item The cart item.
	 * @return array Item data rows.
	 */
	public function add_item_data( $item_data, $cart_item ) {
		if ( ! empty( $cart_item['fbnd_bundle_id'] ) ) {
			$item_data[] = array(
				'name'  => __( 'Bundle', 'fast-bundle' ),
				'value' => get_the_title( $cart_item['fbnd_bundle_id'] ),
			);
		}
		return $item_data;
	}

	/**
	 * Cascades removal of the rest of a bundle's items when one of them is
	 * removed from the cart, so the bundle always behaves as one unit.
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
		if ( empty( $removed['fbnd_bundle_key'] ) ) {
			return;
		}

		$bundle_key = $removed['fbnd_bundle_key'];

		foreach ( $cart->get_cart() as $key => $item ) {
			if ( $key !== $cart_item_key && isset( $item['fbnd_bundle_key'] ) && $item['fbnd_bundle_key'] === $bundle_key ) {
				$cart->remove_cart_item( $key );
			}
		}
	}

	/**
	 * Persists which bundle an order line item belonged to.
	 *
	 * @param \WC_Order_Item_Product $item          The order line item.
	 * @param string                 $cart_item_key The cart item key.
	 * @param array                  $cart_item     The cart item.
	 * @param \WC_Order              $order         The order.
	 * @return void
	 */
	public function add_order_line_item_meta( $item, $cart_item_key, $cart_item, $order ) {
		if ( empty( $cart_item['fbnd_bundle_id'] ) ) {
			return;
		}

		$item->add_meta_data( '_fbnd_bundle_id', $cart_item['fbnd_bundle_id'] );
		$item->add_meta_data( __( 'Bundle', 'fast-bundle' ), get_the_title( $cart_item['fbnd_bundle_id'] ) );
	}
}
