<?php	// phpcs:ignore
/**
 * CartPage.
 *
 * @package FBND
 * @since v.1.0.0
 */
namespace FBND\Includes\Order;

defined( 'ABSPATH' ) || exit;

/**
 * CheckoutPage class.
 */
class CheckoutPage {
	/**
	 * Constructor
	 */
	public function __construct() {

		add_action( 'woocommerce_checkout_create_order_line_item', array( $this, 'woocommerce_checkout_create_order_line_item' ), 10, 4 );
		// if ( ! has_action( 'woocommerce_checkout_create_order_line_item', [ $this, 'woocommerce_checkout_create_order_line_item' ] ) ) {
		// add_action( 'woocommerce_checkout_create_order_line_item', [ $this, 'woocommerce_checkout_create_order_line_item' ], 10, 4 );
		// }.
		add_action( 'woocommerce_checkout_order_processed', array( $this, 'woocommerce_checkout_create_order' ), 10 );
		add_action( 'woocommerce_store_api_checkout_order_processed', array( $this, 'woocommerce_checkout_create_order' ), 10 );
		add_action( 'woocommerce_view_order', array( $this, 'fbnd_custom_view_order_fields' ), 10, 1 );
		add_action( 'woocommerce_thankyou', array( $this, 'fbnd_custom_view_order_fields' ), 10, 1 );
		add_action( 'woocommerce_order_status_completed', array( $this, 'fbnd_woocommerce_order_status_completed' ), 10, 1 );
	}

	/**
	 * Moved Files when order status is completed
	 *
	 * Retrieves the WooCommerce order by ID and checks for the custom meta field
	 *
	 * @param int $order_id The ID of the WooCommerce order being viewed.
	 *
	 * @return void
	 */
	public function fbnd_woocommerce_order_status_completed( $order_id ) {
		$order = wc_get_order( $order_id );

		if ( ! $order ) {
			return;
		}

		// Get all items from the order.
		$items = $order->get_items();

		// Loop through each item in the order.
		foreach ( $items as $item ) {
			// Get the campaign ID from the item's meta data.
			// $fbnd_option_uploads_path = $item->get_meta( '_fbnd_option_uploads_path' );
			// if ( ! empty( $fbnd_option_uploads_path ) ) {
			// $moved_data = fast_bundle()->fbnd_move_uploadblock_files( $fbnd_option_uploads_path, 'order_placed' );
			// }.

			// starts.
			$cart_item_fbnd_selection = $item->get_meta( 'cart_item_fbnd_selection' );
			if ( ! empty( $cart_item_fbnd_selection['extra_data'] ) ) {

				foreach ( $cart_item_fbnd_selection['extra_data'] as $val ) {
					if ( ! isset( $val['fbnd_additional'] ) ) {
						continue;
					}
					if ( 'upload' === $val['fbnd_additional']['type'] ) {
						if ( CartPage::PERSONALIZER_MOCKUP_META_KEY === $val['name'] ) {
							$moved_url = $this->move_personalizer_mockup_file( $val, 'order_placed' );
							if ( $moved_url ) {
								$item->update_meta_data(
									$val['name'],
									fast_bundle()->render_personalizer_mockup_html( $moved_url )
								);
							}
						} else {
							$result = $this->process_upload_field_on_checkout( $val, 'order_placed' );
							$item->update_meta_data( $val['name'], $result['value'] );
						}
					} elseif ( 'section' === $val['fbnd_additional']['type'] ) {
						$result = $this->process_section_field_on_checkout( $val, 'order_placed' );
						$item->update_meta_data( $val['name'], $result['value'] );
					}
				}
			}

			$item->save();
		}
	}

