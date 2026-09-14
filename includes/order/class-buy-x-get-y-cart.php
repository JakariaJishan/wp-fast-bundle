<?php // phpcs:ignore
/**
 * Buy X Get Y storefront: renders the deal widget on the single product
 * page and handles the "Add Deal to Cart" AJAX request. The generic
 * cart/checkout mechanics live in `Grouped_Offer_Cart`, shared with every
 * other offer type.
 *
 * @package FBND\Includes\Order
 */

namespace FBND\Includes\Order;

use FBND\Includes\Services\Buy_X_Get_Y;

defined( 'ABSPATH' ) || exit;

/**
 * Buy_X_Get_Y_Cart class.
 */
class Buy_X_Get_Y_Cart {

	/**
	 * Deal domain/pricing service.
	 *
	 * @var Buy_X_Get_Y
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
		$this->service      = new Buy_X_Get_Y();
		$this->grouped_cart = $grouped_cart;

		add_action( 'woocommerce_single_product_summary', array( $this, 'render_widget' ), 36 );

		add_action( 'wp_ajax_fbnd_add_buy_x_get_y', array( $this, 'ajax_add_to_cart' ) );
		add_action( 'wp_ajax_nopriv_fbnd_add_buy_x_get_y', array( $this, 'ajax_add_to_cart' ) );
	}

	/**
	 * Renders the Buy X Get Y widget below the Add to Cart form of the
	 * current single product, when a published deal is assigned to it.
	 *
	 * @return void
	 */
	public function render_widget() {
		global $product;

		if ( ! $product instanceof \WC_Product ) {
			return;
		}

		$deal_id = $this->service->get_for_product( $product->get_id() );
		if ( ! $deal_id ) {
			return;
		}

		$data = $this->service->validate_and_price( $deal_id );
		if ( is_wp_error( $data ) ) {
			return;
		}

		$this->grouped_cart->enqueue_assets();
		wp_localize_script(
			'fbnd-front-script',
			'fbndBuyXGetY',
			array(
				'ajaxUrl'  => admin_url( 'admin-ajax.php' ),
				'nonce'    => wp_create_nonce( 'fbnd-nonce' ),
				'currency' => fast_bundle()->get_currency_format(),
				'i18n'     => array(
					'adding'        => __( 'Adding…', 'fast-bundle' ),
					'added'         => __( 'Deal added to your cart.', 'fast-bundle' ),
					'viewCart'      => __( 'View cart', 'fast-bundle' ),
					'error'         => __( 'Something went wrong. Please try again.', 'fast-bundle' ),
					'selectOptions' => __( 'Please select options for all products.', 'fast-bundle' ),
					/* translators: %s: a `%s` placeholder the JS substitutes with a formatted price. */
					'youSave'       => __( 'You save %s', 'fast-bundle' ),
					'free'          => __( 'FREE', 'fast-bundle' ),
				),
			)
		);

		$pricing    = $data['pricing'];
		$has_saving = $pricing['savings'] > 0;

		// Lets the storefront JS recompute totals live as a shopper resolves
		// variable items, reusing the same trigger-full-price /
		// reward-discounted math as `Buy_X_Get_Y::calculate_reward_pricing()`.
		$to_pricing_items = function ( $items ) {
			return array_map(
				function ( $item ) {
					return array(
						'product_id' => $item['product_id'],
						'quantity'   => $item['quantity'],
						'price'      => $item['price'],
					);
				},
				$items
			);
		};
		$pricing_data     = array(
			'triggers'       => $to_pricing_items( $data['triggers'] ),
			'rewards'        => $to_pricing_items( $data['rewards'] ),
			'rewardDiscount' => $data['rewardDiscount'],
		);
		?>
		<div
			class="fbnd-bxgy"
			data-deal-id="<?php echo esc_attr( $deal_id ); ?>"
			data-pricing="<?php echo esc_attr( wp_json_encode( $pricing_data ) ); ?>"
		>
			<h3 class="fbnd-bxgy__title"><?php echo esc_html( $data['title'] ); ?></h3>
			<?php if ( ! empty( $data['display']['description'] ) ) : ?>
				<div class="fbnd-bxgy__desc"><?php echo wp_kses_post( $data['display']['description'] ); ?></div>
			<?php endif; ?>

			<div class="fbnd-bxgy__group">
				<span class="fbnd-bxgy__group-label"><?php esc_html_e( 'Buy', 'fast-bundle' ); ?></span>
				<ul class="fbnd-bxgy__items">
					<?php foreach ( $data['triggers'] as $item ) : ?>
						<li class="fbnd-bxgy__item">
							<img class="fbnd-bxgy__item-image" src="<?php echo esc_url( $item['image'] ); ?>" alt="<?php echo esc_attr( $item['name'] ); ?>" />
							<span class="fbnd-bxgy__item-name">
								<?php echo esc_html( $item['name'] ); ?>
								<?php if ( $item['quantity'] > 1 ) : ?>
									<span class="fbnd-bxgy__item-qty">&times;&nbsp;<?php echo esc_html( $item['quantity'] ); ?></span>
								<?php endif; ?>
							</span>
							<?php $this->grouped_cart->render_variation_picker( $item, $data['display']['variantSelectorType'] ); ?>
						</li>
					<?php endforeach; ?>
				</ul>
			</div>

			<div class="fbnd-bxgy__group">
				<span class="fbnd-bxgy__group-label"><?php esc_html_e( 'Get', 'fast-bundle' ); ?></span>
				<ul class="fbnd-bxgy__items">
					<?php foreach ( $data['rewards'] as $item ) : ?>
						<?php $reward_price = $pricing['reward_per_item'][ $item['product_id'] ] ?? $item['price']; ?>
						<li class="fbnd-bxgy__item">
							<img class="fbnd-bxgy__item-image" src="<?php echo esc_url( $item['image'] ); ?>" alt="<?php echo esc_attr( $item['name'] ); ?>" />
							<span class="fbnd-bxgy__item-name">
								<?php echo esc_html( $item['name'] ); ?>
								<?php if ( $item['quantity'] > 1 ) : ?>
									<span class="fbnd-bxgy__item-qty">&times;&nbsp;<?php echo esc_html( $item['quantity'] ); ?></span>
								<?php endif; ?>
							</span>
							<span class="fbnd-bxgy__item-price" data-product-id="<?php echo esc_attr( $item['product_id'] ); ?>">
								<?php if ( $reward_price < $item['price'] ) : ?>
									<span class="fbnd-bxgy__item-price-original"><?php echo wp_kses_post( wc_price( $item['price'] ) ); ?></span>
								<?php endif; ?>
								<?php if ( 0.0 === (float) $reward_price ) : ?>
									<span class="fbnd-bxgy__item-price-free"><?php esc_html_e( 'FREE', 'fast-bundle' ); ?></span>
								<?php else : ?>
									<?php echo wp_kses_post( wc_price( $reward_price ) ); ?>
								<?php endif; ?>
							</span>
							<?php $this->grouped_cart->render_variation_picker( $item, $data['display']['variantSelectorType'] ); ?>
						</li>
					<?php endforeach; ?>
				</ul>
			</div>

			<div class="fbnd-bxgy__summary">
				<span class="fbnd-bxgy__total"><?php echo wp_kses_post( wc_price( $pricing['total'] ) ); ?></span>
				<span class="fbnd-bxgy__savings" <?php echo $has_saving ? '' : 'hidden'; ?>>
					<?php
					printf(
						/* translators: %s: amount saved, already formatted as a price */
						esc_html__( 'You save %s', 'fast-bundle' ),
						wp_kses_post( wc_price( $pricing['savings'] ) )
					);
					?>
				</span>
			</div>

			<button type="button" class="fbnd-bxgy__button button alt" data-deal-id="<?php echo esc_attr( $deal_id ); ?>">
				<?php echo esc_html( $data['display']['buttonText'] ); ?>
			</button>

			<div class="fbnd-bxgy__message" role="status" aria-live="polite"></div>
		</div>
		<?php
	}

