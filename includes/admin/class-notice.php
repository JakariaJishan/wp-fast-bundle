<?php //phpcs:ignore
namespace FBND\Includes\Admin;

use FBND\Includes\Admin\Durbin\DurbinClient;
use FBND\Includes\Xpo;

defined( 'ABSPATH' ) || exit;

/**
 * Plugin Notice
 */
class Notice {

	/**
	 * Notice version
	 *
	 * @var string $notice_version
	 */
	private $notice_version = 'v1511';

	/**
	 * Flag to check if notice JS and CSS have been applied
	 *
	 * @var bool $notice_js_css_applied
	 */
	private $notice_js_css_applied = false;
	/**
	 * Constructor for the Notice class.
	 *
	 * Initializes admin notice hooks and REST API routes.
	 */

	/**
	 * Notice Priority
	 *
	 * @var string $plugin_notice_priority
	 */
	private $plugin_notice_priority = 2;

	/**
	 * Notice Priority
	 *
	 * @var string $plugin_notice_priority
	 */
	private $plugin_notice_priority_key = 'wow_addons';

	public function __construct() {
		add_action( 'admin_notices', array( $this, 'admin_notices_callback' ) );
		add_action( 'admin_init', array( $this, 'set_dismiss_notice_callback' ) );

		// REST API routes.
		add_action( 'rest_api_init', array( $this, 'register_rest_route' ) );

		add_filter( 'xpo_active_notice_lists', array( $this, 'handle_xpo_active_notice_lists' ), 99, 1 );
	}

	/**
	 * Registers REST API endpoints.
	 *
	 * @return void
	 */
	public function register_rest_route() {
		$routes = array(
			// Hello Bar.
			array(
				'endpoint'            => 'hello_bar',
				'methods'             => 'POST',
				'callback'            => array( $this, 'hello_bar_callback' ),
				'permission_callback' => function () {
					return current_user_can( Xpo::fbnd_manage_admin_permisson_handler() );
				},
			),
		);

		foreach ( $routes as $route ) {
			register_rest_route(
				'fbnd/v1',
				$route['endpoint'],
				array(
					array(
						'methods'             => $route['methods'],
						'callback'            => $route['callback'],
						'permission_callback' => $route['permission_callback'],
					),
				)
			);
		}
	}

	/**
	 * Handle Plugin Notice for all plugins
	 *
	 * @param array $active_lists Lists of all active plugin notice.
	 * @return array
	 */
	public function handle_xpo_active_notice_lists( $active_lists ) {

		if ( $this->fbnd_dashboard_banner_notice( true ) || $this->fbnd_dashboard_content_notice( true ) || $this->fbnd_dashboard_image_banner_notice( true ) ) {
			$active_lists[ $this->plugin_notice_priority_key ] = $this->plugin_notice_priority;
		}

		return $active_lists;
	}

	/**
	 * Handle Plugin Notice for all plugins
	 *
	 * @return bool
	 */
	public function is_available_for_notice() {
		$active_notices = apply_filters( 'xpo_active_notice_lists', array() );

		if ( empty( $active_notices ) ) {
			return true;
		}

		asort( $active_notices );

		return array_key_first( $active_notices ) === $this->plugin_notice_priority_key;
	}

	/**
	 * Hellobar config
	 *
	 * @return array
	 */
	public static function get_hellobar_config() {
		return array(
			'fbnd_helloBar_summer_sale_2026_vv1'      => Xpo::get_transient_without_cache( 'fbnd_helloBar_summer_sale_2026_vv1' ),
			'fbnd_helloBar_summer_sale_2026_vv1_x1'   => Xpo::get_transient_without_cache( 'fbnd_helloBar_summer_sale_2026_vv1_x1' ),
			'fbnd_helloBar_summer1_flash_sale_2026_2' => Xpo::get_transient_without_cache( 'fbnd_helloBar_summer1_flash_sale_2026_2' ),
		);
	}

	/**
	 * Handles Hello Bar dismissal action via REST API .
	 *
	 * @param \WP_REST_Request $request REST request object .
	 * @return \WP_REST_Response
	 */
	public function hello_bar_callback( \WP_REST_Request $request ) {
		$request_params = $request->get_params();
		$type           = isset( $request_params['type'] ) ? sanitize_text_field( $request_params['type'] ) : '';
		$id             = isset( $request_params['id'] ) ? sanitize_key( $request_params['id'] ) : '';

		if ( 'hello_bar' === $type && ! empty( $id ) ) {
			Xpo::set_transient_without_cache( $id, 'hide', 1296000 );
		}

		return new \WP_REST_Response(
			array(
				'success' => true,
				'message' => __( 'Hello Bar Action performed', 'fast-bundle' ),
			),
			200
		);
	}