	/**
	 * Display and enqueue custom assets for the "View Order" page in My Account.
	 *
	 * Retrieves the WooCommerce order by ID and checks for the custom meta field
	 * `_fbnd_option_ids`. If the meta exists and is not empty, enqueue the
	 * required CSS and JavaScript files for displaying custom order details.
	 *
	 * @param int $order_id The ID of the WooCommerce order being viewed.
	 *
	 * @return void
	 */
	public function fbnd_custom_view_order_fields( $order_id ) {
		$order = wc_get_order( $order_id );

		if ( ! $order ) {
			return;
		}

		$custom_note = $order->get_meta( '_fbnd_option_ids' );

		if ( ! empty( $custom_note ) ) {
			fast_bundle()->enqueue_style( 'fbnd-cart-style', 'wowcart' );

			$cart_asset = fast_bundle()->get_script_asset( 'assets/js/wowcart.js', array( 'jquery' ) );
			wp_enqueue_script( 'fbnd-cart-script', FBND_URL . 'assets/js/wowcart.js', $cart_asset['dependencies'], $cart_asset['version'], true );
			wp_set_script_translations( 'fbnd-cart-script', 'fast-bundle', FBND_PATH . 'languages/' );
		}
	}

	/**
	 * WooCommerce create order line item
	 *
	 * @param object    $item Item Data.
	 * @param string    $cart_item_key Cart Item Key.
	 * @param array     $cart_item Cart Item.
	 * @param \WC_Order $order Order.
	 * @return void
	 */
	public function woocommerce_checkout_create_order_line_item( $item, $cart_item_key, $cart_item, $order ) {

		// Add Option Ids applied.
		if ( ! empty( $cart_item['fbnd_option_published_ids'] ) ) {
			$item->add_meta_data( '_fbnd_option_ids', $cart_item['fbnd_option_published_ids'] );
		}

		// Add Option Selections.
		if ( isset( $cart_item['fbnd_selection'] ) ) {
			$item->add_meta_data( 'cart_item_fbnd_selection', $cart_item['fbnd_selection'] );
		}

		if ( ! empty( $cart_item['fbnd_selection']['extra_data'] ) ) {
			$fbnd_uploads_path = array();

			foreach ( $cart_item['fbnd_selection']['extra_data'] as $val ) {
				if ( ! isset( $val['fbnd_additional'] ) ) {
					$item->add_meta_data( $val['name'], $val['value'] );
					continue;
				}
				if ( 'upload' === $val['fbnd_additional']['type'] ) {
					if ( CartPage::PERSONALIZER_MOCKUP_META_KEY === $val['name'] ) {
						// Thumbnail + link, not the generic upload-field "<a>filename</a>"
						// text — same markup the cart/checkout item-data row uses.
						$moved_url = $this->move_personalizer_mockup_file( $val, 'temp' );
						if ( $moved_url ) {
							$fbnd_uploads_path[] = $moved_url;
							$item->add_meta_data(
								$val['name'],
								fast_bundle()->render_personalizer_mockup_html( $moved_url )
							);
						}
					} else {
						$result            = $this->process_upload_field_on_checkout( $val, 'temp' );
						$fbnd_uploads_path = array_merge( $fbnd_uploads_path, $result['paths'] );
						$item->add_meta_data( $val['name'], $result['value'] );
					}
				} elseif ( 'section' === $val['fbnd_additional']['type'] ) {
					$result            = $this->process_section_field_on_checkout( $val, 'temp' );
					$fbnd_uploads_path = array_merge( $fbnd_uploads_path, $result['paths'] );
					$item->add_meta_data( $val['name'], $result['value'] );
				} else {
					$item->add_meta_data( $val['name'], $val['value'] );
				}
			}

			// Add Upload files Path.
			if ( ! empty( $fbnd_uploads_path ) ) {
				$item->add_meta_data( '_fbnd_option_uploads_path', $fbnd_uploads_path );
			}
		}

		// Add Price Data.
		if ( isset( $cart_item['fbnd_selection']['price_data'] ) ) {
			$item->add_meta_data( '_fbnd_option_price_data', $cart_item['fbnd_selection']['price_data'] );
		}
	}

