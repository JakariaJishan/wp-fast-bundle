<?php //phpcs:ignore
/**
 * Plugin Deactivation Handler.
 *
 * @package FBND\Deactive
 * @since
 */

namespace FBND\Includes;

use FBND\Includes\Admin\Durbin\DurbinClient;

defined( 'ABSPATH' ) || exit;

/**
 * Handles plugin deactivation feedback and reporting.
 */
class Deactive {

	/**
	 * Plugin slug used for identifying the plugin.
	 *
	 * @var string
	 */
	private $plugin_slug = 'fast-bundle';

	/**
	 * Constructor.
	 */
	public function __construct() {
		global $pagenow;

		if ( 'plugins.php' === $pagenow ) {
			add_action( 'admin_footer', array( $this, 'get_source_data_callback' ) );
		}
		add_action( 'wp_ajax_fbnd_deactive_plugin', array( $this, 'send_plugin_data' ) );
	}

	/**
	 * Send plugin deactivation data to remote server.
	 *
	 * @return void
	 */
	public function send_plugin_data() {
		DurbinClient::send( DurbinClient::DEACTIVATE_ACTION );
	}

	/**
	 * Output deactivation modal markup, CSS, and JS.
	 *
	 * @return void
	 */
	public function get_source_data_callback() {
		$this->deactive_container_css();
		$this->deactive_container_js();
		$this->deactive_html_container();
	}

	/**
	 * Get deactivation reasons and field settings.
	 *
	 * @return array[] List of deactivation options.
	 */
	public function get_deactive_settings() {
		return array(

			array(
				'id'    => 'not-working',
				'input' => false,
				'text'  => __( 'The plugin isn’t working properly.', 'fast-bundle' ),
			),
			array(
				'id'    => 'limited-features',
				'input' => false,
				'text'  => __( 'Limited features on the free version.', 'fast-bundle' ),
			),
			array(
				'id'          => 'better-plugin',
				'input'       => true,
				'text'        => __( 'I found a better plugin.', 'fast-bundle' ),
				'placeholder' => __( 'Please share which plugin.', 'fast-bundle' ),
			),
			array(
				'id'    => 'temporary-deactivation',
				'input' => false,
				'text'  => __( "It's a temporary deactivation.", 'fast-bundle' ),
			),
			array(
				'id'          => 'other',
				'input'       => true,
				'text'        => __( 'Other.', 'fast-bundle' ),
				'placeholder' => __( 'Please share the reason.', 'fast-bundle' ),
			),
		);
	}

	/**
	 * Output HTML for the deactivation modal.
	 *
	 * @return void
	 */
	public function deactive_html_container() {
		?>
		<div class="fbnd-modal" id="fbnd-deactive-modal">
			<div class="fbnd-modal-wrap">
			
				<div class="fbnd-modal-header">
					<h2><?php esc_html_e( 'Quick Feedback', 'fast-bundle' ); ?></h2>
					<button class="fbnd-modal-cancel"><span class="dashicons dashicons-no-alt"></span></button>
				</div>

				<div class="fbnd-modal-body">
					<h3><?php esc_html_e( 'If you have a moment, please let us know why you are deactivating FastBundle:', 'fast-bundle' ); ?></h3>
					<ul class="fbnd-modal-input">
						<?php foreach ( $this->get_deactive_settings() as $key => $setting ) { ?>
							<li>
								<label>
									<input type="radio" <?php echo 0 == $key ? 'checked="checked"' : ''; ?> id="<?php echo esc_attr( $setting['id'] ); ?>" name="<?php echo esc_attr( $this->plugin_slug ); ?>" value="<?php echo esc_attr( $setting['text'] ); ?>">
									<div class="fbnd-reason-text"><?php echo esc_html( $setting['text'] ); ?></div>
									<?php if ( isset( $setting['input'] ) && $setting['input'] ) { ?>
										<textarea id="fbnd-tarea" placeholder="<?php echo esc_attr( $setting['placeholder'] ); ?>" class="fbnd-reason-input <?php echo $key == 0 ? 'fbnd-active' : ''; ?> <?php echo esc_html( $setting['id'] ); ?>"></textarea>
									<?php } ?>
								</label>
							</li>
						<?php } ?>
					</ul>
				</div>

				<div class="fbnd-modal-footer">
					<a class="fbnd-modal-submit fbnd-btn fbnd-btn-primary" href="#"><?php esc_html_e( 'Submit & Deactivate', 'fast-bundle' ); ?><span class="dashicons dashicons-update rotate"></span></a>
					<a class="fbnd-modal-deactive" href="#"><?php esc_html_e( 'Skip & Deactivate', 'fast-bundle' ); ?></a>
				</div>
				
			</div>
		</div>
		<?php
	}