	/**
	 * Admin Notices Callback
	 *
	 * @return void
	 */
	public function admin_notices_callback() {
		$this->fbnd_dashboard_notice_callback();
		$this->fbnd_dashboard_durbin_notice_callback();
	}

	/**
	 * Admin Dashboard Notice Callback
	 *
	 * @return void
	 */
	public function fbnd_dashboard_notice_callback() {
		if ( $this->is_available_for_notice() ) {
			$this->fbnd_dashboard_banner_notice();
			$this->fbnd_dashboard_content_notice();
			$this->fbnd_dashboard_image_banner_notice();
		}
	}

	/**
	 * Dashboard Banner Notice
	 *
	 * @return void
	 */
	public function fbnd_dashboard_banner_notice( $return_bool = false ) {
		$fbnd_db_nonce  = wp_create_nonce( 'fbnd-nonce' );
		$banner_notices = array(
			array(
				'key'                => 'fbnd_banner_summer_flash_sale_2026_v1',
				'start'              => '2026-05-18 00:00 Asia/Dhaka',
				'end'                => '2026-05-21 23:59 Asia/Dhaka', // format YY-MM-DD always set time 23:59 and zone Asia/Dhaka.

				'brand_color'        => '#86a62c',

				'left_image'         => FBND_URL . 'assets/img/dashboard_banner/flash_sale/left_image.png',
				'right_image'        => FBND_URL . 'assets/img/dashboard_banner/flash_sale/right_image.png',
				'bg_image'           => FBND_URL . 'assets/img/dashboard_banner/flash_sale/bg.png',
				'text'               => 'Hurry Before It Ends!',
				'countdown_duration' => 259200, // Duration in seconds.
				'countdown_color'    => '#3CF357',
				'url'                => Xpo::generate_utm_link(
					array(
						'utmKey' => 'flash_sale',
					)
				),

				'visibility'         => ! Xpo::is_lc_active(),
			),
			array(
				'key'                => 'fbnd_banner_summer_surprise_sale_2026_v1',
				'start'              => '2026-05-29 00:00 Asia/Dhaka',
				'end'                => '2026-06-01 23:59 Asia/Dhaka', // format YY-MM-DD always set time 23:59 and zone Asia/Dhaka.

				'brand_color'        => '#86a62c',

				'left_image'         => FBND_URL . 'assets/img/dashboard_banner/surprise_sale/left_image.png',
				'right_image'        => FBND_URL . 'assets/img/dashboard_banner/surprise_sale/right_image.png',
				'bg_image'           => FBND_URL . 'assets/img/dashboard_banner/surprise_sale/bg.png',
				'text'               => 'Hurry Before It Ends!',
				'countdown_duration' => 259200, // Duration in seconds.
				'countdown_color'    => '#3CF357',
				'url'                => Xpo::generate_utm_link(
					array(
						'utmKey' => 'surprise_sale',
					)
				),

				'visibility'         => ! Xpo::is_lc_active(),
			),
			array(
				'key'                => 'fbnd_banner_summer_massive_sale_2026_v1',
				'start'              => '2026-06-17 00:00 Asia/Dhaka',
				'end'                => '2026-06-20 23:59 Asia/Dhaka', // format YY-MM-DD always set time 23:59 and zone Asia/Dhaka.

				'brand_color'        => '#86a62c',

				'left_image'         => FBND_URL . 'assets/img/dashboard_banner/massive_sale/left_image.png',
				'right_image'        => FBND_URL . 'assets/img/dashboard_banner/massive_sale/right_image.png',
				'bg_image'           => FBND_URL . 'assets/img/dashboard_banner/massive_sale/bg.png',
				'text'               => 'Hurry Before It Ends!',
				'countdown_duration' => 259200, // Duration in seconds.
				'countdown_color'    => '#3CF357',
				'url'                => Xpo::generate_utm_link(
					array(
						'utmKey' => 'massive_sale',
					)
				),

				'visibility'         => ! Xpo::is_lc_active(),
			),
			array(
				'key'                => 'fbnd_summer_final_hours_sale_2026_v1',
				'start'              => '2026-06-28 00:00 Asia/Dhaka',
				'end'                => '2026-06-30 23:59 Asia/Dhaka', // format YY-MM-DD always set time 23:59 and zone Asia/Dhaka.

				'brand_color'        => '#86a62c',

				'left_image'         => FBND_URL . 'assets/img/dashboard_banner/final_hours_sale/left_image.png',
				'right_image'        => FBND_URL . 'assets/img/dashboard_banner/final_hours_sale/right_image.png',
				'bg_image'           => FBND_URL . 'assets/img/dashboard_banner/final_hours_sale/bg.png',
				'text'               => 'Hurry Before It Ends!',
				'countdown_duration' => 259200, // Duration in seconds.
				'countdown_color'    => '#3CF357',
				'url'                => Xpo::generate_utm_link(
					array(
						'utmKey' => 'final_hour_sale',
					)
				),

				'visibility'         => ! Xpo::is_lc_active(),
			),
		);

		foreach ( $banner_notices as $notice ) {
			$notice_key = isset( $notice['key'] ) ? $notice['key'] : $this->notice_version;
			if ( isset( $_GET['disable_fbnd_notice'] ) && $notice_key === sanitize_text_field(wp_unslash($_GET['disable_fbnd_notice'])) ) { // phpcs:ignore
				continue;
			}

			$current_time = gmdate( 'U' );
			$notice_start = gmdate( 'U', strtotime( $notice['start'] ) );
			$notice_end   = gmdate( 'U', strtotime( $notice['end'] ) );
			if ( $current_time >= $notice_start && $current_time <= $notice_end && $notice['visibility'] ) {

				$notice_transient = Xpo::get_transient_without_cache( 'fbnd_get_pro_notice_' . $notice_key );

				if ( 'off' === $notice_transient ) {
					continue;
				}

				if ( $return_bool ) { // Early return for Other plugin notice.
					return true;
				}

				if ( ! $this->notice_js_css_applied ) {
					$this->fbnd_banner_notice_js();
					$this->notice_js_css_applied = true;
				}
				$query_args = array(
					'disable_fbnd_notice' => $notice_key,
					'fbnd_db_nonce'       => $fbnd_db_nonce,
				);
				if ( isset( $notice['repeat_interval'] ) && $notice['repeat_interval'] ) {
					$query_args['fbnd_interval'] = $notice['repeat_interval'];
				}
				?>
				<style type="text/css">
					.fbnd-notice-wrapper.fbnd-banner-notice {
						height: auto !important;
						padding: 0 !important;
						position: relative;
						box-sizing: border-box;
						background-repeat: no-repeat;
						background-size: cover;
						background-position: center;
					}
					.fbnd-notice-wrapper.fbnd-banner-notice .fbnd-banner-link {
						width: 100%;
						text-decoration: none;
						display: block;
					}
					.fbnd-notice-wrapper.fbnd-banner-notice .fbnd-banner-content {
						display: flex;
						justify-content: space-between;
						align-items: center;
						max-width: 700px;
						margin: 0 auto;
						padding: 10px 16px;
						gap: 16px;
					}
					.fbnd-notice-wrapper.fbnd-banner-notice .fbnd-banner-side-image {
						display: block;
						max-width: 100%;
						height: auto;
						max-height: 32px;
					}
					.fbnd-notice-wrapper.fbnd-banner-notice .fbnd-banner-main .fbnd-banner-main-text {
						color: #ffffff;
					}
					.fbnd-notice-wrapper.fbnd-banner-notice .fbnd-banner-main {
						display: flex;
						flex-direction: column;
						gap: 4px;
						align-items: center;
						justify-content: center;
						font-weight: 700;
						font-size: 18px;
						color: #333333;
						line-height: 1.2;
						text-align: center;
					}

					@media screen and (max-width: 1100px) {
						/* .fbnd-notice-wrapper.fbnd-banner-notice .fbnd-banner-content {
							flex-direction: column;
						} */
						.fbnd-notice-wrapper.fbnd-banner-notice .fbnd-banner-content .fbnd-banner-main-text {
							display: none;
						}
					}
					@media screen and (max-width: 490px) {
						.fbnd-notice-wrapper.fbnd-banner-notice {
							display: none;
						}
					}
					@media screen and (max-width: 782px) {
						.fbnd-notice-wrapper.fbnd-banner-notice .fbnd-banner-content {
							justify-content: center;
							padding: 12px 32px 12px 12px;
						}
						.fbnd-notice-wrapper.fbnd-banner-notice .fbnd-banner-main {
							font-size: 22px;
							line-height: 28px;
						}
					}
					@media screen and (max-width: 480px) {
						.fbnd-notice-wrapper.fbnd-banner-notice .fbnd-banner-content {
							padding: 10px 32px 10px 10px;
						}
						.fbnd-notice-wrapper.fbnd-banner-notice .fbnd-banner-main {
							font-size: 18px;
							line-height: 24px;
						}
					}
				</style>
				<div 
					class="fbnd-notice-wrapper fbnd-banner-notice notice" 
					style="
						border-left: 3px solid <?php echo esc_attr( $notice['brand_color'] ); ?>;
						background-image: url('<?php echo esc_attr( $notice['bg_image'] ); ?>');
				">
					<a 
						class="wc-dismiss-notice dashicons dashicons-no-alt" 
						style="
							position: absolute;
							top: 1px;
							right: 1px;
							border-radius: 50%;
							background-color: black;
							color: white;
							font-size: 14px;
							display: flex;
							align-items: center;
							justify-content: center;
						"
						aria-label="<?php esc_html_e( 'Close Banner', 'fast-bundle' ); ?>"
						href="<?php echo esc_url( add_query_arg( $query_args ) ); ?>">
					</a>

					<a class="fbnd-banner-link" target="_blank" href="<?php echo esc_url( $notice['url'] ); ?>">
						<div class="fbnd-banner-content">
							<img class="fbnd-banner-side-image" loading="lazy" src="<?php echo esc_url( $notice['left_image'] ); ?>" />
							<div class="fbnd-banner-main">
								<span class="fbnd-banner-main-text">
									<?php echo esc_html( $notice['text'] ); ?>
								</span>	
								<div 
									class="fbnd-notice-countdown" 
									style="
										color: <?php echo esc_attr( $notice['countdown_color'] ); ?>;
									"
									data-notice-key="<?php echo esc_attr( $notice_key . '-countdown' ); ?>" 
									data-duration="<?php echo esc_attr( $notice['countdown_duration'] ); ?>">
									00:00:00:00
								</div>
							</div>
							<img class="fbnd-banner-side-image" loading="lazy" src="<?php echo esc_url( $notice['right_image'] ); ?>" />
						</div>
					</a>
				</div>
				
				<?php
			}
		}
	}