	/**
	 * Perform action after create order on WooCommerce
	 *
	 * @since 1.0.0
	 *
	 * @param W\C_Order $order Order.
	 * @return void
	 */
	public function woocommerce_checkout_create_order( $order ) {
		$order = wc_get_order( $order );

		if ( ! $order ) {
			return;
		}

		// Get all items from the order.
		$items = $order->get_items();

		$data = array();

		// Loop through each item in the order.
		foreach ( $items as $item ) {
			// Get the campaign ID from the item's meta data.
			$option_ids             = $item->get_meta( '_fbnd_option_ids' );
			$fbnd_option_price_data = $item->get_meta( '_fbnd_option_price_data' );

			if ( $option_ids ) {
				$order->update_meta_data( '_fbnd_option_ids', $option_ids );
				$option_ids = (array) $option_ids;
				$data       = array_unique( array_merge( $data, $option_ids ) );
				if ( $fbnd_option_price_data ) {
					foreach ( $option_ids as $opt_id ) {
						if ( isset( $fbnd_option_price_data[ $opt_id ] ) ) {
							do_action( 'fbnd_update_stats_table_data', $opt_id, 'sales', $fbnd_option_price_data[ $opt_id ] );
						}
					}
				}
			}

			// Add Order Item Meta & Handle Upload paths.
			$cart_item_fbnd_selection = $item->get_meta( 'cart_item_fbnd_selection' );
			if ( ! empty( $cart_item_fbnd_selection['extra_data_Depricated'] ) ) {
				$fbnd_uploads_path = array();

				foreach ( $cart_item_fbnd_selection['extra_data'] as $val ) {
					if ( ! isset( $val['fbnd_additional'] ) ) {
						$item->add_meta_data( $val['name'], $val['value'] );
						continue;
					}
					if ( 'upload' === $val['fbnd_additional']['type'] ) {
						$result            = $this->process_upload_field_on_checkout( $val, 'temp' );
						$fbnd_uploads_path = array_merge( $fbnd_uploads_path, $result['paths'] );
						$item->add_meta_data( $val['name'], $result['value'] );
					} elseif ( 'section' === $val['fbnd_additional']['type'] ) {
						$result            = $this->process_section_field_on_checkout( $val, 'temp' );
						$fbnd_uploads_path = array_merge( $fbnd_uploads_path, $result['paths'] );
						$item->add_meta_data( $val['name'], $result['value'] );
					} else {
						$item->add_meta_data( $val['name'], $val['value'] );
					}
				}

				// Add Upload Paths to Item Meta.
				if ( ! empty( $fbnd_uploads_path ) ) {
					$item->add_meta_data( '_fbnd_option_uploads_path', $fbnd_uploads_path );
				}
			}

			$item->save();
		}

		if ( ! empty( $data ) ) {
			$order->save();
			foreach ( $data as $campaign_id ) {
				do_action( 'fbnd_update_stats_table_data', $campaign_id, 'order_count', '' );
				// do_action( 'fbnd_update_stats_table_data', $campaign_id, 'sales', $order->get_total() );.
			}
		}
	}

	/**
	 * Move the personalizer mockup file for one lifecycle stage and return its
	 * new URL — the raw URL, not `process_upload_field_on_checkout`'s wrapped
	 * "<a>filename</a>" HTML, since the mockup renders as a thumbnail instead
	 * (render_personalizer_mockup_html), built by the two call sites above from
	 * this URL.
	 *
	 * @param array  $val        The extra_data entry built by
	 *                           CartPage::build_personalizer_mockup_extra_data_entry.
	 * @param string $move_stage File move stage: 'temp' or 'order_placed'.
	 * @return string The moved file's URL, or '' if nothing moved.
	 */
	private function move_personalizer_mockup_file( array $val, string $move_stage ): string {
		$path = $val['fbnd_additional']['field_raw']['value'][0]['path'] ?? '';
		if ( ! $path ) {
			return '';
		}
		$moved = fast_bundle()->fbnd_move_uploadblock_files( array( $path ), $move_stage, 'order_placed' === $move_stage );
		return $moved[0]['url'] ?? '';
	}