	/**
	 * Handles the "Add Deal to Cart" AJAX request: revalidates and reprices
	 * the deal server-side, then adds triggers (full price) and rewards
	 * (discounted) to the cart as one group.
	 *
	 * @return void
	 */
	public function ajax_add_to_cart() {
		check_ajax_referer( 'fbnd-nonce', 'nonce' );

		if ( ! function_exists( 'WC' ) || ! WC()->cart ) {
			wp_send_json_error( array( 'message' => __( 'Cart is not available right now.', 'fast-bundle' ) ) );
		}

		$deal_id    = isset( $_POST['deal_id'] ) ? absint( $_POST['deal_id'] ) : 0; // phpcs:ignore WordPress.Security.NonceVerification.Missing
		$selections = $this->grouped_cart->parse_selections( $_POST['selections'] ?? '' ); // phpcs:ignore WordPress.Security.NonceVerification.Missing

		$data = $this->service->validate_and_price( $deal_id, $selections );

		if ( is_wp_error( $data ) ) {
			wp_send_json_error( array( 'message' => $data->get_error_message() ) );
		}

		$items = array();
		foreach ( $data['triggers'] as $item ) {
			$items[] = array(
				'product_id'   => $item['product_id'],
				'quantity'     => $item['quantity'],
				'unit_price'   => $item['price'],
				'variation_id' => $item['variation_id'] ?? 0,
				'variation'    => $item['variation'] ?? array(),
			);
		}
		foreach ( $data['rewards'] as $item ) {
			$items[] = array(
				'product_id'   => $item['product_id'],
				'quantity'     => $item['quantity'],
				'unit_price'   => $data['pricing']['reward_per_item'][ $item['product_id'] ] ?? $item['price'],
				'variation_id' => $item['variation_id'] ?? 0,
				'variation'    => $item['variation'] ?? array(),
			);
		}

		$result = $this->grouped_cart->add_group_to_cart( $items, $deal_id, __( 'Deal', 'fast-bundle' ) );

		if ( is_wp_error( $result ) ) {
			wp_send_json_error( array( 'message' => $result->get_error_message() ) );
		}

		wp_send_json_success(
			array(
				'message'    => __( 'Deal added to your cart.', 'fast-bundle' ),
				'cart_count' => WC()->cart->get_cart_contents_count(),
				'cart_url'   => wc_get_cart_url(),
			)
		);
	}
}