	/**
	 * Dashboard Content Notice
	 *
	 * @param boolean $return_bool
	 * @return void
	 */
	public function fbnd_dashboard_content_notice( $return_bool = false ) {

		$content_notices = array(
			array(
				'key'                => 'fbnd_dashboard_content_notice_summer_sale_2026_vv1',
				'start'              => '2026-07-06 00:00 Asia/Dhaka',
				'end'                => '2026-07-12 23:59 Asia/Dhaka',
				'url'                => Xpo::generate_utm_link(
					array(
						'utmKey' => 'summer_db',
					)
				),
				'visibility'         => ! Xpo::is_lc_active(),
				'content_heading'    => __( '', 'fast-bundle' ),
				/* translators: %s: discount percentage */
				'content_subheading' => __( 'FastBundle Summer Sale Offer is Live - Enjoy up to %s on FastBundle Pro.', 'fast-bundle' ),
				'discount_content'   => '  50% OFF',
				'border_color'       => '#86a62c',
				'icon'               => FBND_URL . 'assets/img/dashboard_banner/logo.svg',
				'button_text'        => __( 'Upgrade Now!', 'fast-bundle' ),
				'is_discount_logo'   => true,
			),
			array(
				'key'                => 'fbnd_dashboard_content_notice_summer_sale_2026_vv2_1',
				'start'              => '2026-08-02 00:00 Asia/Dhaka',
				'end'                => '2026-08-08 23:59 Asia/Dhaka',
				'url'                => Xpo::generate_utm_link(
					array(
						'utmKey' => 'summer_db',
					)
				),
				'visibility'         => ! Xpo::is_lc_active(),
				'content_heading'    => __( '', 'fast-bundle' ),
				/* translators: %s: discount percentage */
				'content_subheading' => __( 'FastBundle Summer Sale Offer is Live - Enjoy up to %s on FastBundle Pro.', 'fast-bundle' ),
				'discount_content'   => '  50% OFF',
				'border_color'       => '#86a62c',
				'icon'               => FBND_URL . 'assets/img/dashboard_banner/discount_50.svg',
				'button_text'        => __( 'Upgrade Now!', 'fast-bundle' ),
				'is_discount_logo'   => true,
			),

		);

		$fbnd_db_nonce = wp_create_nonce( 'fbnd-nonce' );

		foreach ( $content_notices as $key => $notice ) {
			$notice_key = isset( $notice['key'] ) ? $notice['key'] : $this->notice_version;
			if (
				isset( $_GET['disable_fbnd_notice'] ) &&
				$notice_key === $_GET['disable_fbnd_notice'] &&
				isset( $_GET['fbnd_db_nonce'] ) &&
				wp_verify_nonce( sanitize_text_field( wp_unslash( $_GET['fbnd_db_nonce'] ) ), 'fbnd-dashboard-nonce' )
			) {
				continue;
			} else {
				$border_color = $notice['border_color'];

				$current_time = gmdate( 'U' );
				$notice_start = gmdate( 'U', strtotime( $notice['start'] ) );
				$notice_end   = gmdate( 'U', strtotime( $notice['end'] ) );
				if ( $current_time >= $notice_start && $current_time <= $notice_end && $notice['visibility'] ) {
					$notice_transient = Xpo::get_transient_without_cache( 'fbnd_get_pro_notice_' . $notice_key );

					if ( 'off' !== $notice_transient ) {

						if ( $return_bool ) { // Early return for Other plugin notice.
							return true;
						}

						$query_args = array(
							'disable_fbnd_notice' => $notice_key,
							'fbnd_db_nonce'       => $fbnd_db_nonce,
						);
						if ( isset( $notice['repeat_interval'] ) && $notice['repeat_interval'] ) {
							$query_args['fbnd_interval'] = $notice['repeat_interval'];
						}

						$url = isset( $notice['url'] ) ? $notice['url'] : Xpo::generate_utm_link(
							array(
								'utmKey' => 'content_notice',
							)
						);

						?>

						<style id="fbnd-notice-css" type="text/css">
							.fbnd-content-notice-wrapper {
								border: 1px solid #c3c4c7;
								border-left: 3px solid #037fff;
								margin: 15px 0 !important;
								display: flex;
								align-items: center;
								background: #ffffff;
								width: 100%;
								padding: 10px 0;
								position: relative;
								box-sizing: border-box;
							}

							.fbnd-content-notice-wrapper.notice {
								margin: 10px 0;
								width: calc(100% - 20px);
							}

							.wrap .fbnd-content-notice-wrapper.notice {
								width: 100%;
							}

							.fbnd-content-notice-icon {
								margin-left: 15px;
							}

							.fbnd-content-notice-discout-icon {
								margin-left: 10px;
							}

							.fbnd-content-notice-icon img {
								max-width: 42px;
								height: 70px;
							}

							.fbnd-content-notice-discout-icon img {
								height: 70px;
								width: 70px;
							}

							.fbnd-notice-content-wrapper {
								display: flex;
								flex-direction: column;
								gap: 8px;
								font-size: 14px;
								line-height: 20px;
								margin-left: 15px;
							}

							.fbnd-content-notice-buttons {
								display: flex;
								align-items: center;
								gap: 15px;
							}

							.fbnd-content-notice-btn {
								font-weight: 600;
								text-transform: uppercase !important;
								padding: 2px 10px !important;
								background-color: #86a62c;
								border: none !important;
							}

							.fbnd-content-discount_btn {
								background-color: #ffffff;
								text-decoration: none;
								border: 1px solid #86a62c;
								padding: 5px 10px;
								border-radius: 5px;
								font-weight: 500;
								text-transform: uppercase;
								color: #86a62c !important;
							}

							.fbnd-content-notice-close {
								position: absolute;
								right: 2px;
								top: 5px;
								text-decoration: none;
								color: #b6b6b6;
								font-family: dashicons;
								font-size: 16px;
								line-height: 20px;
							}

							.fbnd-content-notice-close-icon {
								font-size: 14px;
							}
						</style>
					<div class="fbnd-content-notice-wrapper notice data_collection_notice" 
					style="border-left: 3px solid <?php echo esc_attr( $border_color ); ?>;"
					> 
						<?php
						if ( $notice['is_discount_logo'] ) {
							?>
								<div class="fbnd-content-notice-discout-icon"> <img src="<?php echo esc_url( $notice['icon'] ); ?>"/>  </div>
							<?php
						} else {
							?>
								<div class="fbnd-content-notice-icon"> <img src="<?php echo esc_url( $notice['icon'] ); ?>"/>  </div>
							<?php
						}
						?>
						
						<div class="fbnd-notice-content-wrapper">
							<div class="">
								<strong><?php printf( esc_html( $notice['content_heading'] ) ); ?> </strong>
						<?php
						printf(
							wp_kses_post( $notice['content_subheading'] ),
							'<strong>' . esc_html( $notice['discount_content'] ) . '</strong>'
						);
						?>
							</div>
							<div class="fbnd-content-notice-buttons">
							<?php if ( isset( $notice['is_discount_logo'] ) && $notice['is_discount_logo'] ) : ?>
									<a class="fbnd-content-discount_btn" href="<?php echo esc_url( $url ); ?>" target="_blank">
										<?php echo esc_html( $notice['button_text'] ); ?>
									</a>
								<?php else : ?>
									<a class="fbnd-content-notice-btn button button-primary" href="<?php echo esc_url( $url ); ?>" target="_blank" style="background-color: <?php echo ! empty( $notice['background_color'] ) ? esc_attr( $notice['background_color'] ) : '#86a62c'; ?>;">
									<?php echo esc_html( $notice['button_text'] ); ?>
										
									</a>
								<?php endif; ?>
							</div>
						</div>
						<a href=
							<?php
							echo esc_url(
								add_query_arg(
									$query_args
								)
							);
							?>
						class="fbnd-content-notice-close"><span class="fbnd-content-notice-close-icon dashicons dashicons-dismiss"> </span></a>
					</div>
								<?php
					}
				}
			}
		}
	}