	/**
	 * Move upload field files and build their display HTML.
	 *
	 * @param array  $val        The extra_data entry for an upload field.
	 * @param string $move_stage File move stage: 'temp' or 'order_placed'.
	 * @return array { value: string, paths: string[] }
	 */
	private function process_upload_field_on_checkout( array $val, string $move_stage, bool $add_price = true ): array {
		$is_order_placed = 'order_placed' === $move_stage;
		$changed_value   = $val['value'];
		$collected_paths = array();

		if ( isset( $val['fbnd_additional']['field_raw'] ) ) {
			$field = $val['fbnd_additional']['field_raw'];
			$res   = '';
			if ( ! empty( $field['value'] ) && is_array( $field['value'] ) ) {
				$res = '<span>';
				foreach ( $field['value'] as $fbnd_item ) {
					$changed_path = $fbnd_item['path'];
					$changed_name = $fbnd_item['name'];
					$moved_data   = fast_bundle()->fbnd_move_uploadblock_files( array( $fbnd_item['path'] ), $move_stage, $is_order_placed );
					if ( ! empty( $moved_data[0]['updated_src'] ) ) {
						$changed_path = $moved_data[0]['updated_src']['curr_src'];
						$changed_name = $moved_data[0]['updated_src']['curr_name'];
						if ( ! $is_order_placed ) {
							$collected_paths[] = $changed_path;
						}
					}
					$res .= \wp_kses( '<a href="' . \esc_url( $changed_path ) . '">' . \esc_html( $changed_name ) . '</a>&nbsp;&nbsp;', \apply_filters( 'fbnd_allowed_html_tags', array() ) );// phpcs:ignore
				}
				$res .= '</span>';
			}
			$price_html    = $add_price && isset( $val['fbnd_additional']['opt_price_with_html'] ) ? $val['fbnd_additional']['opt_price_with_html'] : '';
			$changed_value = $res . $price_html;
		}

		return array(
			'value' => $changed_value,
			'paths' => $collected_paths,
		);
	}

	/**
	 * Process upload fields nested inside a section/repeater entry.
	 *
	 * @param array  $val        The extra_data entry for a section field.
	 * @param string $move_stage File move stage: 'temp' or 'order_placed'.
	 * @return array { value: string, paths: string[] }
	 */
	private function process_section_field_on_checkout( array $val, string $move_stage ): array {
		$collected_paths = array();
		$changed_value   = $val['value'];

		$extra_data = isset( $val['fbnd_additional']['field_raw']['extra_data'] )
			? $val['fbnd_additional']['field_raw']['extra_data']
			: array();

		if ( empty( $extra_data ) ) {
			return array( 'value' => $changed_value, 'paths' => $collected_paths );
		}

		$has_upload = false;
		foreach ( $extra_data as $entry ) {
			if ( isset( $entry['fbnd_additional']['type'] ) && 'upload' === $entry['fbnd_additional']['type'] ) {
				$has_upload = true;
				break;
			}
		}

		if ( ! $has_upload ) {
			return array( 'value' => $changed_value, 'paths' => $collected_paths );
		}

		$parts = array();
		foreach ( $extra_data as $entry ) {
			$fbnd_additional = isset( $entry['fbnd_additional'] ) && is_array( $entry['fbnd_additional'] ) ? $entry['fbnd_additional'] : array();
			$entry_name      = isset( $entry['name'] ) ? $entry['name'] : '';
			$entry_type      = isset( $fbnd_additional['type'] ) ? $fbnd_additional['type'] : '';

			if ( 'upload' === $entry_type ) {
				$result          = $this->process_upload_field_on_checkout( $entry, $move_stage, false );
				$collected_paths = array_merge( $collected_paths, $result['paths'] );
				$entry_value     = $result['value'];
			} elseif ( 'custom_formula' === $entry_type || 'advanced_formula' === $entry_type ) {
				$entry_value = isset( $fbnd_additional['opt_price_with_html'] ) ? $fbnd_additional['opt_price_with_html'] : '';
			} else {
				$entry_value = isset( $entry['value'] ) ? $entry['value'] : '';
			}

			if ( '' !== $entry_name && '' !== $entry_value ) {
				$parts[] = $entry_name . ': ' . $entry_value;
			}
		}

		$price_html    = isset( $val['fbnd_additional']['opt_price_with_html'] ) ? $val['fbnd_additional']['opt_price_with_html'] : '';
		$changed_value = implode( ', ', $parts ) . ' ' . $price_html;

		return array(
			'value' => $changed_value,
			'paths' => $collected_paths,
		);
	}
}
