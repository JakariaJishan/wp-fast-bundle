<?php	// phpcs:ignore
/**
 * CartPage.
 *
 * @package FBND
 * @since v.1.0.0
 */
namespace FBND\Includes\Order;

use FBND\Includes\Compatibility\BaseCurrency;
use FBND\Includes\Order\PriceHandler;
use FBND\Includes\Services\Product_Blocks_Service;
use FBND\Includes\Xpo;

defined( 'ABSPATH' ) || exit;

/**
 * CartPage class.
 */
class CartPage {
	/**
	 * Cart item data key AND order item meta key for the Live Personalizer
	 * mockup, and the label shown in the cart/checkout item-data row and on
	 * the order (both admin and customer-facing — see
	 * build_personalizer_mockup_extra_data_entry's note on why it is not
	 * underscore-prefixed). Referenced from CheckoutPage too.
	 */
	const PERSONALIZER_MOCKUP_META_KEY = 'Personalized Preview';

	/**
	 * Product blocks service
	 *
	 * @var Product_Blocks_Service
	 */
	private Product_Blocks_Service $blocks_service;

	/**
	 * Price handler
	 *
	 * @var PriceHandler
	 */
	private PriceHandler $price_handler;

	/**
	 * Constructor
	 */
	public function __construct() {
		$this->blocks_service = new Product_Blocks_Service();
		$this->price_handler  = new PriceHandler();
		add_filter( 'woocommerce_add_cart_item_data', array( $this, 'save_custom_meta_to_cart' ), 10, 4 );
		add_filter( 'woocommerce_get_item_data', array( $this, 'display_custom_meta_in_cart' ), 10, 2 );
		// add_action( 'woocommerce_add_order_item_meta', array( $this, 'save_custom_meta_to_order' ), 10, 2 );.
		add_action( 'woocommerce_before_calculate_totals', array( $this, 'woocommerce_before_calculate_totals' ), 999999, 1 );
		add_action( 'woocommerce_add_to_cart', array( $this, 'fbnd_add_option_product_to_cart' ), 10, 6 );

		add_action( 'woocommerce_before_mini_cart', array( $this, 'fbnd_mini_cart_calculation' ), 1 );
		add_filter( 'woocommerce_add_to_cart_validation', array( $this, 'fbnd_validate_before_add_to_cart' ), 10, 2 );
		add_action(
			'woocommerce_before_mini_cart_contents',
			array( $this, 'fbnd_before_mini_cart_contents' ),
			99999,
			3
		);
	}

	/**
	 * Recalculates the WooCommerce cart totals for AJAX requests
	 * when not on the Cart or Checkout pages.
	 *
	 * This ensures that mini cart totals are accurate after
	 * cart updates made via AJAX (e.g., quantity changes or item removal).
	 *
	 * @since 1.0.6
	 * @return void
	 */
	public function fbnd_mini_cart_calculation() {
		if ( is_cart() || is_checkout() || ! wp_doing_ajax() ) {
			return;
		}
		WC()->cart->calculate_totals();
	}

	public function fbnd_before_mini_cart_contents() {
		if ( is_cart() || is_checkout() || ! wp_doing_ajax() ) {
			return;
		}

		WC()->cart->calculate_totals();
	}

	/**
	 * Handles additional logic when a product is added to the WooCommerce cart.
	 *
	 * This function is triggered after a product is successfully added to the cart. It can be used to
	 * perform follow-up actions such as logging, adding related products, modifying session data,
	 * or handling custom cart behavior based on metadata passed during the add-to-cart process.
	 *
	 * @param string $cart_item_key   Unique key for the added cart item.
	 * @param int    $product_id      ID of the product being added to the cart.
	 * @param int    $quantity        Quantity of the product being added.
	 * @param int    $variation_id    ID of the variation (if applicable).
	 * @param array  $variation       Array of variation attributes for the product.
	 * @param array  $cart_item_data  Additional data passed during the add-to-cart process.
	 */
	public function fbnd_add_option_product_to_cart( $cart_item_key, $product_id, $quantity, $variation_id, $variation, $cart_item_data ) {
		$fbnd_products_selection = isset( $cart_item_data['fbnd_products_selection'] ) ? $cart_item_data['fbnd_products_selection'] : array();
		if ( is_array( $fbnd_products_selection ) ) {
			foreach ( $fbnd_products_selection as $item ) {
				$_id    = isset( $item['id'] ) ? (int) $item['id'] : '';
				$_count = isset( $item['count'] ) ? (int) $item['count'] : 1;
				if ( $_id ) {
					WC()->cart->add_to_cart( $_id, $_count );
				}
			}
		}
	}