	public function fbnd_dashboard_image_banner_notice( $return_bool = false ) {
		$fbnd_db_nonce  = wp_create_nonce( 'fbnd-nonce' );
		$banner_notices = array(
			array(
				'key'         => 'fbnd_summer_sale_2612',
				'start'       => '2026-07-20 00:00 Asia/Dhaka', // format YY-MM-DD always set time 00:00 and zone Asia/Dhaka
				'end'         => '2026-08-01 23:59 Asia/Dhaka', // format YY-MM-DD always set time 23:59 and zone Asia/Dhaka
				'banner_src'  => FBND_URL . 'assets/img/dashboard_banner/summer_sale/summer_sale_26.png',
				'url'         => Xpo::generate_utm_link(
					array(
						'utmKey' => 'summer_db',
					)
				),
				'close_color' => '#000000',
				'visibility'  => ! Xpo::is_lc_active(),
			),
			array(
				'key'         => 'fbnd_summer_sale_2613',
				'start'       => '2026-08-09 00:00 Asia/Dhaka', // format YY-MM-DD always set time 00:00 and zone Asia/Dhaka
				'end'         => '2026-08-16 23:59 Asia/Dhaka', // format YY-MM-DD always set time 23:59 and zone Asia/Dhaka
				'banner_src'  => FBND_URL . 'assets/img/dashboard_banner/summer_sale/summer_sale_26.png',
				'url'         => Xpo::generate_utm_link(
					array(
						'utmKey' => 'summer_db',
					)
				),
				'close_color' => '#000000',
				'visibility'  => ! Xpo::is_lc_active(),
			),
			array(
				'key'         => 'fbnd_preco_sale_campaign_262_1',
				'start'       => '2026-08-23 00:00 Asia/Dhaka', // format YY-MM-DD always set time 00:00 and zone Asia/Dhaka
				'end'         => '2026-08-29 23:59 Asia/Dhaka', // format YY-MM-DD always set time 23:59 and zone Asia/Dhaka
				'banner_src'  => FBND_URL . 'assets/img/dashboard_banner/preco_banner_insider_deal.png',
				'url'         => '#',
				'close_color' => '#ffffff',
				'visibility'  => ! Xpo::is_lc_active(),
			),
			array(
				'key'         => 'fbnd_preco_sale_campaign_262_2',
				'start'       => '2026-08-30 00:00 Asia/Dhaka', // format YY-MM-DD always set time 00:00 and zone Asia/Dhaka.
				'end'         => '2026-09-19 23:59 Asia/Dhaka', // format YY-MM-DD always set time 23:59 and zone Asia/Dhaka.
				'banner_src'  => FBND_URL . 'assets/img/dashboard_banner/preco_banner_early_bird.png',
				'url'         => '#',
				'close_color' => '#ffffff',
				'visibility'  => ! Xpo::is_lc_active(),
			),
		);

		foreach ( $banner_notices as $notice ) {
			$notice_key = isset( $notice['key'] ) ? $notice['key'] : $this->notice_version;
			if ( isset( $_GET['disable_fbnd_notice'] ) && $notice_key === sanitize_text_field(wp_unslash($_GET['disable_fbnd_notice'])) ) { // phpcs:ignore
				continue;
			}

			$current_time = gmdate( 'U' );
			$notice_start = gmdate( 'U', strtotime( $notice['start'] ) );
			$notice_end   = gmdate( 'U', strtotime( $notice['end'] ) );
			if ( $current_time >= $notice_start && $current_time <= $notice_end && $notice['visibility'] ) {

				$notice_transient = Xpo::get_transient_without_cache( 'fbnd_get_pro_notice_' . $notice_key );

				if ( 'off' === $notice_transient ) {
					continue;
				}

				if ( $return_bool ) { // Early return for Other plugin notice.
					return true;
				}

				if ( ! $this->notice_js_css_applied ) {
					$this->fbnd_banner_notice_js();
					$this->notice_js_css_applied = true;
				}
				$query_args = array(
					'disable_fbnd_notice' => $notice_key,
					'fbnd_db_nonce'       => $fbnd_db_nonce,
				);
				if ( isset( $notice['repeat_interval'] ) && $notice['repeat_interval'] ) {
					$query_args['fbnd_interval'] = $notice['repeat_interval'];
				}
				?>
				<style type="text/css">
					.fbnd-notice-wrapper.fbnd-image-notice-wrapper {
						padding: 0 !important;
						position: relative;
						box-sizing: border-box;
						overflow: hidden;
						border-radius: 0px;
						border: none !important;
					}
					.fbnd-notice-wrapper.fbnd-image-notice-wrapper .fbnd-image-banner {
						position: relative;
						line-height: 0;
					}
					.fbnd-notice-wrapper.fbnd-image-notice-wrapper .fbnd-btn-image {
						display: block;
					}
					.fbnd-notice-wrapper.fbnd-image-notice-wrapper .fbnd-btn-image img {
						display: block;
						width: 100%;
						height: auto;
						border-radius: 0;
					}
					.fbnd-notice-wrapper.fbnd-image-notice-wrapper .fbnd-content-notice-close {
						top: 4px;
						right: 4px;
						position: absolute;
						z-index: 999;
					}
					@media screen and (max-width: 650px) {
						.fbnd-image-notice-wrapper {
							display: none;
						}
					}
				</style>
				<div class="fbnd-notice-wrapper fbnd-image-notice-wrapper notice wc-install fbnd-free-notice">
					<div class="wc-install-body fbnd-image-banner">
						<a class="wc-dismiss-notice fbnd-content-notice-close"  href="
						<?php
						echo esc_url(
							add_query_arg(
								$query_args
							)
						);
						?>
						"><span class="fbnd-content-notice-close-icon dashicons dashicons-dismiss" style="color: <?php echo esc_attr( $notice['close_color'] ); ?>;"> </span></a>
						<a class="fbnd-btn-image" target="_blank" href="<?php echo esc_url( $notice['url'] ); ?>">
							<img loading="lazy" src="<?php echo esc_url( $notice['banner_src'] ); ?>" alt="Discount Banner"/>
						</a>
					</div>
				</div>
				
				<?php
			}
		}
	}