	/**
	 * Performs cleanup tasks when the plugin is deactivated.
	 *
	 * @return void
	 */
	public static function cleanup() {
		global $wpdb;

		// Remove scheduled cron jobs.
		wp_clear_scheduled_hook( 'fbnd_cleanup_upload_files' );

		// Remove all plugin temporary data.

		$fbnd_option_posts = get_posts(
			array(
				'post_type'      => 'fbnd_option',
				'post_status'    => 'any',
				'posts_per_page' => -1,
				'fields'         => 'ids',
			)
		);

		if ( ! empty( $fbnd_option_posts ) ) {
			foreach ( $fbnd_option_posts as $post_id ) {
				wp_delete_post( $post_id, true );
			}
		}

		$options = array(
			'fbnd_addons_default_option_created',
			'fbnd_option_assign_all',
			'fbnd_product_image_update_data',
			'fbnd_global_style',
			'fbnd_global_style_css',
			'fbnd_settings',
			'fbnd_custom_fonts',
			'edd_fbnd_license_data',
			'edd_fbnd_license_key',
		);

		foreach ( $options as $option ) {
			delete_option( $option );
		}

		$wpdb->query( "DROP TABLE IF EXISTS {$wpdb->prefix}fbnd_stats_graph" );// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.DirectDatabaseQuery.SchemaChange
		$wpdb->query( "DROP TABLE IF EXISTS {$wpdb->prefix}fbnd_stats_table" );// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.DirectDatabaseQuery.SchemaChange

		$wpdb->query( $wpdb->prepare( "DELETE FROM {$wpdb->termmeta} WHERE meta_key = %s", 'fbnd_term_assigned_meta_inc' ) );// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.DirectDatabaseQuery.SchemaChange

		$wpdb->query( $wpdb->prepare( "DELETE FROM {$wpdb->postmeta} WHERE meta_key = %s", 'fbnd_product_assigned_meta_exc' ) );// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.DirectDatabaseQuery.SchemaChange
		$wpdb->query( $wpdb->prepare( "DELETE FROM {$wpdb->postmeta} WHERE meta_key = %s", 'fbnd_product_assigned_meta_inc' ) );// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.DirectDatabaseQuery.SchemaChange
	}

