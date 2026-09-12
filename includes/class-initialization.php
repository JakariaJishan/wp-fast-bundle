<?php // phpcs:ignore
/**
 * Initialization Action.
 *
 * @package FBND
 * @since 1.0.0
 */
namespace FBND\Includes;

use FBND\Includes\Admin\Notice;
use FBND\Includes\Admin\Options;
use FBND\Includes\Admin\OurPlugins;
use FBND\Includes\Common\Hooks;
use FBND\Includes\Order\Buy_X_Get_Y_Cart;
use FBND\Includes\Order\CheckoutPage;
use FBND\Includes\Order\Fixed_Bundle_Cart;
use FBND\Includes\Order\Grouped_Offer_Cart;
use FBND\Includes\Restapi\RequestApi;

use FBND\Includes\Cron\Cleanup;

defined( 'ABSPATH' ) || exit;

/**
 * Initialization class.
 */
class Initialization {

	/**
	 * Setup class.
	 *
	 * @since v.1.0.0
	 */
	public function __construct() {
		$this->requires();
		add_action( 'admin_enqueue_scripts', array( $this, 'admin_scripts_callback' ) );
		add_action( 'activated_plugin', array( $this, 'activation_redirect' ) );
	}

	/**
	 * Necessary Requires Class
	 *
	 * @since v.1.0.0
	 * @return void
	 */
	public function requires() {

		new Deactive();
		new PostType();
		new Analytics();
		new Xpo();

		new Options();
		new Notice();

		new OurPlugins();

		new CheckoutPage();

		$grouped_offer_cart = new Grouped_Offer_Cart();
		new Fixed_Bundle_Cart( $grouped_offer_cart );
		new Buy_X_Get_Y_Cart( $grouped_offer_cart );

		new Hooks();
		new RequestApi();

		new Cleanup();
	}


	/**
	 * Only Backend CSS and JS Scripts
	 *
	 * @since v.1.0.0
	 * @return void
	 */
	public function admin_scripts_callback() {
		global $pagenow;
		$page = isset( $_GET['page'] ) ? sanitize_text_field( wp_unslash( $_GET['page'] ) ) : ''; //phpcs:ignore

		fast_bundle()->enqueue_style( 'fbnd-admin-style', 'fbnd-admin' );
		fast_bundle()->enqueue_script( 'fbnd-admin-script', 'fbnd-admin' );

		if ( 'admin.php' === $pagenow ) {
			wp_localize_script(
				'fbnd-admin-script',
				'fbnd_admin',
				array()
			);
			if ( 'fbnd-dashboard' === $page ) {
				$user_info = get_userdata( get_current_user_id() );

				// Styles.
				fast_bundle()->enqueue_style( 'fbnd-editor-css', 'fastbundle' );
				fast_bundle()->enqueue_style( 'fbnd-editor-css2', 'style-fastbundle' );
				fast_bundle()->enqueue_style( 'fbnd-block-css', 'fastbundle-blocks' );

				// Scripts.
				fast_bundle()->enqueue_script( 'fbnd-editor-script', 'fastbundle' );
				fast_bundle()->enqueue_script( 'fbnd-date-script', 'wowdate-min' );

				wp_enqueue_media();
				wp_localize_script(
					'fbnd-editor-script',
					'fbndBackendData',
					array_merge(
						array(
							'url'             => FBND_URL,
							'db_url'          => admin_url( 'admin.php?page=fbnd-dashboard#' ),
							'ajax'            => admin_url( 'admin-ajax.php' ),
							'version'         => FBND_VER,
							'isActive'        => fast_bundle()->is_lc_active(),
							'isExpired'       => Xpo::is_lc_expired(),
							'license'         => get_option( 'edd_fbnd_license_key' ),
							'nonce'           => wp_create_nonce( 'fbnd-nonce' ),
							'decimal_sep'     => get_option( 'woocommerce_price_decimal_sep', '.' ),
							'num_decimals'    => get_option( 'woocommerce_price_num_decimals', '2' ),
							'currency_pos'    => get_option( 'woocommerce_currency_pos', 'left' ),
							'currencySymbol'  => function_exists( 'get_woocommerce_currency_symbol' ) ? get_woocommerce_currency_symbol() : '$',
							'characterText'   => Xpo::get_fbnd_settings_item( 'characterText', 'Character' ),
							'wordText'        => Xpo::get_fbnd_settings_item( 'wordText', 'Word' ),
							'userInfo'        => array(
								'name'  => $user_info->first_name ? $user_info->first_name . ( $user_info->last_name ? ' ' . $user_info->last_name : '' ) : $user_info->user_login,
								'email' => $user_info->user_email,
							),
							'isFreshInstall'  => self::is_fresh_install(),
							'helloBar'        => Notice::get_hellobar_config(),
							'uploadFileTypes' => fast_bundle()->fbnd_get_upload_allowed_file_types(),
							'fbndAttributes'  => fast_bundle()->fbnd_get_attributes(),
							'date_format'     => get_option( 'date_format' ),
						),
						Xpo::get_wow_products_details()
					)
				);
				wp_set_script_translations( 'fbnd-editor-script', 'fast-bundle', FBND_PATH . 'languages/' );
			}
		}

		if ( in_array( $pagenow, array( 'post.php', 'post-new.php' ), true ) && 'product' === get_post_type() ) {
			fast_bundle()->enqueue_style( 'fbnd-product-edit-style', 'style-fbnd-product-edit' );
			fast_bundle()->enqueue_script( 'fbnd-product-edit-script', 'fbnd-product-edit' );

			wp_localize_script(
				'fbnd-product-edit-script',
				'fbndBackendData',
				array(
					'url'        => FBND_URL,
					'db_url'     => admin_url( 'admin.php?page=fbnd-dashboard#' ),
					'ajax'       => admin_url( 'admin-ajax.php' ),
					'version'    => FBND_VER,
					'nonce'      => wp_create_nonce( 'fbnd-nonce' ),
					'product_id' => get_the_ID(),
				)
			);
		}
	}

	/**
	 * Check if the user has never created an option list.
	 *
	 * Used to show the onboarding get-started screen and trimmed
	 * header on the dashboard for brand-new users.
	 *
	 * @since v.1.6.17
	 *
	 * @return bool
	 */
	public static function is_fresh_install() {
		if ( 'yes' === get_option( 'fbnd_first_option_created', '' ) ) {
			return false;
		}

		$existing = get_posts(
			array(
				'post_type'      => 'fbnd_option',
				'post_status'    => 'any',
				'posts_per_page' => 1,
				'fields'         => 'ids',
			)
		);

		if ( ! empty( $existing ) ) {
			// Existing users from before the flag existed: backfill it.
			update_option( 'fbnd_first_option_created', 'yes' );
			return false;
		}

		return true;
	}

	/**
	 * Redirect After Active Plugin
	 *
	 * @since v.1.0.0
	 *
	 * @param string $plugin Plugin name.
	 *
	 * @return NULL
	 */
	public function activation_redirect( $plugin ) {
		if ( 'fast-bundle/fast-bundle.php' === $plugin ) {
			if ( wp_doing_ajax() || is_network_admin() || isset( $_GET['activate-multi'] ) || isset( $_POST['action'] ) && 'activate-selected' == $_POST['action'] ) { // phpcs:ignore
				return;
			}
			$tab = self::is_fresh_install() ? 'lists' : 'dashboard';
			exit( wp_safe_redirect( admin_url( 'admin.php?page=fbnd-dashboard#' . $tab ) ) ); // phpcs:ignore
		}
	}
}