	/**
	 * Banner JS
	 *
	 * @return void
	 */
	public function fbnd_banner_notice_js() {
		?>
		<script type="text/javascript">
			jQuery(function($) {
				'use strict';

				const storagePrefix = 'fbnd_notice_countdown_';

				const formatCountdown = function(seconds) {
					const days = Math.floor(seconds / 86400);
					const hours = Math.floor((seconds % 86400) / 3600);
					const minutes = Math.floor((seconds % 3600) / 60);
					const secs = seconds % 60;

					return String(days).padStart(2, '0') + ':' + String(hours).padStart(2, '0') + ':' + String(minutes).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
				};

				const parseDurationToSeconds = function(duration) {
					if (typeof duration === 'number' && Number.isFinite(duration) && duration > 0) {
						return Math.floor(duration);
					}

					const durationString = String(duration || '').trim();
					if (/^\d+$/.test(durationString)) {
						return parseInt(durationString, 10);
					}

					return 0;
				};

				const nowInSeconds = function() {
					return Math.floor(Date.now() / 1000);
				};

				$('.fbnd-notice-countdown').each(function() {
					const countdownElement = $(this);
					const noticeKey = String(countdownElement.data('noticeKey') || '');
					const duration = parseDurationToSeconds(countdownElement.data('duration'));

					if (!noticeKey || duration <= 0) {
						return;
					}

					const storageKey = storagePrefix + noticeKey;
					let endAt = 0;

					try {
						const storedDataRaw = window.localStorage.getItem(storageKey);
						if (storedDataRaw) {
							const storedData = JSON.parse(storedDataRaw);
							if (storedData && parseInt(storedData.duration, 10) === duration) {
								endAt = parseInt(storedData.endAt, 10) || 0;
							}
						}
					} catch (error) {
						endAt = 0;
					}

					const saveTimerState = function(nextEndAt) {
						try {
							window.localStorage.setItem(
								storageKey,
								JSON.stringify({
									endAt: nextEndAt,
									duration: duration,
								})
							);
						} catch (error) {
							// No-op.
						}
					};

					const resetTimer = function(currentTime) {
						endAt = currentTime + duration;
						saveTimerState(endAt);
					};

					const tick = function() {
						const currentTime = nowInSeconds();

						if (endAt <= currentTime) {
							resetTimer(currentTime);
						}

						const remaining = Math.max(endAt - currentTime, 0);
						countdownElement.text(formatCountdown(remaining));
					};

					if (endAt <= nowInSeconds()) {
						resetTimer(nowInSeconds());
					}

					tick();
					window.setInterval(tick, 1000);
				});
			});
		</script>
		<?php
	}