	/**
	 * Output inline CSS for the modal.
	 *
	 * @return void
	 */
	public function deactive_container_css() {
		?>
		<style type="text/css">
			.fbnd-modal {
				position: fixed;
				z-index: 99999;
				top: 0;
				right: 0;
				bottom: 0;
				left: 0;
				background: rgba(0,0,0,0.5);
				display: none;
				box-sizing: border-box;
				overflow: scroll;
			}
			.fbnd-modal * {
				box-sizing: border-box;
			}
			.fbnd-modal.modal-active {
				display: block;
			}
			.fbnd-modal-wrap {
				max-width: 870px;
				width: 100%;
				position: relative;
				margin: 10% auto;
				background: #fff;
			}
			.fbnd-reason-input{
				display: none;
			}
			.fbnd-reason-input.fbnd-active{
				display: block;
			}
			.rotate{
				animation: rotate 1.5s linear infinite; 
			}
			@keyframes rotate{
				to{ transform: rotate(360deg); }
			}
			.fbnd-popup-rotate{
				animation: popupRotate 1s linear infinite; 
			}
			@keyframes popupRotate{
				to{ transform: rotate(360deg); }
			}
			#fbnd-deactive-modal {
				background: rgb(0 0 0 / 85%);
				overflow: hidden;
			}
			#fbnd-deactive-modal .fbnd-modal-wrap {
				max-width: 570px;
				border-radius: 5px;
				margin: 5% auto;
				overflow: hidden;
			}
			#fbnd-deactive-modal .fbnd-modal-header {
				padding: 17px 30px;
				border-bottom: 1px solid #ececec;
				display: flex;
				align-items: center;
				background: #f5f5f5;
			}
			#fbnd-deactive-modal .fbnd-modal-header .fbnd-modal-cancel {
				padding: 0;
				border-radius: 100px;
				border: 1px solid #b9b9b9;
				background: none;
				color: #b9b9b9;
				cursor: pointer;
				transition: 400ms;
			}
			#fbnd-deactive-modal .fbnd-modal-header .fbnd-modal-cancel:focus {
				color: red;
				border: 1px solid red;
				outline: 0;
			}
			#fbnd-deactive-modal .fbnd-modal-header .fbnd-modal-cancel:hover {
				color: red;
				border: 1px solid red;
			}
			#fbnd-deactive-modal .fbnd-modal-header h2 {
				margin: 0;
				padding: 0;
				flex: 1;
				line-height: 1;
				font-size: 20px;
				text-transform: uppercase;
				color: #8e8d8d;
			}
			#fbnd-deactive-modal .fbnd-modal-body {
				padding: 25px 30px;
			}
			#fbnd-deactive-modal .fbnd-modal-body h3{
				padding: 0;
				margin: 0;
				line-height: 1.4;
				font-size: 15px;
			}
			#fbnd-deactive-modal .fbnd-modal-body ul {
				margin: 25px 0 10px;
			}
			#fbnd-deactive-modal .fbnd-modal-body ul li {
				display: flex;
				margin-bottom: 10px;
				color: #807d7d;
			}
			#fbnd-deactive-modal .fbnd-modal-body ul li:last-child {
				margin-bottom: 0;
			}
			#fbnd-deactive-modal .fbnd-modal-body ul li label {
				align-items: center;
				width: 100%;
			}
			#fbnd-deactive-modal .fbnd-modal-body ul li label input {
				padding: 0 !important;
				margin: 0;
				display: inline-block;
			}
			#fbnd-deactive-modal .fbnd-modal-body ul li label textarea {
				margin-top: 8px;
				width: 100%;
			}
			#fbnd-deactive-modal .fbnd-modal-body ul li label .fbnd-reason-text {
				margin-left: 8px;
				display: inline-block;
			}
			#fbnd-deactive-modal .fbnd-modal-footer {
				padding: 0 30px 30px 30px;
				display: flex;
				align-items: center;
			}
			#fbnd-deactive-modal .fbnd-modal-footer .fbnd-modal-submit {
				display: flex;
				align-items: center;
				padding: 12px 22px;
				border-radius: 3px;
				background: #86a62c;
				color: #fff;
				font-size: 16px;
				font-weight: 600;
				text-decoration: none;
			}
			#fbnd-deactive-modal .fbnd-modal-footer .fbnd-modal-submit span {
				margin-left: 4px;
				display: none;
			}
			#fbnd-deactive-modal .fbnd-modal-footer .fbnd-modal-submit.loading span {
				display: block;
			}
			#fbnd-deactive-modal .fbnd-modal-footer .fbnd-modal-deactive {
				margin-left: auto;
				color: #c5c5c5;
				text-decoration: none;
			}
			
		</style>
		<?php
	}

	/**
	 * Output inline JavaScript for the modal logic.
	 *
	 * @return void
	 */
	public function deactive_container_js() {
		?>
		<script type="text/javascript">
			jQuery( document ).ready( function( $ ) {
				'use strict';

				// Modal Radio Input Click Action
				$('.fbnd-modal-input input[type=radio]').on( 'change', function(e) {
					$('.fbnd-reason-input').removeClass('fbnd-active');
					$('.fbnd-modal-input').find( '.'+$(this).attr('id') ).addClass('fbnd-active');
				});

				// Modal Cancel Click Action
				$( document ).on( 'click', '.fbnd-modal-cancel', function(e) {
					$( '#fbnd-deactive-modal' ).removeClass( 'modal-active' );
				});
				
				$(document).on('click', function(event) {
					const $popup = $('#fbnd-deactive-modal');
					const $modalWrap = $popup.find('.fbnd-modal-wrap');

					if ( !$modalWrap.is(event.target) && $modalWrap.has(event.target).length === 0 && $popup.hasClass('modal-active')) {
						$popup.removeClass('modal-active');
					}
				});

				// Deactivate Button Click Action
				$( document ).on( 'click', '#deactivate-fast-bundle', function(e) {
					e.preventDefault();
					e.stopPropagation();
					$( '#fbnd-deactive-modal' ).addClass( 'modal-active' );
					$( '.fbnd-modal-deactive' ).attr( 'href', $(this).attr('href') );
					$( '.fbnd-modal-submit' ).attr( 'href', $(this).attr('href') );
				});

				// Submit to Remote Server
				$( document ).on( 'click', '.fbnd-modal-submit', function(e) {
					e.preventDefault();
					
					$(this).addClass('loading');
					const url = $(this).attr('href')

					$.ajax({
						url: '<?php echo esc_url( admin_url( 'admin-ajax.php' ) ); ?>',
						type: 'POST',
						data: { 
							action: 'fbnd_deactive_plugin',
							cause_id: $('#fbnd-deactive-modal input[type=radio]:checked').attr('id'),
							cause_title: $('#fbnd-deactive-modal .fbnd-modal-input input[type=radio]:checked').val(),
							cause_details: $('#fbnd-deactive-modal .fbnd-reason-input.fbnd-active').val()
						},
						success: function (data) {
							$( '#fbnd-deactive-modal' ).removeClass( 'modal-active' );
							window.location.href = url;
						},
						error: function(xhr) {
							console.log( 'Error occured. Please try again' + xhr.statusText + xhr.responseText );
						},
					});

				});

			});
		</script>
		<?php
	}
}