	/**
	 * Update Cart Item Price
	 *
	 *  @param object $cart cart Object.
	 * @return void
	 */
	public function woocommerce_before_calculate_totals( $cart ) {

		if ( is_admin() && ! wp_doing_ajax() ) {
			return;
		}

		// NOTE: Compatibilit issue with 'Tiered Pricing Table for WooCommerce' plugin. As this hook recalculating cart totals in mini cart, this condition is restricting recalculating the price.
		// if ( did_action( 'woocommerce_before_calculate_totals' ) > 1 ) {
		// 	return;
		// }

		foreach ( $cart->get_cart() as $cart_item ) {
			if ( ! empty( $cart_item['fbnd_selection']['price'] ) ) {

				$product       = $cart_item['data'];
				$option_price  = floatval( $cart_item['fbnd_selection']['price'] );
				$product_price = apply_filters(
					'fbnd_cart_checkout_page_price',
					! empty( $cart_item['variation_id'] ) ? $cart_item['variation_id'] : $cart_item['product_id']
				);

				$data = $this->price_handler->calculate_option_price( $cart_item['fbnd_selection_raw'], $cart_item['product_id'], $cart_item['fbnd_option_published_ids'], $cart_item['variation_id'], $cart_item['quantity'] );
				if ( isset( $data['price'] ) ) {
					$option_price = floatval( $data['price'] );
				}

				// Support for Bookings and Appointments For WooCommerce Premium by PluginHive.
				if ( ! empty( $cart_item['phive_booked_price'] ) ) {
					$product_price = $cart_item['phive_booked_price'];
				}

				// Support for Fancy Product Designer plugin.
				if ( class_exists( 'Fancy_Product_Designer' ) && isset( $cart_item['fpd_data']['fpd_product_price'] ) ) {
					$product_price = $cart_item['fpd_data']['fpd_product_price'];
				}

				// Support for YayPricing Dynamic Pricing & Discounts.
				if ( function_exists( 'YAYDP\\load_plugin' ) && ! empty( $cart_item['yaydp_custom_data']['price'] ) && ! empty( $cart_item['modifiers'] ) ) {
					$product_price = $cart_item['yaydp_custom_data']['price'];
				}

				if ( function_exists( 'tpt_initFreemius' ) ) {
					$pricing_rule = \TierPricingTable\PriceManager::getPricingRule( $cart_item['data']->get_id() );
					if ( $pricing_rule ) {
						$new_price = $pricing_rule->getTierPrice( $cart_item['quantity'], false, 'cart' );
						if ( false !== $new_price ) {
							$product_price = $new_price;
						}
					}
				}

				$option_price = $option_price + floatval( $product_price );

				if ( ( function_exists( 'wcml_is_multi_currency_on' ) && wcml_is_multi_currency_on() ) || class_exists( 'WC_Product_Price_Based_Country' ) || class_exists( 'WC_Aelia_CurrencySwitcher' ) ) {
					$option_price = BaseCurrency::convert( $option_price );
				}

				$product->set_price( $option_price );
			}
		}
	}

