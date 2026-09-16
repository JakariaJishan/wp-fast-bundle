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
use FBND\Includes\Xpo;

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
	 * Maps the deal's reward discount to the three phrases the widget's
	 * headline ("Buy 2 Get 1 AT 50% OFF"), corner badge ("50% OFF GIFT"),
	 * and subtitle ("...at 50% off!") build from — one source of truth so
	 * all three always agree with the deal's actual configured discount.
	 *
	 * @param array $discount `{ type, value }`.
	 * @return array { badge, headline, subtitle } phrase fragments.
	 */
	private function get_reward_phrases( $discount ) {
		$type  = isset( $discount['type'] ) ? $discount['type'] : 'free';
		$value = isset( $discount['value'] ) ? (float) $discount['value'] : 0;

		if ( 'fixed_price' === $type ) {
			$price = wp_strip_all_tags( wc_price( $value ) );
			return array(
				/* translators: %s: fixed reward price, already formatted */
				'badge'    => sprintf( __( '%s GIFT', 'fast-bundle' ), $price ),
				/* translators: %s: fixed reward price, already formatted */
				'headline' => sprintf( __( 'AT %s', 'fast-bundle' ), $price ),
				/* translators: %s: fixed reward price, already formatted */
				'subtitle' => sprintf( __( 'for %s', 'fast-bundle' ), $price ),
				'short'    => $price,
			);
		}

		if ( 'percentage' === $type ) {
			$percent = (string) round( $value );
			return array(
				/* translators: %s: discount percentage, rounded */
				'badge'    => sprintf( __( '%s%% OFF GIFT', 'fast-bundle' ), $percent ),
				/* translators: %s: discount percentage, rounded */
				'headline' => sprintf( __( 'AT %s%% OFF', 'fast-bundle' ), $percent ),
				/* translators: %s: discount percentage, rounded */
				'subtitle' => sprintf( __( 'at %s%% off', 'fast-bundle' ), $percent ),
				/* translators: %s: discount percentage, rounded */
				'short'    => sprintf( __( '-%s%%', 'fast-bundle' ), $percent ),
			);
		}

		return array(
			'badge'    => __( 'FREE GIFT', 'fast-bundle' ),
			'headline' => __( 'FREE', 'fast-bundle' ),
			'subtitle' => __( 'free', 'fast-bundle' ),
			'short'    => __( 'FREE', 'fast-bundle' ),
		);
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
				'ajaxUrl'           => admin_url( 'admin-ajax.php' ),
				'nonce'             => wp_create_nonce( 'fbnd-nonce' ),
				'currency'          => fast_bundle()->get_currency_format(),
				'enableSavingsText' => (bool) Xpo::get_fbnd_settings_item( 'enableSavingsText', true ),
				'i18n'              => array(
					'adding'        => __( 'Adding…', 'fast-bundle' ),
					'added'         => __( 'Deal added to your cart.', 'fast-bundle' ),
					'viewCart'      => __( 'View cart', 'fast-bundle' ),
					'error'         => __( 'Something went wrong. Please try again.', 'fast-bundle' ),
					'selectOptions' => __( 'Please select options for all products.', 'fast-bundle' ),
					/* translators: %s: a `%s` placeholder the JS substitutes with a formatted price. */
					'youSave'       => Xpo::get_fbnd_settings_item( 'savingsText', __( 'You save %s', 'fast-bundle' ) ),
					'free'          => Xpo::get_fbnd_settings_item( 'freeRewardText', __( 'FREE', 'fast-bundle' ) ),
					/* translators: %s: a `%s` placeholder the JS substitutes with a formatted price. */
					'saved'         => __( 'Saved %s', 'fast-bundle' ),
				),
			)
		);

		$pricing           = $data['pricing'];
		$has_saving        = $pricing['savings'] > 0;
		$show_savings_text = $has_saving && Xpo::get_fbnd_settings_item( 'enableSavingsText', true );
		$original_total    = $pricing['total'] + $pricing['savings'];

		$trigger_qty = array_sum( wp_list_pluck( $data['triggers'], 'quantity' ) );
		$reward_qty  = array_sum( wp_list_pluck( $data['rewards'], 'quantity' ) );
		$phrases     = $this->get_reward_phrases( $data['rewardDiscount'] );

		$headline = sprintf(
			/* translators: 1: trigger quantity 2: reward quantity 3: discount phrase, e.g. "AT 50% OFF" */
			__( 'Buy %1$d Get %2$d %3$s', 'fast-bundle' ),
			$trigger_qty,
			$reward_qty,
			$phrases['headline']
		);

		$trigger_label = 1 === count( $data['triggers'] )
			? $data['triggers'][0]['name']
			: sprintf(
				/* translators: %d: number of trigger items */
				_n( '%d item', '%d items', $trigger_qty, 'fast-bundle' ),
				$trigger_qty
			);
		$reward_label  = 1 === count( $data['rewards'] )
			? $data['rewards'][0]['name']
			: sprintf(
				/* translators: %d: number of reward items */
				_n( '%d item', '%d items', $reward_qty, 'fast-bundle' ),
				$reward_qty
			);

		$subtitle = sprintf(
			/* translators: 1: what to buy 2: what you get 3: discount phrase, e.g. "at 50% off" */
			__( 'Add %1$s and get %2$s %3$s!', 'fast-bundle' ),
			$trigger_label,
			$reward_label,
			$phrases['subtitle']
		);

		// Every trigger gets its own numbered step (a picker for a variable
		// one, a plain line for a simple one); the reward group is always
		// the final step. Only shown as "1.", "2." etc. once there's an
		// actual sequence — a single-step deal (no trigger picker needed)
		// doesn't need a number.
		$steps = array();
		foreach ( $data['triggers'] as $item ) {
			$steps[] = array(
				'type' => 'trigger',
				'item' => $item,
			);
		}
		$steps[]      = array( 'type' => 'rewards' );
		$show_numbers = count( $steps ) > 1;

		$reward_discounted_total = 0.0;
		$reward_original_total   = 0.0;
		foreach ( $data['rewards'] as $item ) {
			$reward_unit_price         = $pricing['reward_per_item'][ $item['product_id'] ] ?? $item['price'];
			$reward_discounted_total  += $reward_unit_price * $item['quantity'];
			$reward_original_total    += $item['price'] * $item['quantity'];
		}

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
			<span class="fbnd-bxgy__ribbon"><?php echo esc_html( $phrases['badge'] ); ?></span>

			<div class="fbnd-bxgy__header">
				<span class="fbnd-bxgy__icon" aria-hidden="true">🔥</span>
				<div class="fbnd-bxgy__heading">
					<h3 class="fbnd-bxgy__title"><?php echo esc_html( $headline ); ?></h3>
					<p class="fbnd-bxgy__savings" <?php echo $show_savings_text ? '' : 'hidden'; ?>>
						<?php echo esc_html( $subtitle ); ?>
					</p>
				</div>
			</div>

			<?php if ( ! empty( $data['display']['description'] ) ) : ?>
				<div class="fbnd-bxgy__desc"><?php echo wp_kses_post( $data['display']['description'] ); ?></div>
			<?php endif; ?>

			<div class="fbnd-bxgy__strip">
				<?php $all_items = array_merge( $data['triggers'], $data['rewards'] ); ?>
				<?php foreach ( $all_items as $index => $item ) : ?>
					<?php if ( $index > 0 ) : ?>
						<span class="fbnd-bxgy__strip-plus" aria-hidden="true">+</span>
					<?php endif; ?>
					<span class="fbnd-bxgy__strip-item">
						<img src="<?php echo esc_url( $item['image'] ); ?>" alt="<?php echo esc_attr( $item['name'] ); ?>" />
						<?php if ( $item['quantity'] > 1 ) : ?>
							<span class="fbnd-bxgy__strip-qty"><?php echo esc_html( $item['quantity'] ); ?>&times;</span>
						<?php endif; ?>
						<?php if ( $index >= count( $data['triggers'] ) ) : ?>
							<span class="fbnd-bxgy__strip-reward">
								<?php
								printf(
									/* translators: %s: discount phrase, e.g. "-50%" or "FREE" */
									esc_html__( 'Reward (%s)', 'fast-bundle' ),
									esc_html( $phrases['short'] )
								);
								?>
							</span>
						<?php endif; ?>
					</span>
				<?php endforeach; ?>
			</div>

			<?php foreach ( $steps as $step_index => $step ) : ?>
				<?php $step_number = $show_numbers ? ( $step_index + 1 ) : null; ?>
				<?php if ( 'trigger' === $step['type'] ) : ?>
					<?php $item = $step['item']; ?>
					<?php
					if ( ! empty( $item['is_variable'] ) && ! empty( $item['attributes'] ) ) {
						$select_label = sprintf(
							/* translators: %s: joined attribute labels, e.g. "Size & Color" */
							__( 'Select %s', 'fast-bundle' ),
							implode( ' & ', wp_list_pluck( $item['attributes'], 'label' ) )
						);
					} else {
						$select_label = $item['name'];
					}
					?>
					<div class="fbnd-bxgy__step">
						<div class="fbnd-bxgy__step-row">
							<span class="fbnd-bxgy__step-label">
								<?php if ( $step_number ) : ?>
									<?php echo esc_html( $step_number ); ?>.
								<?php endif; ?>
								<?php echo esc_html( $select_label ); ?>
								<?php if ( $item['quantity'] > 1 ) : ?>
									<?php
									printf(
										/* translators: %d: quantity of this trigger item required */
										esc_html__( ' (Qty: %d)', 'fast-bundle' ),
										esc_html( $item['quantity'] )
									);
									?>
								<?php endif; ?>
							</span>
							<span class="fbnd-bxgy__item-price" data-product-id="<?php echo esc_attr( $item['product_id'] ); ?>">
								<?php echo wp_kses_post( wc_price( $item['price'] * $item['quantity'] ) ); ?>
							</span>
						</div>
						<?php $this->grouped_cart->render_variation_picker( $item, $data['display']['variantSelectorType'] ); ?>
					</div>
				<?php else : ?>
					<div class="fbnd-bxgy__step fbnd-bxgy__step--reward">
						<div class="fbnd-bxgy__step-row">
							<span class="fbnd-bxgy__step-label">
								<?php if ( $step_number ) : ?>
									<?php echo esc_html( $step_number ); ?>.
								<?php endif; ?>
								<?php echo esc_html( _n( 'Your Reward', 'Your Rewards', count( $data['rewards'] ), 'fast-bundle' ) ); ?>
							</span>
							<span class="fbnd-bxgy__reward-total">
								<?php echo wp_kses_post( wc_price( $reward_discounted_total ) ); ?>
								<?php if ( $reward_discounted_total < $reward_original_total ) : ?>
									<span class="fbnd-bxgy__reward-total-original"><?php echo wp_kses_post( wc_price( $reward_original_total ) ); ?></span>
								<?php endif; ?>
							</span>
						</div>
						<ul class="fbnd-bxgy__items">
							<?php foreach ( $data['rewards'] as $item ) : ?>
								<?php $reward_price = $pricing['reward_per_item'][ $item['product_id'] ] ?? $item['price']; ?>
								<li class="fbnd-bxgy__item">
									<span class="fbnd-bxgy__item-check" aria-hidden="true">✓</span>
									<div class="fbnd-bxgy__item-main">
										<div class="fbnd-bxgy__item-row">
											<span class="fbnd-bxgy__item-name">
												<?php echo esc_html( $item['name'] ); ?>
												<?php if ( $item['quantity'] > 1 ) : ?>
													<span class="fbnd-bxgy__item-qty">(<?php echo esc_html( $item['quantity'] ); ?>&times;)</span>
												<?php endif; ?>
											</span>
											<span class="fbnd-bxgy__item-price" data-product-id="<?php echo esc_attr( $item['product_id'] ); ?>">
												<?php if ( $reward_price < $item['price'] ) : ?>
													<span class="fbnd-bxgy__item-price-original"><?php echo wp_kses_post( wc_price( $item['price'] * $item['quantity'] ) ); ?></span>
												<?php endif; ?>
												<?php if ( 0.0 === (float) $reward_price ) : ?>
													<span class="fbnd-bxgy__item-price-free"><?php echo esc_html( Xpo::get_fbnd_settings_item( 'freeRewardText', __( 'FREE', 'fast-bundle' ) ) ); ?></span>
												<?php else : ?>
													<?php echo wp_kses_post( wc_price( $reward_price * $item['quantity'] ) ); ?>
												<?php endif; ?>
											</span>
										</div>
										<?php $this->grouped_cart->render_variation_picker( $item, $data['display']['variantSelectorType'] ); ?>
									</div>
								</li>
							<?php endforeach; ?>
						</ul>
					</div>
				<?php endif; ?>
			<?php endforeach; ?>

			<div class="fbnd-bxgy__summary">
				<div class="fbnd-bxgy__summary-row">
					<span class="fbnd-bxgy__summary-label"><?php esc_html_e( 'Total Deal Price:', 'fast-bundle' ); ?></span>
					<span class="fbnd-bxgy__saved-badge" <?php echo $has_saving ? '' : 'hidden'; ?>>
						<?php
						printf(
							/* translators: %s: amount saved, already formatted as a price */
							esc_html__( 'Saved %s', 'fast-bundle' ),
							wp_kses_post( wc_price( $pricing['savings'] ) )
						);
						?>
					</span>
				</div>
				<div class="fbnd-bxgy__price-row">
					<span class="fbnd-bxgy__total"><?php echo wp_kses_post( wc_price( $pricing['total'] ) ); ?></span>
					<span class="fbnd-bxgy__original" <?php echo $has_saving ? '' : 'hidden'; ?>>
						<?php echo wp_kses_post( wc_price( $original_total ) ); ?>
					</span>
				</div>
			</div>

			<button type="button" class="fbnd-bxgy__button button alt" data-deal-id="<?php echo esc_attr( $deal_id ); ?>">
				<?php echo esc_html( $data['display']['buttonText'] ); ?>
			</button>
			<p class="fbnd-bxgy__microcopy">
				<?php esc_html_e( 'Instant cart bundle rule applied • WooCommerce native checkout', 'fast-bundle' ); ?>
			</p>

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