	/**
	 * Set Notice Dismiss Callback
	 *
	 * @return void
	 */
	public function set_dismiss_notice_callback() {
		$fbnd_db_nonce = sanitize_text_field( wp_unslash( $_GET['fbnd_db_nonce'] ?? '' ) );

		if ( ! ( ! empty( $fbnd_db_nonce ) && wp_verify_nonce( $fbnd_db_nonce, 'fbnd-nonce' ) ) ) {
			return;
		}

		$durbin_key = sanitize_text_field( wp_unslash( $_GET['fbnd_durbin_key'] ?? '' ) );

		// Durbin notice dismiss.
		if ( ! empty( $durbin_key ) ) {
			Xpo::set_transient_without_cache( 'fbnd_durbin_notice_' . $durbin_key, 'off' );

			if ( 'get' === sanitize_text_field( wp_unslash( $_GET['fbnd_get_durbin'] ?? '' ) ) ) {
				DurbinClient::send( DurbinClient::ACTIVATE_ACTION );
			}
		}

		// Install notice dismiss.
		$install_key = sanitize_text_field( wp_unslash( $_GET['fbnd_install_key'] ?? '' ) );
		if ( ! empty( $install_key ) ) {
			Xpo::set_transient_without_cache( 'fbnd_install_notice_' . $install_key, 'off' );
		}

		$notice_key = sanitize_text_field( wp_unslash( $_GET['disable_fbnd_notice'] ?? '' ) );
		if ( ! empty( $notice_key ) ) {
			$interval = (int) sanitize_text_field( wp_unslash( $_GET['fbnd_interval'] ?? '' ) );
			if ( ! empty( $interval ) ) {
				Xpo::set_transient_without_cache( 'fbnd_get_pro_notice_' . $notice_key, 'off', $interval );
			} else {
				Xpo::set_transient_without_cache( 'fbnd_get_pro_notice_' . $notice_key, 'off' );
			}
		}
	}