	/**
	 * Save Option Meta to cart Data
	 *
	 *  @param object $cart_item_data cart Object.
	 *  @param string $product_id ID of product.
	 *  @param string $variation_id variation ID of product.
	 *
	 * @return object
	 */
	public function save_custom_meta_to_cart( $cart_item_data, $product_id, $variation_id ) {
		$fbnd_selection = isset( $_POST['fbnd_selection'] ) ? fast_bundle()->sanitize_rest_params( $_POST['fbnd_selection'] ) : ''; //phpcs:ignore
		$option_ids     = isset( $_POST['fbnd_option_published_ids'] ) ? fast_bundle()->sanitize_rest_params( json_decode( wp_unslash( $_POST['fbnd_option_published_ids'] ), true ) ) : array();//phpcs:ignore
		$fbnd_products_selection = isset( $_POST['fbnd_products_selection'] ) ? fast_bundle()->sanitize_rest_params( $_POST['fbnd_products_selection'] ) : ''; // phpcs:ignore
		$fbnd_products_selection = json_decode( fast_bundle()->safe_stripslashes( $fbnd_products_selection ), true );
		$personalizer_mockup     = isset( $_POST['fbnd_personalizer_mockup'] ) ? $this->sanitize_personalizer_mockup_url( wp_unslash( $_POST['fbnd_personalizer_mockup'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized

		$_POST['fbnd_selection']            = '';
		$_POST['fbnd_option_published_ids'] = '';
		$_POST['fbnd_products_selection']   = '';
		$_POST['fbnd_personalizer_mockup']  = '';

		if ( ! empty( $option_ids ) ) {
			foreach ( $option_ids as $id ) {
				do_action( 'fbnd_update_stats_table_data', $id, 'add_to_cart_count', '' );
			}
		}
		if ( ! empty( $fbnd_selection ) ) {
			$data = $this->price_handler->calculate_option_price( $fbnd_selection, $product_id, $option_ids, ! empty( $variation_id ) ? $variation_id : '', isset( $_POST['quantity'] ) ? absint( wp_unslash( $_POST['quantity'] ) ) : 1 ); // phpcs:ignore WordPress.Security.NonceVerification

			if ( $personalizer_mockup ) {
				$data['extra_data'][] = $this->build_personalizer_mockup_extra_data_entry( $personalizer_mockup );
			}

			$cart_item_data['fbnd_selection']            = $data; // This will be used in checkout order create and others order area
			$cart_item_data['fbnd_products_selection']   = $fbnd_products_selection;
			$cart_item_data['fbnd_selection_base_price'] = apply_filters(
				'fbnd_cart_checkout_page_price',
				! empty( $variation_id ) ? $variation_id : $product_id
			);
			$cart_item_data['fbnd_selection_raw']        = $fbnd_selection;
			$cart_item_data['fbnd_option_published_ids'] = $option_ids;
		}
		if ( $personalizer_mockup ) {
			// Kept alongside fbnd_selection.extra_data (not instead of): the cart/checkout
			// item-data row (display_custom_meta_in_cart) reads this directly, while
			// checkout order creation reads the extra_data entry above to move the file
			// through the same temp → order_placed → order_completed lifecycle as an
			// `upload` field (process_upload_field_on_checkout / fbnd_move_uploadblock_files).
			$cart_item_data['fbnd_personalizer_mockup'] = $personalizer_mockup;
		}
		return $cart_item_data;
	}

	/**
	 * A synthetic `extra_data` entry for the personalizer mockup, shaped exactly
	 * like an `upload` field's entry so process_upload_field_on_checkout (and the
	 * order-completed promotion in CheckoutPage::fbnd_woocommerce_order_status_completed)
	 * handle it with no code of their own — same temp file move, same
	 * `<a href="...">name</a>` value it already knows how to build.
	 *
	 * @param string $mockup_url Mockup file URL (already validated to be under
	 *                           our own fbnd_option_files/temp).
	 * @return array `extra_data` entry.
	 */
	private function build_personalizer_mockup_extra_data_entry( $mockup_url ) {
		$name = basename( wp_parse_url( $mockup_url, PHP_URL_PATH ) );
		return array(
			// Deliberately NOT underscore-prefixed: WooCommerce's customer-facing meta
			// display (order-details page, order emails, thank-you page — all call
			// WC_Order_Item::get_formatted_meta_data() with its default '_' hideprefix)
			// hides any meta key starting with "_", and this row is meant to be seen —
			// same as every other addon meta row, which are already plain field labels.
			// The admin edit-order screen shows both (get_all_formatted_meta_data('')).
			'name'            => self::PERSONALIZER_MOCKUP_META_KEY,
			'value'           => '',
			'fbnd_additional' => array(
				'type'      => 'upload',
				'field_raw' => array(
					'value' => array(
						array(
							'path' => $mockup_url,
							'name' => $name,
						),
					),
				),
			),
		);
	}

	/**
	 * Validate a shopper-supplied personalizer mockup URL.
	 *
	 * Only ever trust a URL our own upload endpoint just produced — one that
	 * points inside `fbnd_option_files/temp` on this site — never an
	 * arbitrary client-supplied URL, since this value ends up rendered as an
	 * <img src> in the cart, checkout, and admin order screen.
	 *
	 * @param string $url Raw `fbnd_personalizer_mockup` POST value.
	 * @return string The URL if valid, or ''.
	 */
	private function sanitize_personalizer_mockup_url( $url ) {
		$url = esc_url_raw( $url );
		if ( ! $url ) {
			return '';
		}
		$upload_dir = wp_upload_dir();
		$prefix     = trailingslashit( $upload_dir['baseurl'] ) . 'fbnd_option_files/temp/';
		if ( 0 !== strpos( $url, $prefix ) ) {
			return '';
		}
		return $url;
	}

	/**
	 * Display Option Meta in cart Data
	 *
	 *  @param array  $item_data Item Object.
	 *  @param object $cart_item Cart Object .
	 *
	 * @return object
	 */
	public function display_custom_meta_in_cart( $item_data, $cart_item ) {
		if ( ( is_cart() && Xpo::get_fbnd_settings_item( 'hideFieldsInCart', false ) ) ||
		( is_checkout() && Xpo::get_fbnd_settings_item( 'hideFieldsInCheckout', false ) ) ) {
			return $item_data;
		}

		// approach 1.
		if ( isset( $cart_item['fbnd_selection_raw'] ) ) {
			$data = $this->price_handler->calculate_option_price( $cart_item['fbnd_selection_raw'], $cart_item['product_id'], $cart_item['fbnd_option_published_ids'], $cart_item['variation_id'], $cart_item['quantity'] );
			// if ( $_GET['hello'] === 'yes') {
			// 	echo "<pre>";
			// 	echo "result==================<br>";
			// 	print_r($data);
			// 	echo "<br>result end==================<br>";
			// 	echo "</pre>";
			// }
			if ( isset( $data['extra_data'] ) ) {
				fast_bundle()->enqueue_style( 'fbnd-cart-style', 'wowcart' );

				$cart_asset = fast_bundle()->get_script_asset( 'assets/js/wowcart.js' );
				wp_enqueue_script( 'fbnd-cart-script', FBND_URL . 'assets/js/wowcart.js', $cart_asset['dependencies'], $cart_asset['version'], true );
				wp_set_script_translations( 'fbnd-cart-script', 'fast-bundle', FBND_PATH . 'languages/' );

				$addon_data = $data['extra_data'] ?? array();

				foreach ( $addon_data as $key => $item ) {
					if ( is_array( $item ) && isset( $item['fbnd_additional'] ) ) {
						unset( $addon_data[ $key ]['fbnd_additional'] );
					}
				}

				$item_data = array_merge( $item_data, $addon_data );
			}
		}

		if ( ! empty( $cart_item['fbnd_personalizer_mockup'] ) ) {
			$item_data[] = array(
				'name'    => self::PERSONALIZER_MOCKUP_META_KEY,
				'value'   => $cart_item['fbnd_personalizer_mockup'],
				'display' => fast_bundle()->render_personalizer_mockup_html( $cart_item['fbnd_personalizer_mockup'] ),
			);
		}

		/*
		$fbnd_products_selection = $cart_item['fbnd_products_selection'];
		if ( is_array( $fbnd_products_selection ) ) {
		foreach ( $fbnd_products_selection as $item ) {
			$_id    = isset( $item['id'] ) ? (int) $item['id'] : '';
			$_count = isset( $item['count'] ) ? (int) $item['count'] : 1;
			if ( $_id ) {
				WC()->cart->add_to_cart( $_id, $_count );
			}
		}
		}

		if ( isset( $cart_item['fbnd_selection']['extra_data'] ) ) {
		wp_enqueue_style( 'fbnd-cart-style', FBND_URL . 'assets/css/wowcart.css', array(), FBND_VER );
		wp_enqueue_script( 'fbnd-cart-script', FBND_URL . 'assets/js/wowcart.js', array( 'jquery' ), FBND_VER, true );
		$item_data = array_merge( $item_data, $cart_item['fbnd_selection']['extra_data'] );
		}
		*/
		return $item_data;
	}

	/**
	 * Display Option Meta in cart Data
	 *
	 *  @param string $item_id ID of item.
	 *  @param array  $values selected.
	 *
	 * @return void
	 */
	public function save_custom_meta_to_order( $item_id, $values ) {

		if ( isset( $values['fbnd_selection']['extra_data'] ) ) {
			foreach ( $values['fbnd_selection']['extra_data'] as $val ) {
				wc_add_order_item_meta( $item_id, $val['name'], $val['value'] );
			}
		}
	}

	/**
	 * Validates required fields before adding product to cart.
	 *
	 * @param bool $passed Whether validation passed.
	 * @param int  $product_id The product ID.
	 * @return bool The validation result.
	 */
	public function fbnd_validate_before_add_to_cart( $passed, $product_id ) {

		$blocks_data = $this->blocks_service->get_product_blocks( $product_id );
		if ( empty( $blocks_data['published_ids'] ) ) {
			return $passed;
		}

		$required_fields = $this->collect_required_fields( $blocks_data );

		if ( empty( $required_fields ) ) {
			return $passed;
		}

		$fbnd_selection = $this->parse_fbnd_selection();

		$validate = $this->validate_required_fields( $required_fields, $fbnd_selection, $passed );

		if ( ! $validate ) {
			wc_add_notice( __( 'Please fill in all required fields.', 'fast-bundle' ), 'error' );
		}

		return $validate;
	}

	/**
	 * Collects required fields from blocks data.
	 *
	 * @param array $blocks_data The blocks data array.
	 * @return array An array of required fields.
	 */
	private function collect_required_fields( $blocks_data ) {
		$published_ids = $blocks_data['published_ids'] ?? array();

		$db_ids    = array();
		$block_ids = array();

		foreach ( $published_ids as $option_id ) {
			$meta = get_post_meta( $option_id, 'fbnd_required_options', true );
			if ( ! is_array( $meta ) ) {
				$block_ids[] = $option_id;
			} elseif ( ! empty( $meta ) ) {
				$db_ids[ $option_id ] = $meta;
			}
		}

		$required = array();

		if ( ! empty( $db_ids ) ) {
			$required = array_merge(
				$required,
				$this->collect_required_fields_from_db_meta( $db_ids )
			);
		}

		if ( ! empty( $block_ids ) ) {
			$filtered_blocks = $this->filter_blocks_by_ids( $blocks_data['blocks'] ?? array(), $block_ids );
			$required        = array_merge(
				$required,
				$this->collect_required_fields_from_blocks( $filtered_blocks )
			);
		}

		return $required;
	}

	/**
	 * Collects required fields from database.
	 *
	 * @param array $db_ids_with_meta The database IDs with their associated meta.
	 * @return array An array of required fields.
	 */
	private function collect_required_fields_from_db_meta( $db_ids_with_meta ) {
		$required = array();

		foreach ( $db_ids_with_meta as $option_id => $meta ) {
			foreach ( $meta as $field ) {
				$block_id   = array_key_first( $field );
				$required[] = array(
					'block_id' => $block_id,
					'type'     => $field[ $block_id ]['type'] ?? 'field',
				);
			}
		}
		return $required;
	}

	/**
	 * Filters a blocks array to only include entries whose keys are in the given ID list.
	 *
	 * @param array $all_blocks Associative array of blocks keyed by option/addon ID.
	 * @param array $block_ids  List of option IDs to keep.
	 * @return array Filtered blocks array.
	 */
	private function filter_blocks_by_ids( $all_blocks, $block_ids ) {
		$id_set = array_flip( $block_ids );

		return array_filter(
			$all_blocks,
			function ( $key ) use ( $id_set ) {
				return isset( $id_set[ $key ] );
			},
			ARRAY_FILTER_USE_KEY
		);
	}

	/**
	 * Collects required fields from blocks.
	 *
	 * @param array $blocks The blocks array.
	 * @return array An array of required fields.
	 */
	private function collect_required_fields_from_blocks( $blocks ) {
		$required = array();

		foreach ( $blocks as $blocklist ) {
			foreach ( $blocklist as $block ) {
				$required = array_merge( $required, $this->get_required_blocks( $block ) );
			}
		}

		return $required;
	}

	/**
	 * Parses the fbnd_selection field from the POST request.
	 *
	 * Decodes the JSON string sent by the frontend into an associative array.
	 * Returns an empty array when the field is absent or the JSON is invalid.
	 *
	 * @return array Decoded selection data, or an empty array on failure.
	 */
	private function parse_fbnd_selection() {
		$raw = isset( $_POST['fbnd_selection'] ) ? fast_bundle()->sanitize_rest_params( $_POST['fbnd_selection'] ) : ''; //phpcs:ignore
		$decoded = json_decode( fast_bundle()->safe_stripslashes( $raw ), true );
		return is_array( $decoded ) && ! empty( $decoded ) ? $decoded : array();
	}

	/**
	 * Validates required fields.
	 *
	 * @param array $required_fields The array of required fields.
	 * @param array $fbnd_selection The selected product addons.
	 * @param bool  $passed Whether validation has passed so far.
	 * @return bool True if all required fields are filled, false otherwise.
	 */
	private function validate_required_fields( $required_fields, $fbnd_selection, $passed ) {
		if ( empty( $fbnd_selection ) ) {
			return false;
		}

		$submitted_ids = array_keys( $fbnd_selection );

		foreach ( $fbnd_selection as $value ) {
			if ( ! isset( $value['repeatedValues'] ) || ! is_array( $value['repeatedValues'] ) ) {
				continue;
			}
			foreach ( $value['repeatedValues'] as $instance ) {
				if ( ! isset( $instance['selectedFields'] ) || ! is_array( $instance['selectedFields'] ) ) {
					continue;
				}
				foreach ( array_keys( $instance['selectedFields'] ) as $field_id ) {
					$submitted_ids[] = $field_id;
				}
			}
		}

		$submitted_ids = array_unique( $submitted_ids );

		foreach ( $required_fields as $field ) {
			if ( ! in_array( $field['block_id'], $submitted_ids, true ) ) {
				return false;
			}
		}

		return $passed;
	}

	/**
	 * Gets required blocks from a block configuration.
	 *
	 * @param array $block The block configuration array.
	 * @return array An array of required blocks.
	 */
	private function get_required_blocks( $block ) {
		$required = array();

		if ( $block['en_logic'] ?? false ) {
			return $required;
		} elseif ( ! empty( $block['innerBlocks'] ) && is_array( $block['innerBlocks'] ) ) {
			foreach ( $block['innerBlocks'] as $inner_block ) {
				$required = array_merge(
					$required,
					$this->get_required_blocks( $inner_block )
				);
			}
		} elseif ( isset( $block['required'] ) && true === $block['required'] ) {
			$required[] = array(
				'block_id' => $block['blockid'] ?? '',
				'type'     => $block['type'] ?? 'field',
			);
		}

		return $required;
	}
}