	/**
	 * The Durbin Html
	 *
	 * @return string | HTML
	 */
	public function fbnd_dashboard_durbin_notice_callback() {
		$durbin_key = 'fbnd_durbin_dc2x';

		if (
			isset( $_GET['fbnd_durbin_key'] ) || // phpcs:ignore
			'off' === Xpo::get_transient_without_cache( 'fbnd_durbin_notice_' . $durbin_key )
		) {
			return;
		}

		if ( ! $this->notice_js_css_applied ) {
			$this->notice_js_css_applied = true;
		}

		$fbnd_db_nonce = wp_create_nonce( 'fbnd-nonce' );

		?>
		<style>
				.fbnd-consent-box {
					width: 656px;
					padding: 16px !important;
					border: 1px solid #070707;
					border-left-width: 4px;
					border-radius: 4px;
					background-color: #fff;
					position: relative;
					width: 100%;
					box-sizing: border-box;
				}
				.fbnd-consent-content {
					display: flex;
					justify-content: flex-start;
					align-items: flex-end;
					gap: 26px;
				}
 
				.fbnd-consent-text-first {
					font-size: 14px;
					font-weight: 600;
					color: #070707;
				}
				.fbnd-consent-text-last {
					margin: 4px 0 0;
					font-size: 14px;
					color: #070707;
				}
 
				.fbnd-consent-accept {
					background-color: #070707;
					color: #fff;
					border: none;
					padding: 6px 10px;
					border-radius: 4px;
					cursor: pointer;
					font-size: 12px;
					font-weight: 600;
					text-decoration: none;
				}
				.fbnd-consent-accept:hover {
					background-color:rgb(38, 38, 38);
					color: #fff;
				}
			</style>
			<div class="fbnd-consent-box fbnd-notice-wrapper notice data_collection_notice">
			<div class="fbnd-consent-content">
			<div class="fbnd-consent-text">
			<div class="fbnd-consent-text-first"><?php esc_html_e( 'Want to help make FastBundle even more awesome?', 'fast-bundle' ); ?></div>
			<div class="fbnd-consent-text-last">
					<?php esc_html_e( 'Allow us to collect diagnostic data and usage information. see ', 'fast-bundle' ); ?>
			<a href="#" target="_blank" ><?php esc_html_e( 'what we collect.', 'fast-bundle' ); ?></a>
			</div>
			</div>
			<a
					class="fbnd-consent-accept"
					href=
					<?php
									echo esc_url(
										add_query_arg(
											array(
												'fbnd_durbin_key' => $durbin_key,
												'fbnd_get_durbin' => 'get',
												'fbnd_db_nonce' => $fbnd_db_nonce,
											)
										)
									);
					?>
									class="fbnd-notice-close"
			><?php esc_html_e( 'Accept & Close', 'fast-bundle' ); ?></a>
			</div>
			<a href=
				<?php
							echo esc_url(
								add_query_arg(
									array(
										'fbnd_durbin_key' => $durbin_key,
										'fbnd_db_nonce'   => $fbnd_db_nonce,
									)
								)
							);
				?>
				class="fbnd-notice-close"
				style="
					position: absolute;
					right: 2px;
					top: 5px;
					text-decoration: unset;
					color: #b6b6b6;
					font-family: dashicons;
					font-size: 16px;
					font-style: normal;
					font-weight: 400;
					line-height: 20px;
				"
			>
				<span 
				style="font-size: 14px;"
				class="fbnd-notice-close-icon dashicons dashicons-dismiss"> </span></a>
			</div>
		<?php
	}
}
