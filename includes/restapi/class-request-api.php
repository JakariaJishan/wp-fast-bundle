<?php	// phpcs:ignore
/**
 * RequestAPI Action.
 *
 * @package FBND\Options
 * @since 1.0.0
 */

namespace FBND\Includes\Restapi;

use FBND\Includes\Admin\Durbin\DurbinClient;
use FBND\Includes\Analytics;
use FBND\Includes\Xpo;
use WP_REST_Response;
use WC_Data_Store;

defined( 'ABSPATH' ) || exit;
/**
 * RequestAPI class to handle API requests.
 *
 * @since 1.0.0
 */
class RequestApi {


	private $extra_upload_field_mimes = array();

	/**
	 * Initialize the RequestAPI class
	 *
	 * @since 1.0.0
	 */
	public function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_route' ) );
	}

	/**
	 * Register hook
	 *
	 * @since 1.0.0
	 */
	public function register_route() {
		$routes = array(
			// Single Product Page file upload.
			array(
				'endpoint'            => 'upload-file',
				'methods'             => 'POST',
				'callback'            => array( $this, 'upload_files_callback' ),
				'permission_callback' => '__return_true',
			),
			// Live Personalizer mockup snapshot upload (captured at add-to-cart).
			array(
				'endpoint'            => 'personalizer-mockup-upload',
				'methods'             => 'POST',
				'callback'            => array( $this, 'personalizer_mockup_upload_callback' ),
				'permission_callback' => '__return_true',
			),
			array(
				'endpoint'            => 'set_analytics',
				'methods'             => 'POST',
				'callback'            => array( $this, 'set_analytics_data_callback' ),
				'permission_callback' => '__return_true',
			),

			// Get Analytics Data.
			array(
				'endpoint'            => 'get_analytics',
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_analytics_data_callback' ),
				'permission_callback' => array( $this, 'fbnd_get_view_only_permissions' ),
			),

			// Backend Option Listing.
			array(
				'endpoint'            => 'option_list',
				'methods'             => 'POST',
				'callback'            => array( $this, 'option_listing_callback' ),
				'permission_callback' => array( $this, 'fbnd_get_view_only_permissions' ),
			),
			// Duplicate List.
			array(
				'endpoint'            => 'list_duplicate',
				'methods'             => 'POST',
				'callback'            => array( $this, 'list_duplicate_callback' ),
				'permission_callback' => array( $this, 'fbnd_get_admin_permissions' ),
			),
			// Import List.
			array(
				'endpoint'            => 'list_import',
				'methods'             => 'POST',
				'callback'            => array( $this, 'list_import_callback' ),
				'permission_callback' => array( $this, 'fbnd_get_admin_permissions' ),
			),
			// Delete List.
			array(
				'endpoint'            => 'list_delete',
				'methods'             => 'POST',
				'callback'            => array( $this, 'list_delete_callback' ),
				'permission_callback' => array( $this, 'fbnd_get_admin_permissions' ),
			),
			// Update List.
			array(
				'endpoint'            => 'list_update',
				'methods'             => 'POST',
				'callback'            => array( $this, 'list_update_callback' ),
				'permission_callback' => array( $this, 'fbnd_get_admin_permissions' ),
			),
			// Get Option Edit Page Data.
			array(
				'endpoint'            => 'get_option',
				'methods'             => 'POST',
				'callback'            => array( $this, 'get_option_callback' ),
				'permission_callback' => array( $this, 'fbnd_get_view_only_permissions' ),
			),
			// Save Option Edit Page Data.
			array(
				'endpoint'            => 'set_option',
				'methods'             => 'POST',
				'callback'            => array( $this, 'set_option_callback' ),
				'permission_callback' => array( $this, 'fbnd_get_admin_permissions' ),
			),
			// Option Assign Search Products.
			array(
				'endpoint'            => 'assign_search',
				'methods'             => 'POST',
				'callback'            => array( $this, 'assign_search_callback' ),
				'permission_callback' => array( $this, 'fbnd_get_view_only_permissions' ),
			),
			array(
				'endpoint'            => 'product_search',
				'methods'             => 'POST',
				'callback'            => array( $this, 'get_product_search_callback' ),
				'permission_callback' => array( $this, 'fbnd_get_view_only_permissions' ),
			),
			array(
				'endpoint'            => 'products_details',
				'methods'             => 'POST',
				'callback'            => array( $this, 'get_products_details_callback' ),
				'permission_callback' => array( $this, 'fbnd_get_view_only_permissions' ),
			),
			// Get Assign Data.
			array(
				'endpoint'            => 'get_assign',
				'methods'             => 'POST',
				'callback'            => array( $this, 'get_assign_product_callback' ),
				'permission_callback' => array( $this, 'fbnd_get_view_only_permissions' ),
			),
			// Set Assign Data.
			array(
				'endpoint'            => 'set_assign',
				'methods'             => 'POST',
				'callback'            => array( $this, 'set_assign_product_callback' ),
				'permission_callback' => array( $this, 'fbnd_get_admin_permissions' ),
			),
			// Save Live Personalizer canvas/preview settings.
			array(
				'endpoint'            => 'set_canvas',
				'methods'             => 'POST',
				'callback'            => array( $this, 'set_canvas_callback' ),
				'permission_callback' => array( $this, 'fbnd_get_admin_permissions' ),
			),
			// Get Global Settings.
			array(
				'endpoint'            => 'get_global',
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_global_callback' ),
				'permission_callback' => array( $this, 'fbnd_get_view_only_permissions' ),
			),
			// Set Global Settings.
			array(
				'endpoint'            => 'set_global',
				'methods'             => 'POST',
				'callback'            => array( $this, 'set_global_callback' ),
				'permission_callback' => array( $this, 'fbnd_get_admin_permissions' ),
			),

			// Get Global Settings.
			array(
				'endpoint'            => 'get_settings',
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_settings_callback' ),
				'permission_callback' => array( $this, 'fbnd_get_view_only_permissions' ),
			),
			// Set Global Settings.
			array(
				'endpoint'            => 'set_settings',
				'methods'             => 'POST',
				'callback'            => array( $this, 'set_settings_callback' ),
				'permission_callback' => array( $this, 'fbnd_get_admin_permissions' ),
			),
			// Set Global Settings.
			array(
				'endpoint'            => 'install_plugin',
				'methods'             => 'POST',
				'callback'            => array( $this, 'install_plugin_callback' ),
				'permission_callback' => function () {
					return current_user_can( 'manage_options' );
				},
			),
			// Product Image Compatibility.
			array(
				'endpoint'            => 'product_image',
				'methods'             => 'POST',
				'callback'            => array( $this, 'product_image_callback' ),
				'permission_callback' => array( $this, 'fbnd_get_admin_permissions' ),
			),
			// Sideload External Image to Media Library.
			array(
				'endpoint'            => 'sideload_image',
				'methods'             => 'POST',
				'callback'            => array( $this, 'sideload_image_callback' ),
				'permission_callback' => function () {
					return current_user_can( 'manage_options' );
				},
			),

			// Font Upload.
			array(
				'endpoint'            => 'upload_font',
				'methods'             => 'POST',
				'callback'            => array( $this, 'upload_font_callback' ),
				'permission_callback' => array( $this, 'fbnd_get_admin_permissions' ),
			),
			// Get Fonts List.
			array(
				'endpoint'            => 'get_fonts',
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_fonts_callback' ),
				'permission_callback' => array( $this, 'fbnd_get_view_only_permissions' ),
			),
			// Delete Font.
			array(
				'endpoint'            => 'delete_font',
				'methods'             => 'POST',
				'callback'            => array( $this, 'delete_font_callback' ),
				'permission_callback' => array( $this, 'fbnd_get_admin_permissions' ),
			),
			// Update Font.
			array(
				'endpoint'            => 'update_font',
				'methods'             => 'POST',
				'callback'            => array( $this, 'update_font_callback' ),
				'permission_callback' => array( $this, 'fbnd_get_admin_permissions' ),
			),

			array(
				'endpoint'            => 'product_link',
				'methods'             => 'POST',
				'callback'            => array( $this, 'get_product_link_callback' ),
				'permission_callback' => array( $this, 'fbnd_get_view_only_permissions' ),
			),

			// Dismiss the builder onboarding tour.
			array(
				'endpoint'            => 'dismiss_tour',
				'methods'             => 'POST',
				'callback'            => array( $this, 'dismiss_tour_callback' ),
				'permission_callback' => array( $this, 'fbnd_get_admin_permissions' ),
			),
			array(
				'endpoint'            => 'durbin_subscribe',
				'methods'             => 'POST',
				'callback'            => array( $this, 'durbin_subscribe_callback' ),
				'permission_callback' => array( $this, 'fbnd_get_admin_permissions' ),
			),
		);

		foreach ( $routes as $route ) {
			register_rest_route(
				'fbnd',
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
	 * Check permissions for endpoint.
	 *
	 * @return bool
	 */
	public function fbnd_get_view_only_permissions() {
		return current_user_can( Xpo::fbnd_old_view_permisson_handler() );
	}
	/**
	 * Check permissions for Edit, Update endpoint.
	 *
	 * @return bool
	 */
	public function fbnd_get_admin_permissions() {
		return current_user_can( Xpo::fbnd_manage_admin_permisson_handler() );
	}

	/**
	 * Retrieves option data for a given post ID.
	 *
	 * @since 1.0.0
	 *
	 * @param \WP_REST_Request $request The REST API request object.
	 * @return WP_REST_Response Response containing option data or an error message.
	 */
	public function get_option_callback( \WP_REST_Request $request ) {
		$params = $request->get_params();
		$id     = isset( $params['id'] ) ? sanitize_text_field( $params['id'] ) : 0;
		$post   = get_post( $id );

		if ( ! $post ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => __( 'Post not found.', 'fast-bundle' ),
				),
				404
			);
		}

		// Prepare the response data.
		$data = array(
			'id'      => $post->ID,
			'title'   => $post->post_title,
			'status'  => $post->post_status,
			'type'    => get_post_meta( $id, 'fbnd_option_type', true ) ?: 'custom',
			'content' => get_post_meta( $id, 'fbnd_addons_blocks', true ),
			// Live Personalizer "Preview settings" — bundled here rather than a
			// separate REST round trip, same reasoning as `content` above.
			'canvas'  => $this->get_canvas_settings_for_editor( $id ),
			'error'   => json_last_error_msg(),
		);

		// Return the success response with the post data.
		return new WP_REST_Response(
			array(
				'success' => true,
				'post'    => $data,
			),
			200
		);
	}

	/**
	 * Read the stored Live Personalizer canvas settings for the editor's
	 * Preview settings modal, default-filled the same way
	 * `Personalizer::get_canvas_config()` fills them for the storefront.
	 *
	 * Kept alongside (not delegating to) that method: it lives on the
	 * storefront-only `Personalizer` class with no reachable instance here,
	 * and the default shape is tiny enough that duplicating it beats wiring a
	 * cross-class dependency for one read.
	 *
	 * @since 1.8.0
	 *
	 * @param int|string $option_id Option post id.
	 * @return array Canvas settings.
	 */
	private function get_canvas_settings_for_editor( $option_id ) {
		$stored = get_post_meta( (int) $option_id, 'fbnd_personalizer_canvas', true );
		if ( is_string( $stored ) && '' !== $stored ) {
			$decoded = json_decode( $stored, true );
			if ( is_array( $decoded ) ) {
				return $decoded;
			}
		}
		if ( is_array( $stored ) && ! empty( $stored ) ) {
			return $stored;
		}

		return array(
			'enabled' => true,
			'scenes'  => array(
				array(
					'id'         => 'default',
					'background' => array(
						'type'      => 'product_image',
						'applyTo'   => 'all',
						'customUrl' => '',
						'customId'  => 0,
					),
				),
			),
			'export'  => array(
				'pixelRatio'     => 2,
				'productionFile' => false,
			),
		);
	}

	/**
	 * Updates or creates option data.
	 *
	 * @since 1.0.0
	 *
	 * @param \WP_REST_Request $request The REST API request object.
	 * @return WP_REST_Response Response indicating success or failure.
	 */
	public function set_option_callback( \WP_REST_Request $request ) {
		// Retrieve and sanitize request parameters.
		$params          = $request->get_params();
		$id              = isset( $params['id'] ) ? sanitize_text_field( $params['id'] ) : '';
		$title           = isset( $params['title'] ) ? sanitize_text_field( $params['title'] ) : 'Untitled';
		$status          = isset( $params['status'] ) ? sanitize_text_field( $params['status'] ) : 'draft';
		$option_type     = isset( $params['option_type'] ) ? sanitize_text_field( $params['option_type'] ) : 'custom';
		$content         = isset( $params['content'] ) && is_array( $params['content'] ) ? fast_bundle()->sanitize_rest_params( $params['content'] ) : '';
		$required_fields = isset( $params['required_fields'] ) && is_array( $params['required_fields'] ) ? fast_bundle()->sanitize_rest_params( $params['required_fields'] ) : '';
		$css             = isset( $params['css'] ) ? fast_bundle()->sanitize_rest_params( $params['css'] ) : '';
		$nonce           = isset( $params['wpnonce'] ) ? sanitize_text_field( $params['wpnonce'] ) : '';

		if ( ! $nonce || ! wp_verify_nonce( $nonce, 'fbnd-nonce' ) ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => __( 'Invalid or missing nonce.', 'fast-bundle' ),
				),
				403
			);
		}

		// Prepare the attributes for the post.
		$attr    = array(
			'post_title'   => $title,
			'post_status'  => $status,
			'post_content' => $title,
			'post_type'    => 'fbnd_option',
		);
		$message = 'publish' === $status
				? __( 'Option set updated & published.', 'fast-bundle' )
				: __( 'Option set updated & saved as a draft.', 'fast-bundle' );
		if ( 'new' === $id ) {
			$id = wp_insert_post( $attr );
			if ( is_wp_error( $id ) ) {
				return new WP_REST_Response(
					array(
						'success' => false,
						'message' => __( 'Failed to create a new option.', 'fast-bundle' ),
					),
					400
				);
			}

			update_option( 'fbnd_first_option_created', 'yes' );
			update_post_meta( $id, 'fbnd_addons_blocks', $content );
			update_post_meta( $id, 'fbnd_option_type', $option_type );
			$required_options = $required_fields ? $required_fields : array();
			update_post_meta( $id, 'fbnd_required_options', $required_options );
			if ( $css ) {
				update_post_meta( $id, 'fbnd_addons_css', $css );
			}
			do_action( 'fbnd_handle_cache_on_save' );

			return new WP_REST_Response(
				array(
					'success' => true,
					'message' => $message,
					'id'      => $id,
				),
				200
			);
		} else {
			$attr['ID'] = $id;
			$update     = wp_update_post( $attr, true );

			if ( is_wp_error( $update ) ) {
				return new WP_REST_Response(
					array(
						'success' => false,
						'message' => __( 'Failed to update the option.', 'fast-bundle' ),
					),
					400
				);
			}

			if ( $css ) {
				update_post_meta( $id, 'fbnd_addons_css', $css );
			}

			update_post_meta( $id, 'fbnd_addons_blocks', $content );
			update_post_meta( $id, 'fbnd_option_type', $option_type );
			$required_options = $required_fields ? $required_fields : array();
			update_post_meta( $id, 'fbnd_required_options', $required_options );
			do_action( 'fbnd_handle_cache_on_save' );

			return new WP_REST_Response(
				array(
					'success' => true,
					'content' => $content,
					'message' => $message,
				),
				200
			);
		}
	}

	/**
	 * Updates the status of multiple options based on provided IDs.
	 *
	 * @since 1.0.0
	 *
	 * @param \WP_REST_Request $request The REST API request object.
	 * @return WP_REST_Response Response indicating success or failure of the update.
	 */
	public function list_update_callback( \WP_REST_Request $request ) {
		$params = $request->get_params();
		$ids    = isset( $params['ids'] ) ? sanitize_text_field( $params['ids'] ) : '';
		$status = isset( $params['status'] ) ? sanitize_text_field( $params['status'] ) : '';
		$nonce  = isset( $params['wpnonce'] ) ? sanitize_text_field( $params['wpnonce'] ) : '';

		if ( ! $nonce || ! wp_verify_nonce( $nonce, 'fbnd-nonce' ) ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => __( 'Invalid or missing nonce.', 'fast-bundle' ),
				),
				403
			);
		}

		if ( empty( $ids ) ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => __( 'No IDs provided.', 'fast-bundle' ),
				),
				400
			);
		}

		// Convert IDs to an array and update each post.
		$ids_array = explode( ',', $ids );
		foreach ( $ids_array as $id ) {
			$attr = array(
				'ID'          => (int) $id,
				'post_status' => ( 'active' === $status ) ? 'publish' : 'draft',
			);

			$update = wp_update_post( $attr, true );

			if ( is_wp_error( $update ) ) {
				return new WP_REST_Response(
					array(
						'success' => false,
						'message' => sprintf(
							/* translators: %1s - Post Id, %2s - Error Message */
							__( 'Failed to update post ID: %1$s. Error: %2$s', 'fast-bundle' ),
							$id,
							$update->get_error_message()
						),
					),
					400
				);
			}
		}

		do_action( 'fbnd_handle_cache_on_save' );
		// Return success response.
		return new WP_REST_Response(
			array(
				'success' => true,
				'status'  => $status,
				'message' => __( 'Items updated successfully.', 'fast-bundle' ),
			),
			200
		);
	}

	/**
	 * Deletes multiple options based on provided IDs.
	 *
	 * @since 1.0.0
	 *
	 * @param \WP_REST_Request $request The REST API request object.
	 * @return WP_REST_Response Response indicating success or failure of the deletion.
	 */
	public function list_delete_callback( \WP_REST_Request $request ) {
		// Retrieve and sanitize request parameters.
		$params = $request->get_params();
		$ids    = isset( $params['ids'] ) ? sanitize_text_field( $params['ids'] ) : '';
		$nonce  = isset( $params['wpnonce'] ) ? sanitize_text_field( $params['wpnonce'] ) : '';

		if ( ! $nonce || ! wp_verify_nonce( $nonce, 'fbnd-nonce' ) ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => __( 'Invalid or missing nonce.', 'fast-bundle' ),
				),
				403
			);
		}

		if ( empty( $ids ) ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => __( 'No IDs provided.', 'fast-bundle' ),
				),
				400
			);
		}

		// Convert IDs to an array and delete each post.
		$gallery_image_data = get_option( 'fbnd_product_image_update_data', array() );
		$ids_array          = explode( ',', $ids );
		foreach ( $ids_array as $id ) {
			$id = (int) $id; // Ensure ID is an integer.

			if ( isset( $gallery_image_data[ $id ] ) ) {
				unset( $gallery_image_data[ $id ] );
			}

			/**
			 * Fires before deleting a post with a specific ID.
			 *
			 * @param int $id The ID of the post to be deleted.
			 */
			do_action( 'fbnd_delete_option_product_meta', $id );

			wp_delete_post( $id, true );
		}

		update_option( 'fbnd_product_image_update_data', $gallery_image_data );

		return new WP_REST_Response(
			array(
				'success' => true,
				'message' => __( 'Items deleted successfully.', 'fast-bundle' ),
			),
			200
		);
	}


	/**
	 * Duplicates an option based on the provided ID.
	 *
	 * @since 1.0.0
	 *
	 * @param \WP_REST_Request $request The REST API request object.
	 * @return WP_REST_Response Response indicating success or failure of the duplication.
	 */
	public function list_duplicate_callback( \WP_REST_Request $request ) {
		// Retrieve and sanitize the request parameter.
		$params  = $request->get_params();
		$id      = isset( $params['id'] ) ? sanitize_text_field( $params['id'] ) : '';
		$content = isset( $params['content'] ) && is_array( $params['content'] ) ? fast_bundle()->sanitize_rest_params( $params['content'] ) : array();
		$nonce   = isset( $params['wpnonce'] ) ? sanitize_text_field( $params['wpnonce'] ) : '';

		if ( ! $nonce || ! wp_verify_nonce( $nonce, 'fbnd-nonce' ) ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => __( 'Invalid or missing nonce.', 'fast-bundle' ),
				),
				403
			);
		}

		if ( empty( $id ) ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => __( 'No ID provided.', 'fast-bundle' ),
				),
				400
			);
		}

		// Retrieve the post object and proceed with duplication.
		$post = get_post( $id );
		if ( ! $post ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => __( 'Post not found.', 'fast-bundle' ),
				),
				404
			);
		}

		// Set up the arguments for duplicating the post.
		$args = array(
			'post_author'  => $post->post_author,
			'post_content' => $post->post_content,
			'post_name'    => $post->post_name,
			'post_status'  => 'draft',
			'post_title'   => $post->post_title . ' Copy',
			'post_type'    => $post->post_type,
		);

		// Insert the new post (duplicate).
		$new_id = wp_insert_post( $args );

		if ( is_wp_error( $new_id ) ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => sprintf(
						/* translators: %1s - Post Id */
						__( 'Failed to duplicate post ID: %s.', 'fast-bundle' ),
						$id
					),
				),
				400
			);
		}

		// Copy the custom meta data.
		update_option( 'fbnd_first_option_created', 'yes' );
		$blocks = $content ? $content : get_post_meta( $id, 'fbnd_addons_blocks', true );
		update_post_meta( $new_id, 'fbnd_addons_blocks', $blocks );

		// Return success response.
		return new WP_REST_Response(
			array(
				'success' => true,
				'message' => __( 'Item duplicated successfully.', 'fast-bundle' ),
				'new_id'  => $new_id,
			),
			200
		);
	}
	/**
	 * Import List
	 *
	 * @since 1.0.0
	 *
	 * @param \WP_REST_Request $request The REST API request object.
	 * @return WP_REST_Response Response indicating success or failure of the duplication.
	 */
	public function list_import_callback( \WP_REST_Request $request ) {
		$params  = $request->get_params();
		$title   = isset( $params['title'] ) ? sanitize_text_field( $params['title'] ) : '';
		$content = isset( $params['content'] ) && is_array( $params['content'] ) ? fast_bundle()->sanitize_rest_params( $params['content'] ) : array();
		$nonce   = isset( $params['wpnonce'] ) ? sanitize_text_field( $params['wpnonce'] ) : '';

		if ( ! $nonce || ! wp_verify_nonce( $nonce, 'fbnd-nonce' ) ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => __( 'Invalid or missing nonce.', 'fast-bundle' ),
				),
				403
			);
		}

		$args = array(
			'post_status' => 'draft',
			'post_title'  => $title . ' Imported',
			'post_type'   => 'fbnd_option',
		);

		$new_id = wp_insert_post( $args );
		update_option( 'fbnd_first_option_created', 'yes' );
		update_post_meta( $new_id, 'fbnd_addons_blocks', $content );

		return new WP_REST_Response(
			array(
				'success' => true,
				'message' => __( 'Imported successfully.', 'fast-bundle' ),
				'new_id'  => $new_id,
			),
			200
		);
	}

	/**
	 * Retrieves a list of options with search and pagination functionality.
	 *
	 * @since 1.0.0
	 *
	 * @param \WP_REST_Request $request The REST API request object.
	 * @return WP_REST_Response Response containing the list of options and pagination info.
	 */
	public function option_listing_callback( \WP_REST_Request $request ) {
		$params     = $request->get_params();
		$search     = isset( $params['search'] ) ? sanitize_text_field( $params['search'] ) : '';
		$paged      = isset( $params['page'] ) ? sanitize_text_field( $params['page'] ) : 1;
		$per_page   = isset( $params['per_page'] ) ? sanitize_text_field( $params['per_page'] ) : 3;
		$order      = isset( $params['order'] ) ? sanitize_text_field( $params['order'] ) : 'DESC';
		$product_id = isset( $params['product_id'] ) ? absint( $params['product_id'] ) : 0;
		$nonce      = isset( $params['wpnonce'] ) ? sanitize_text_field( $params['wpnonce'] ) : '';

		if ( ! $nonce || ! wp_verify_nonce( $nonce, 'fbnd-nonce' ) ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => __( 'Invalid or missing nonce.', 'fast-bundle' ),
				),
				403
			);
		}

		$args = array(
			'post_type'      => 'fbnd_option',
			'posts_per_page' => $per_page,
			'order'          => $order,
			'orderby'        => 'ID',
			'post_status'    => array( 'publish', 'draft' ),
			'paged'          => $paged,
		);

		if ( $product_id ) {
			$args['post__in'] = fast_bundle()->get_product_option_ids( $product_id );
			$args['post__in'] = ! empty( $args['post__in'] ) ? $args['post__in'] : array( 0 );
		}

		$id_search_filter = null;

		if ( ! empty( $search ) ) {
			if ( ctype_digit( $search ) ) {
				$id_search_filter = function ( $where ) use ( $search ) {
					global $wpdb;
					return $where . $wpdb->prepare( " AND {$wpdb->posts}.ID LIKE %s", '%' . $wpdb->esc_like( $search ) . '%' );
				};
				add_filter( 'posts_where', $id_search_filter );
			} else {
				$args['s'] = $search;
			}
		}

		$query = new \WP_Query( $args );

		if ( $id_search_filter ) {
			remove_filter( 'posts_where', $id_search_filter );
		}
		$data       = array();
		$all_blocks = array();
		$page_num   = 0;

		if ( $query->have_posts() ) {
			while ( $query->have_posts() ) {
				$query->the_post();
				$id                = get_the_ID();
				$blocks            = get_post_meta( $id, 'fbnd_addons_blocks', true );
				$all_blocks[ $id ] = $blocks;
				$option_type       = get_post_meta( $id, 'fbnd_option_type', true ) ?: 'custom';
				$options_count     = 'fixed_bundle' === $option_type
					? count( is_array( $blocks ) && isset( $blocks['items'] ) && is_array( $blocks['items'] ) ? $blocks['items'] : array() )
					: ( is_string( $blocks ) ? substr_count( $blocks, 'blockid' ) : substr_count( wp_json_encode( $blocks ), 'blockid' ) );
				$data[]            = array(
					'id'       => $id,
					'title'    => get_the_title(),
					'status'   => get_post_status() === 'publish',
					'type'     => $option_type,
					'options'  => $options_count,
					'assigned' => fast_bundle()->get_assigned_product_data( $id ),
				);
			}
			$page_num = $query->max_num_pages;

			wp_reset_postdata();
		}

		return new WP_REST_Response(
			array(
				'success'    => true,
				'page'       => $page_num,
				'posts'      => $data,
				'all_blocks' => $all_blocks,
			),
			200
		);
	}

	/**
	 * Searches for products or categories based on the provided keyword and trigger type.
	 *
	 * @since 1.0.0
	 *
	 * @param \WP_REST_Request $request The REST API request object.
	 * @return WP_REST_Response Response containing the search results.
	 */
	public function assign_search_callback( \WP_REST_Request $request ) {
		$params           = $request->get_params();
		$trigger_type     = isset( $params['type'] ) ? sanitize_text_field( $params['type'] ) : 'products';
		$search_keyword   = isset( $params['term'] ) ? sanitize_text_field( $params['term'] ) : '';
		$limit            = isset( $params['limit'] ) ? absint( $params['limit'] ) : 60;
		$tax_type         = isset( $params['tax_type'] ) ? sanitize_text_field( $params['tax_type'] ) : '';
		$tax_term_ids_raw = isset( $params['tax_term_ids'] ) && is_array( $params['tax_term_ids'] ) ? $params['tax_term_ids'] : array();
		$tax_term_ids     = array_map( 'absint', $tax_term_ids_raw );
		$taxonomy_map     = array(
			'cat'   => 'product_cat',
			'tag'   => 'product_tag',
			'brand' => 'product_brand',
		);

		$response_data = array();
		switch ( $trigger_type ) {
			case 'products':
				$tax_filter = array();
				if ( $tax_term_ids && isset( $taxonomy_map[ $tax_type ] ) ) {
					$tax_filter = array(
						'taxonomy' => $taxonomy_map[ $tax_type ],
						'term_ids' => $tax_term_ids,
					);
				}
				$response_data = fast_bundle()->get_searched_products( $search_keyword, false, $limit, array(), $tax_filter );
				break;
			case 'cat':
			case 'tag':
			case 'brand':
				$response_data = fast_bundle()->get_searched_categories(
					array(
						'term'         => $search_keyword,
						'limit'        => $limit,
						'includes'     => '',
						'trigger_type' => $trigger_type,
					)
				);
				break;
			default:
				break;
		}

		return new WP_REST_Response(
			array(
				'success' => true,
				'data'    => $response_data,
			),
			200
		);
	}

	/**
	 * Searches for products or categories based on the provided keyword and trigger type.
	 *
	 * @since 1.0.3
	 *
	 * @param \WP_REST_Request $request The REST API request object.
	 * @return WP_REST_Response Response containing the search results.
	 */
	public function get_product_search_callback( \WP_REST_Request $request ) {
		$params         = $request->get_params();
		$search_keyword = isset( $params['term'] ) ? sanitize_text_field( $params['term'] ) : '';
		$limit          = isset( $params['limit'] ) ? absint( $params['limit'] ) : 5;
		$exclude_ids    = isset( $params['excludes'] ) ? $params['excludes'] : array();

		// Load the product data store.
		$data_store = WC_Data_Store::load( 'product' );

		$include_ids = array();
		$limit       = '5';
		$ids         = $data_store->search_products( $search_keyword, '', false, false, $limit, $include_ids, $exclude_ids );
		$products    = array();

		foreach ( $ids as $product_id ) {
			$product = wc_get_product( $product_id );

			if ( $product ) {
				$datas = array(
					'id'         => $product_id,
					'url'        => get_permalink( $product_id ),
					'value'      => rawurldecode( wp_strip_all_tags( $product->get_name() ) ),
					'img'        => wp_get_attachment_url( $product->get_image_id() ),
					'isVariable' => $product->is_type( 'variable' ),
				);

				if ( $product->is_type( 'variable' ) ) {
					$available_variations = $product->get_available_variations();
					$variations_data      = array();

					foreach ( $available_variations as $variation_data ) {
						$variation_id = $variation_data['variation_id'];
						$variation    = wc_get_product( $variation_id );

						if ( $variation && $variation->is_purchasable() && $variation->is_in_stock() ) {
							$variation_formatted = wc_get_formatted_variation( $variation, true, false, true );
							$variations_data[]   = array(
								'id'         => $variation_id,
								'url'        => get_permalink( $variation_id ),
								'value'      => rawurldecode( wp_strip_all_tags( $variation_formatted ? $variation->get_name() . ' - ' . $variation_formatted : $variation->get_name() ) ),
								'img'        => wp_get_attachment_url( $variation->get_image_id() ),
								'attributes' => wc_get_product_variation_attributes( $variation_id ),
								'regular'    => $variation->get_regular_price( 'edit' ),
								'sale'       => $variation->get_sale_price( 'edit' ),
							);
						}
					}
					$datas['variation'] = $variations_data;
				}
				$products[] = $datas;
			}
		}

		return $products;
	}

	/**
	 * Get product link callback - Returns the first available product link based on assignment data.
	 *
	 * @param \WP_REST_Request $request The REST API request object.
	 * @return \WP_REST_Response Response containing product link and success status.
	 */
	public function get_product_link_callback( \WP_REST_Request $request ) {
		$params        = $request->get_params();
		$assigned_data = isset( $params['assignedData'] ) && is_array( $params['assignedData'] ) ? fast_bundle()->sanitize_rest_params( $params['assignedData'] ) : array();
		$option_id     = isset( $params['optionId'] ) ? sanitize_text_field( $params['optionId'] ) : '';

		// Validate assigned data.
		if ( empty( $assigned_data ) || ! isset( $assigned_data['aType'] ) ) {
			return new WP_REST_Response(
				array(
					'success'   => false,
					'published' => false,
					'message'   => __( 'Invalid assigned data.', 'fast-bundle' ),
				),
				400
			);
		}
		$is_published = false;
		if ( $option_id && 'new' !== $option_id ) {
			$is_published = 'publish' === get_post_status( $option_id );
		}

		$assign_type = $assigned_data['aType'];

		$product_details = array(
			'product_link'     => '',
			'product_thumnail' => '',
		);
		if ( 'specific_product' !== $assign_type && $is_published ) {
			$product_details = $this->get_first_product_link( $assigned_data );
		}

		return new WP_REST_Response(
			array(
				'success'          => true,
				'published'        => $is_published,
				'productLink'      => $product_details['product_link'],
				'productThumbnail' => $product_details['product_thumnail'],
			),
			200
		);
	}

	/**
	 * Get the first available product link based on assignment type.
	 *
	 * @param array $assigned_data Assignment data containing type and includes/excludes.
	 * @return array Array with 'product_link' and 'product_thumnail' keys (empty strings if no product found).
	 */
	private function get_first_product_link( $assigned_data ) {
		$exclude_ids = $this->parse_exclude_ids( $assigned_data );

		switch ( $assigned_data['aType'] ) {
			case 'all_product':
				return $this->get_first_simple_product_link( $exclude_ids );
			case 'specific_category':
			case 'specific_tag':
			case 'specific_brand':
				return $this->get_first_taxonomy_product_link( $assigned_data, $exclude_ids );

			default:
				return array(
					'product_link'     => '',
					'product_thumnail' => '',
				);
		}
	}

	/**
	 * Build the product_link/product_thumnail pair for a published, non-variation product.
	 *
	 * @param int $product_id Product ID.
	 * @return array Array with 'product_link' and 'product_thumnail' keys, both empty
	 *               strings when the product does not qualify.
	 */
	private function get_product_link_and_thumbnail( $product_id ) {
		$product = wc_get_product( $product_id );
		if ( ! $product || $product->get_type() === 'variation' || $product->get_status() !== 'publish' ) {
			return array(
				'product_link'     => '',
				'product_thumnail' => '',
			);
		}

		return array(
			'product_link'     => get_permalink( $product_id ),
			'product_thumnail' => wp_get_attachment_url( $product->get_image_id() ),
		);
	}

	/**
	 * Parse exclude IDs from assigned data, handling both new object format and legacy format.
	 *
	 * @param array $assigned_data Assignment data.
	 * @return array Array of exclude product IDs.
	 */
	private function parse_exclude_ids( $assigned_data ) {
		$exclude_ids = array();

		if ( empty( $assigned_data['excludes'] ) || ! is_array( $assigned_data['excludes'] ) ) {
			return $exclude_ids;
		}

		foreach ( $assigned_data['excludes'] as $exclude_item ) {
			if ( is_array( $exclude_item ) && isset( $exclude_item['item_id'] ) ) {
				$exclude_ids[] = absint( $exclude_item['item_id'] );
			} elseif ( is_numeric( $exclude_item ) ) {
				// Fallback for legacy format.
				$exclude_ids[] = absint( $exclude_item );
			}
		}

		return array_filter( $exclude_ids );
	}

	/**
	 * Get the first simple product's link/thumbnail, excluding specified products.
	 *
	 * @param array $exclude_ids Product IDs to exclude.
	 * @return array Array with 'product_link' and 'product_thumnail' keys (empty strings if no product found).
	 */
	private function get_first_simple_product_link( $exclude_ids ) {
		$data_store  = WC_Data_Store::load( 'product' );
		$product_ids = $data_store->search_products( '', '', true, false, 99, array(), $exclude_ids );

		foreach ( $product_ids as $product_id ) {
			$details = $this->get_product_link_and_thumbnail( $product_id );
			if ( $details['product_link'] ) {
				return $details;
			}
		}

		return array(
			'product_link'     => '',
			'product_thumnail' => '',
		);
	}

	/**
	 * Get the first product's link/thumbnail from taxonomy terms.
	 *
	 * @param array $assigned_data Assignment data.
	 * @param array $exclude_ids   Product IDs to exclude.
	 * @return array Array with 'product_link' and 'product_thumnail' keys (empty strings if no product found).
	 */
	private function get_first_taxonomy_product_link( $assigned_data, $exclude_ids ) {
		$empty = array(
			'product_link'     => '',
			'product_thumnail' => '',
		);

		if ( empty( $assigned_data['includes'] ) || ! is_array( $assigned_data['includes'] ) ) {
			return $empty;
		}

		$taxonomy_map = array(
			'specific_category' => 'product_cat',
			'specific_tag'      => 'product_tag',
			'specific_brand'    => 'product_brand',
		);

		$taxonomy = $taxonomy_map[ $assigned_data['aType'] ] ?? '';
		if ( ! $taxonomy ) {
			return $empty;
		}

		// Parse term IDs and get products in one optimized flow.
		$all_product_ids = array();

		foreach ( $assigned_data['includes'] as $include_item ) {
			$term_id = 0;
			if ( is_array( $include_item ) && isset( $include_item['item_id'] ) ) {
				$term_id = absint( $include_item['item_id'] );
			} elseif ( is_numeric( $include_item ) ) {
				$term_id = absint( $include_item );
			}

			if ( $term_id ) {
				$term_products = get_objects_in_term( $term_id, $taxonomy );
				if ( ! empty( $term_products ) ) {
					$all_product_ids = array_merge( $all_product_ids, $term_products );
				}
			}
		}

		// Process and find first valid product.
		if ( ! empty( $all_product_ids ) ) {
			$unique_products   = array_unique( array_map( 'absint', $all_product_ids ) );
			$filtered_products = ! empty( $exclude_ids ) ? array_diff( $unique_products, $exclude_ids ) : $unique_products;

			foreach ( $filtered_products as $product_id ) {
				$details = $this->get_product_link_and_thumbnail( $product_id );
				if ( $details['product_link'] ) {
					return $details;
				}
			}
		}

		return $empty;
	}

	/**
	 * Searches for products or categories based on the provided keyword and trigger type.
	 *
	 * @since 1.0.3
	 *
	 * @param \WP_REST_Request $request The REST API request object.
	 * @return WP_REST_Response Response containing the search results.
	 */
	public function get_products_details_callback( \WP_REST_Request $request ) {
		$params = $request->get_params();
		$items  = isset( $params['items'] ) && is_array( $params['items'] ) ? $params['items'] : array();
		$output = array();

		foreach ( $items as $item ) {
			$product_id = isset( $item['id'] ) ? absint( $item['id'] ) : 0;

			if ( ! $product_id ) {
				continue;
			}

			$product = wc_get_product( $product_id );

			if ( ! $product ) {
				continue;
			}

			$formatted_variation = $product->is_type( 'variable' ) ? '' : wc_get_formatted_variation( $product, true, false, true );
			$product_value       = $product->get_name() . ( $formatted_variation ? ' - ' . $formatted_variation : '' );

			$data = array(
				'id'       => $product_id,
				'editLink' => html_entity_decode( get_edit_post_link( $product_id ) ),
				'url'      => get_permalink( $product_id ),
				'value'    => rawurldecode( wp_strip_all_tags( $product_value ) ),
				'img'      => wp_get_attachment_url( $product->get_image_id() ),
				'regular'  => $product->get_regular_price( 'edit' ),
				'sale'     => $product->get_sale_price( 'edit' ),
			);

			if ( $product->is_type( 'variable' ) ) {
				$variation_ids_input  = isset( $item['variation'] ) && is_array( $item['variation'] ) ? array_map( 'absint', $item['variation'] ) : array();
				$available_variations = $product->get_available_variations();
				$variations_data      = array();

				foreach ( $available_variations as $variation_data ) {
					$variation_id = $variation_data['variation_id'];
					$variation    = wc_get_product( $variation_id );

					if ( $variation && $variation->is_purchasable() && $variation->is_in_stock() ) {
						$variation_formatted = wc_get_formatted_variation( $variation, true, false, true );
						$variations_data[]   = array(
							'id'         => $variation_id,
							'url'        => get_permalink( $variation_id ),
							'value'      => rawurldecode( wp_strip_all_tags( $variation_formatted ? $variation->get_name() . ' - ' . $variation_formatted : $variation->get_name() ) ),
							'img'        => wp_get_attachment_url( $variation->get_image_id() ),
							'attributes' => wc_get_product_variation_attributes( $variation_id ),
							'regular'    => $variation->get_regular_price( 'edit' ),
							'sale'       => $variation->get_sale_price( 'edit' ),
							'enable'     => in_array( $variation_id, $variation_ids_input ),
						);
					}
				}
				$data['variation'] = $variations_data;
			}

			$output[] = $data;
		}

		return $output;
	}

	/**
	 * Retrieves assigned product data based on the provided option ID.
	 *
	 * @since 1.0.0
	 *
	 * @param \WP_REST_Request $request The REST request object containing the option ID.
	 *
	 * @return \WP_REST_Response The REST response containing the assigned data or an error message.
	 */
	public function get_assign_product_callback( \WP_REST_Request $request ) {
		$request_params = $request->get_params();
		$option_id      = ! empty( $request_params['option_id'] ) ? sanitize_text_field( $request_params['option_id'] ) : '';

		if ( $option_id ) {
			return new WP_REST_Response(
				array(
					'success'  => true,
					'assigned' => fast_bundle()->get_assigned_product_data( $option_id ),
				),
				200
			);
		}

		// If option_id is missing, return a message indicating the issue.
		return new WP_REST_Response(
			array(
				'success' => false,
				'message' => 'Option ID Missing',
			),
			400
		);
	}


	/**
	 * Set assigned product data for a given option.
	 *
	 * @since 1.0.0
	 *
	 * @param \WP_REST_Request $request The REST request object containing the option ID and assignment data.
	 *
	 * @return \WP_REST_Response The REST response containing the success message or an error response.
	 */
	public function set_assign_product_callback( \WP_REST_Request $request ) {
		$params        = $request->get_params();
		$option_id     = ! empty( $params['option_id'] ) ? sanitize_text_field( $params['option_id'] ) : '';
		$product_image = ! empty( $params['product_image'] ) ? fast_bundle()->sanitize_rest_params( $params['product_image'] ) : array();
		$nonce         = isset( $params['wpnonce'] ) ? sanitize_text_field( $params['wpnonce'] ) : '';

		if ( ! $nonce || ! wp_verify_nonce( $nonce, 'fbnd-nonce' ) ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => __( 'Invalid or missing nonce.', 'fast-bundle' ),
				),
				403
			);
		}

		if ( empty( $option_id ) ) {
			return new WP_REST_Response(
				array(
					'success'  => false,
					'response' => array(
						'message' => __( 'No ID found', 'fast-bundle' ),
					),
				),
				400
			);
		}

		$new_image_data               = get_option( 'fbnd_product_image_update_data', array() );
		$new_image_data[ $option_id ] = $product_image;
		update_option( 'fbnd_product_image_update_data', $new_image_data );

		$raw_data = isset( $params['raw_data'] ) ? fast_bundle()->sanitize_rest_params( $params['raw_data'] ) : array();

		/* First Remove existing assign include / excludes meta */
		$this->handle_existing_assign_meta( $option_id );

		// Update Option Data Both Option Data and Product/Term Data.
		if ( 'specific_product' === $raw_data['aType'] ) {  // Update meta for Specific Product.
			if ( is_array( $raw_data['includes'] ) && ! empty( $raw_data['includes'] ) ) {
				foreach ( $raw_data['includes'] as $include ) {
					$meta_inc = json_decode( fast_bundle()->safe_stripslashes( get_post_meta( $include, 'fbnd_product_assigned_meta_inc', true ) ), true );
					$meta_inc = is_array( $meta_inc ) ? $meta_inc : array();

					if ( ! in_array( $option_id, $meta_inc, false ) ) {
						$meta_inc[] = $option_id;
					}
					update_post_meta( $include, 'fbnd_product_assigned_meta_inc', wp_json_encode( $meta_inc ) );
				}
			}
		} elseif ( 'specific_category' === $raw_data['aType'] || 'specific_tag' === $raw_data['aType'] || 'specific_brand' === $raw_data['aType'] ) {  /* Update meta for Terms */
			if ( is_array( $raw_data['includes'] ) && ! empty( $raw_data['includes'] ) ) {
				foreach ( $raw_data['includes'] as $include ) {
					$meta_inc = json_decode( fast_bundle()->safe_stripslashes( get_term_meta( $include, 'fbnd_term_assigned_meta_inc', true ) ), true );
					$meta_inc = is_array( $meta_inc ) ? $meta_inc : array();

					if ( ! in_array( $option_id, $meta_inc, false ) ) {
						$meta_inc[] = $option_id;
					}
					update_term_meta( $include, 'fbnd_term_assigned_meta_inc', wp_json_encode( $meta_inc ) );
				}
			}
		} elseif ( 'all_product' === $raw_data['aType'] ) {        // Update meta for All Products.
			$option_settings = json_decode( fast_bundle()->safe_stripslashes( get_option( 'fbnd_option_assign_all', '[]' ) ), true );
			$option_settings = is_array( $option_settings ) ? $option_settings : array();

			if ( ! in_array( $option_id, $option_settings, false ) ) {
				$option_settings[] = $option_id;
			}
			update_option( 'fbnd_option_assign_all', wp_json_encode( $option_settings ) );
		}

		// Update Meta for Excludes Products.
		if ( is_array( $raw_data['excludes'] ) && count( $raw_data['excludes'] ) > 0 ) {
			foreach ( $raw_data['excludes'] as $exclude ) {
				$meta_exc = json_decode( fast_bundle()->safe_stripslashes( get_post_meta( $exclude, 'fbnd_product_assigned_meta_exc', true ) ), true );
				$meta_exc = is_array( $meta_exc ) ? $meta_exc : array();

				if ( ! in_array( $option_id, $meta_exc, false ) ) {
					$meta_exc[] = $option_id;
				}
				update_post_meta( $exclude, 'fbnd_product_assigned_meta_exc', wp_json_encode( $meta_exc ) );
			}
		}

		// Update Meta for Exclude Categories.
		if ( isset( $raw_data['excludeCategories'] ) && is_array( $raw_data['excludeCategories'] ) && count( $raw_data['excludeCategories'] ) > 0 ) {
			foreach ( $raw_data['excludeCategories'] as $exclude_cat ) {
				$meta_exc_cat = json_decode( fast_bundle()->safe_stripslashes( get_term_meta( $exclude_cat, 'fbnd_term_assigned_meta_exc', true ) ), true );
				$meta_exc_cat = is_array( $meta_exc_cat ) ? $meta_exc_cat : array();

				if ( ! in_array( $option_id, $meta_exc_cat, false ) ) {
					$meta_exc_cat[] = $option_id;
				}
				update_term_meta( $exclude_cat, 'fbnd_term_assigned_meta_exc', wp_json_encode( $meta_exc_cat ) );
			}
		}

		// Update the option meta with the assigned data.
		update_post_meta( $option_id, 'fbnd_base_assigned_data', wp_json_encode( $raw_data ) );

		return new WP_REST_Response(
			array(
				'success'  => true,
				'response' => array(
					'product_image' => $product_image,
					'option_id'     => $option_id,
					'message'       => __( 'Option Assigned Updated successfully', 'fast-bundle' ),
					'newData'       => json_decode( fast_bundle()->safe_stripslashes( get_post_meta( $option_id, 'fbnd_base_assigned_data', true ) ), true ),
				),
			),
			200
		);
	}

	/**
	 * Handle Existing Assign Data
	 *
	 * @since 1.0.0
	 * @param int $option_id The ID of the option to retrieve assigned data for.
	 *
	 * @return void
	 */
	public function handle_existing_assign_meta( $option_id ) {
		$assigned_data = json_decode( fast_bundle()->safe_stripslashes( get_post_meta( $option_id, 'fbnd_base_assigned_data', true ) ), true );
		if ( isset( $assigned_data['aType'] ) && 'all_product' === $assigned_data['aType'] ) {
			$option_settings = json_decode( fast_bundle()->safe_stripslashes( get_option( 'fbnd_option_assign_all', '[]' ) ), true );
			$option_settings = is_array( $option_settings ) ? $option_settings : array();

			if ( in_array( $option_id, $option_settings, false ) ) {
				$option_settings = array_diff( $option_settings, array( $option_id ) );
			}
			update_option( 'fbnd_option_assign_all', wp_json_encode( $option_settings ) );
		} elseif ( isset( $assigned_data['aType'] ) && 'specific_product' === $assigned_data['aType'] ) {
			if ( is_array( $assigned_data['includes'] ) && ! empty( $assigned_data['includes'] ) ) {
				foreach ( $assigned_data['includes'] as $include ) {
					$meta_inc = json_decode( fast_bundle()->safe_stripslashes( get_post_meta( $include, 'fbnd_product_assigned_meta_inc', true ) ), true );
					$meta_inc = is_array( $meta_inc ) ? $meta_inc : array();

					if ( in_array( $option_id, $meta_inc, false ) ) {
						$meta_inc = array_diff( $meta_inc, array( $option_id ) );
					}
					update_post_meta( $include, 'fbnd_product_assigned_meta_inc', wp_json_encode( $meta_inc ) );
				}
			}
		} elseif ( isset( $assigned_data['aType'] ) && ( 'specific_category' === $assigned_data['aType'] || 'specific_tag' === $assigned_data['aType'] || 'specific_brand' === $assigned_data['aType'] ) ) {
			if ( is_array( $assigned_data['includes'] ) && ! empty( $assigned_data['includes'] ) ) {
				foreach ( $assigned_data['includes'] as $include ) {
					$meta_inc = json_decode( fast_bundle()->safe_stripslashes( get_term_meta( $include, 'fbnd_term_assigned_meta_inc', true ) ), true );
					$meta_inc = is_array( $meta_inc ) ? $meta_inc : array();

					if ( in_array( $option_id, $meta_inc, false ) ) {
						$meta_inc = array_diff( $meta_inc, array( $option_id ) );
					}
					update_term_meta( $include, 'fbnd_term_assigned_meta_inc', wp_json_encode( $meta_inc ) );
				}
			}
		}
		if ( isset( $assigned_data['excludes'] ) && is_array( $assigned_data['excludes'] ) && count( $assigned_data['excludes'] ) > 0 ) {
			foreach ( $assigned_data['excludes'] as $exclude ) {
				$meta_exc = json_decode( fast_bundle()->safe_stripslashes( get_post_meta( $exclude, 'fbnd_product_assigned_meta_exc', true ) ), true );
				$meta_exc = is_array( $meta_exc ) ? $meta_exc : array();

				if ( in_array( $option_id, $meta_exc, false ) ) {
					$meta_exc = array_diff( $meta_exc, array( $option_id ) );
				}
				update_post_meta( $exclude, 'fbnd_product_assigned_meta_exc', wp_json_encode( $meta_exc ) );
			}
		}
		if ( isset( $assigned_data['excludeCategories'] ) && is_array( $assigned_data['excludeCategories'] ) && count( $assigned_data['excludeCategories'] ) > 0 ) {
			foreach ( $assigned_data['excludeCategories'] as $exclude_cat ) {
				$meta_exc_cat = json_decode( fast_bundle()->safe_stripslashes( get_term_meta( $exclude_cat, 'fbnd_term_assigned_meta_exc', true ) ), true );
				$meta_exc_cat = is_array( $meta_exc_cat ) ? $meta_exc_cat : array();

				if ( in_array( $option_id, $meta_exc_cat, false ) ) {
					$meta_exc_cat = array_diff( $meta_exc_cat, array( $option_id ) );
				}
				update_term_meta( $exclude_cat, 'fbnd_term_assigned_meta_exc', wp_json_encode( $meta_exc_cat ) );
			}
		}
	}

	/**
	 * Save the Live Personalizer "Preview settings" (surface + show-on-page rule)
	 * for one option set.
	 *
	 * Mirrors `set_assign_product_callback` — stores into post meta on the
	 * option post, keyed so `Personalizer::get_canvas_config()` picks it up
	 * unchanged (that method already reads `fbnd_personalizer_canvas`).
	 *
	 * @since 1.8.0
	 *
	 * @param \WP_REST_Request $request The REST request object.
	 * @return \WP_REST_Response The REST response with success or error message.
	 */
	public function set_canvas_callback( \WP_REST_Request $request ) {
		$params    = $request->get_params();
		$option_id = ! empty( $params['option_id'] ) ? sanitize_text_field( $params['option_id'] ) : '';
		$nonce     = isset( $params['wpnonce'] ) ? sanitize_text_field( $params['wpnonce'] ) : '';

		$canvas = isset( $params['canvas'] ) ? $params['canvas'] : array();
		// A JSON request body decodes `canvas` to a nested array already, but a
		// form-encoded request (or a proxy that flattens the body) can hand it
		// over as a JSON string instead — decode that case too rather than
		// silently discarding the merchant's choice.
		if ( is_string( $canvas ) && '' !== $canvas ) {
			$decoded_canvas = json_decode( $canvas, true );
			$canvas         = is_array( $decoded_canvas ) ? $decoded_canvas : array();
		}
		if ( ! is_array( $canvas ) ) {
			$canvas = array();
		}

		if ( ! $nonce || ! wp_verify_nonce( $nonce, 'fbnd-nonce' ) ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => __( 'Invalid or missing nonce.', 'fast-bundle' ),
				),
				403
			);
		}

		if ( empty( $option_id ) || 'new' === $option_id ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => __( 'No ID found', 'fast-bundle' ),
				),
				400
			);
		}

		$sanitized = $this->sanitize_canvas_settings( $canvas );

		update_post_meta( $option_id, 'fbnd_personalizer_canvas', wp_json_encode( $sanitized ) );

		return new WP_REST_Response(
			array(
				'success' => true,
				'message' => __( 'Preview settings saved successfully.', 'fast-bundle' ),
				'canvas'  => $sanitized,
			),
			200
		);
	}

	/**
	 * Sanitize a Live Personalizer canvas settings payload before it is stored.
	 *
	 * Keeps only the keys `Personalizer::get_canvas_config()` understands, so an
	 * unexpected/legacy shape from the client cannot write arbitrary meta.
	 *
	 * @since 1.8.0
	 *
	 * @param array $canvas Raw canvas settings from the request.
	 * @return array Sanitized canvas settings.
	 */
	private function sanitize_canvas_settings( array $canvas ) {
		$scenes_in = isset( $canvas['scenes'] ) && is_array( $canvas['scenes'] ) ? $canvas['scenes'] : array();
		$scene_in  = isset( $scenes_in[0] ) && is_array( $scenes_in[0] ) ? $scenes_in[0] : array();
		$bg_in     = isset( $scene_in['background'] ) && is_array( $scene_in['background'] ) ? $scene_in['background'] : array();

		$type = isset( $bg_in['type'] ) ? sanitize_text_field( $bg_in['type'] ) : 'product_image';
		if ( ! in_array( $type, array( 'product_image', 'custom', 'blank' ), true ) ) {
			$type = 'product_image';
		}

		$apply_to = isset( $bg_in['applyTo'] ) ? sanitize_text_field( $bg_in['applyTo'] ) : 'all';
		if ( ! in_array( $apply_to, array( 'all', 'first', 'last', 'specific' ), true ) ) {
			$apply_to = 'all';
		}

		$background = array(
			'type'    => $type,
			'applyTo' => $apply_to,
		);

		if ( 'custom' === $type ) {
			$background['customUrl'] = isset( $bg_in['customUrl'] ) ? esc_url_raw( $bg_in['customUrl'] ) : '';
			$background['customId']  = isset( $bg_in['customId'] ) ? absint( $bg_in['customId'] ) : 0;
		}

		if ( 'specific' === $apply_to ) {
			$background['specificImageIndex'] = isset( $bg_in['specificImageIndex'] ) ? max( 1, absint( $bg_in['specificImageIndex'] ) ) : 1;
		}

		$export_in = isset( $canvas['export'] ) && is_array( $canvas['export'] ) ? $canvas['export'] : array();

		return array(
			'enabled' => ! isset( $canvas['enabled'] ) || rest_sanitize_boolean( $canvas['enabled'] ),
			'scenes'  => array(
				array(
					'id'         => isset( $scene_in['id'] ) ? sanitize_text_field( $scene_in['id'] ) : 'default',
					'background' => $background,
				),
			),
			'export'  => array(
				'pixelRatio'     => isset( $export_in['pixelRatio'] ) ? absint( $export_in['pixelRatio'] ) : 2,
				'productionFile' => isset( $export_in['productionFile'] ) && rest_sanitize_boolean( $export_in['productionFile'] ),
			),
		);
	}

	/**
	 * Get global data.
	 *
	 * @since 1.0.0
	 *
	 * @return \WP_REST_Response The REST response containing the global data.
	 */
	public function get_global_callback() {
		return new WP_REST_Response(
			array(
				'success'  => true,
				'response' => array(
					'globalStyle'   => get_option( 'fbnd_global_style', '' ),
					'thematicStyle' => get_option( 'fbnd_global_style_thematic', '' ),
				),
			),
			200
		);
	}
	/**
	 * Set global data.
	 *
	 * @since 1.0.0
	 *
	 * @param \WP_REST_Request $request The request object containing the data.
	 *
	 * @return \WP_REST_Response The REST response with success or error message.
	 */
	public function set_global_callback( \WP_REST_Request $request ) {
		$request_params = $request->get_params();
		$style          = isset( $request_params['style'] ) ? fast_bundle()->sanitize_rest_params( $request_params['style'] ) : '';
		$css            = isset( $request_params['css'] ) ? sanitize_textarea_field( $request_params['css'] ) : '';
		$is_themetic    = isset( $request_params['isThemetic'] ) ? sanitize_textarea_field( $request_params['isThemetic'] ) : 'no';
		$nonce          = isset( $request_params['wpnonce'] ) ? sanitize_text_field( $request_params['wpnonce'] ) : '';

		if ( ! $nonce || ! wp_verify_nonce( $nonce, 'fbnd-nonce' ) ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => __( 'Invalid or missing nonce.', 'fast-bundle' ),
				),
				403
			);
		}

		if ( 'yes' === $is_themetic ) {
			if ( $style ) {
				update_option( 'fbnd_global_style_thematic', $style );
			}
			if ( $css ) {
				update_option( 'fbnd_global_style_thematic_css', $css );
			}
		} else {
			if ( $style ) {
				update_option( 'fbnd_global_style', $style );
			}
			if ( $css ) {
				update_option( 'fbnd_global_style_css', $css );
			}
		}

		return new WP_REST_Response(
			array(
				'success' => true,
				'message' => __( 'Style saved successfully.', 'fast-bundle' ),
			),
			200
		);
	}

	/**
	 * Get global data.
	 *
	 * @since 1.0.0
	 *
	 * @return \WP_REST_Response The REST response containing the global data.
	 */
	public function get_settings_callback() {
		return new WP_REST_Response(
			array(
				'success'  => true,
				'response' => get_option( 'fbnd_settings', '' ),
			),
			200
		);
	}
	/**
	 * Set global data.
	 *
	 * @since 1.0.0
	 *
	 * @param \WP_REST_Request $request The request object containing the data.
	 *
	 * @return \WP_REST_Response The REST response with success or error message.
	 */
	public function set_settings_callback( \WP_REST_Request $request ) {
		$request_params = $request->get_params();
		$settings       = isset( $request_params['settings'] ) ? fast_bundle()->sanitize_rest_params( $request_params['settings'] ) : '';
		$nonce          = isset( $request_params['wpnonce'] ) ? sanitize_text_field( $request_params['wpnonce'] ) : '';

		if ( ! $nonce || ! wp_verify_nonce( $nonce, 'fbnd-nonce' ) ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => __( 'Invalid or missing nonce.', 'fast-bundle' ),
				),
				403
			);
		}

		if ( $settings ) {
			update_option( 'fbnd_settings', $settings );
		}

		return new WP_REST_Response(
			array(
				'success' => true,
				'message' => __( 'Settings saved successfully.', 'fast-bundle' ),
			),
			200
		);
	}

	/**
	 * Upload image from URL and sideload it to the media library.
	 *
	 * @since 1.0.5
	 *
	 * @param \WP_REST_Request $request The request object containing the data.
	 *
	 * @return \WP_REST_Response The REST response with success or error message.
	 */
	public function sideload_image_callback( \WP_REST_Request $request ) {
		$request_params = $request->get_params();
		$nonce          = isset( $request_params['wpnonce'] ) ? sanitize_text_field( $request_params['wpnonce'] ) : '';

		if ( ! $nonce || ! wp_verify_nonce( $nonce, 'fbnd-nonce' ) ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => __( 'Invalid or missing nonce.', 'fast-bundle' ),
				),
				403
			);
		}

		$images = isset( $request_params['images'] ) && is_array( $request_params['images'] ) ? $request_params['images'] : array();

		if ( empty( $images ) ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => 'No images provided.',
				),
				400
			);
		}

		require_once ABSPATH . 'wp-admin/includes/media.php';
		require_once ABSPATH . 'wp-admin/includes/file.php';
		require_once ABSPATH . 'wp-admin/includes/image.php';

		$results = array();

		foreach ( $images as $raw_url => $raw_desc ) {
			$url = esc_url_raw( $raw_url );
			if ( ! $url ) {
				$results[ $raw_url ] = array( 'success' => false );
				continue;
			}

			$desc          = sanitize_text_field( $raw_desc );
			$attachment_id = media_sideload_image( $url, 0, $desc, 'id' );
			if ( is_wp_error( $attachment_id ) ) {
				$results[ $raw_url ] = array(
					'success' => false,
					'message' => $attachment_id->get_error_message(),
				);
			} else {
				$results[ $raw_url ] = array(
					'success'    => true,
					'source_url' => wp_get_attachment_url( $attachment_id ),
					'id'         => $attachment_id,
				);
			}
		}

		return new WP_REST_Response(
			array(
				'success' => true,
				'results' => $results,
			),
			200
		);
	}

	/**
	 * Product Image Compability
	 *
	 * @since 1.0.5
	 *
	 * @param \WP_REST_Request $request The request object containing the data.
	 *
	 * @return \WP_REST_Response The REST response with success or error message.
	 */
	public function product_image_callback( \WP_REST_Request $request ) {
		$request_params = $request->get_params();
		$product_data   = isset( $request_params['productData'] ) && is_array( $request_params['productData'] ) ? fast_bundle()->sanitize_rest_params( $request_params['productData'] ) : array();

		$to_return = array();
		if ( ! empty( $product_data ) && is_array( $product_data ) ) {
			foreach ( $product_data as $key => $value ) {
				$id                = function_exists( 'attachment_url_to_postid' ) && $value['src'] ? attachment_url_to_postid( $value['src'] ) : '';
				$to_return[ $key ] = $id;
			}
		}

		return new WP_REST_Response(
			array(
				'success'   => true,
				'message'   => $product_data,
				'to_return' => $to_return,
			),
			200
		);
	}

	/**
	 * Allowed file extensions and MIME types.
	 *
	 * @param array $mimes Existing allowed MIME types.
	 * @return array
	 */
	public function fbnd_handle_upload_field_mimes( $mimes ) {
		$fbnd_mimes = fast_bundle()->fbnd_get_upload_allowed_file_types( $this->extra_upload_field_mimes );

		return array_merge( $mimes, $fbnd_mimes );
	}

	/**
	 * Retrieve and validate uploaded file.
	 *
	 * @return array|WP_Error
	 */
	protected function get_uploaded_file() {

		// Nonce verification before processing form data.
		$nonce = isset( $_POST['fbndnonce'] ) ? sanitize_key( wp_unslash( $_POST['fbndnonce'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification
		if ( ! wp_verify_nonce( $nonce, 'fbnd-nonce' ) ) {
			return new \WP_Error( 'invalid_nonce', __( 'Invalid nonce.', 'fast-bundle' ) );
		}

		if ( empty( $_FILES['fbnd_file'] ) ||
			empty( $_FILES['fbnd_file']['name'] )
		) {
			return new \WP_Error( 'no_file', __( 'No file found.', 'fast-bundle' ) );
		}

		$file = $_FILES['fbnd_file']; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput

		$max_file_size = 25 * 1024 * 1024; // 25MB

		if ( (int) $file['size'] > $max_file_size ) {
			return new \WP_Error(
				'file_size',
				__( 'File size exceeds the maximum allowed limit (25MB).', 'fast-bundle' )
			);
		}
		if ( 'cdr' === strtolower( pathinfo( $file['name'], PATHINFO_EXTENSION ) ) ) {
			$finfo = finfo_open( FILEINFO_MIME_TYPE );
			$mime  = finfo_file( $finfo, $file['tmp_name'] );
			finfo_close( $finfo );

			if ( 'application/x-vnd.corel.zcf.draw.document+zip' === $mime ) {
				$this->extra_upload_field_mimes = array(
					'cdr' => 'application/x-vnd.corel.zcf.draw.document+zip',
				);
			}
		}

		add_filter( 'upload_mimes', array( $this, 'fbnd_handle_upload_field_mimes' ) );

		$allowed_types = fast_bundle()->fbnd_get_upload_allowed_file_types( $this->extra_upload_field_mimes );

		$filetype = wp_check_filetype_and_ext(
			$file['tmp_name'],
			$file['name'],
			$allowed_types
		);

		if ( empty( $filetype['ext'] ) || empty( $filetype['type'] ) ) {
			return new \WP_Error(
				'invalid_type',
				__( 'Invalid file type.', 'fast-bundle' )
			);
		}

		return $file;
	}


	/**
	 * Handles file uploads via REST API.
	 *
	 * @since 1.0.0
	 *
	 * @return WP_REST_Response Response indicating success or failure of the upload.
	 */
	public function upload_files_callback() {

		$nonce = isset( $_POST['fbndnonce'] ) ? sanitize_key( wp_unslash( $_POST['fbndnonce'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification
		if ( ! wp_verify_nonce( $nonce, 'fbnd-nonce' ) ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => __( 'Invalid nonce.', 'fast-bundle' ),
				),
				403
			);
		}

		if ( ! $this->fbnd_check_upload_rate_limit() ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => __( 'Upload limit exceeded. Please try again later.', 'fast-bundle' ),
				),
				429
			);
		}

		$file = $this->get_uploaded_file();

		if ( is_wp_error( $file ) ) {
			remove_filter( 'upload_mimes', array( $this, 'fbnd_handle_upload_field_mimes' ) );
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => $file->get_error_message(),
				),
				400
			);
		}

		if ( ! function_exists( 'wp_handle_upload' ) ) {
			require_once ABSPATH . 'wp-admin/includes/file.php';
		}

		// Validate and sanitize SVG content on the temp file before uploading.
		$filetype = wp_check_filetype( $file['name'] );
		if ( 'image/svg+xml' === $filetype['type'] ) {
			if ( ! $this->fbnd_sanitize_svg_file( $file['tmp_name'] ) ) {
				remove_filter( 'upload_mimes', array( $this, 'fbnd_handle_upload_field_mimes' ) );
				return new WP_REST_Response(
					array(
						'success' => false,
						'message' => __( 'SVG file could not be processed. Please check the file and try again.', 'fast-bundle' ),
					),
					400
				);
			}
		}

		add_filter( 'upload_dir', array( $this, 'fbnd_handle_upload_dir' ) );

		$uploaded = wp_handle_upload(
			$file,
			array(
				'test_form' => false,
			)
		);

		remove_filter( 'upload_dir', array( $this, 'fbnd_handle_upload_dir' ) );
		remove_filter( 'upload_mimes', array( $this, 'fbnd_handle_upload_field_mimes' ) );

		if ( isset( $uploaded['error'] ) ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => $uploaded['error'],
				),
				400
			);
		}

		$this->fbnd_ensure_upload_dir_security( dirname( $uploaded['file'] ) );

		return new WP_REST_Response(
			array(
				'success' => true,
				'data'    => array(
					'file' => $uploaded,
				),
			),
			200
		);
	}

	/**
	 * Handles the Live Personalizer mockup snapshot upload.
	 *
	 * The storefront canvas exports its own composite (background + every
	 * personalized layer) as a PNG at add-to-cart time; this stores it the same
	 * way an `upload` field's file is stored — same temp folder, same
	 * temp → order_placed → order_completed promotion lifecycle
	 * (fbnd_move_uploadblock_files) — so it needs no separate cleanup job.
	 *
	 * @since 1.7.2
	 *
	 * @return WP_REST_Response Response indicating success or failure of the upload.
	 */
	public function personalizer_mockup_upload_callback() {
		$nonce = isset( $_POST['fbndnonce'] ) ? sanitize_key( wp_unslash( $_POST['fbndnonce'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification
		if ( ! wp_verify_nonce( $nonce, 'fbnd-nonce' ) ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => __( 'Invalid nonce.', 'fast-bundle' ),
				),
				403
			);
		}

		if ( ! $this->fbnd_check_mockup_upload_rate_limit() ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => __( 'Upload limit exceeded. Please try again later.', 'fast-bundle' ),
				),
				429
			);
		}

		if ( empty( $_FILES['fbnd_mockup'] ) || empty( $_FILES['fbnd_mockup']['name'] ) ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => __( 'No file found.', 'fast-bundle' ),
				),
				400
			);
		}

		$file = $_FILES['fbnd_mockup']; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput

		// The canvas only ever exports PNG (toBlob/'image/png') — reject anything else
		// outright rather than trusting the client-sent name/mime.
		$max_file_size = 20 * 1024 * 1024; // 20MB
		if ( (int) $file['size'] > $max_file_size ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => __( 'Mockup file is too large.', 'fast-bundle' ),
				),
				400
			);
		}
		$filetype = wp_check_filetype( 'mockup.png' );
		$finfo    = @finfo_open( FILEINFO_MIME_TYPE ); // phpcs:ignore WordPress.PHP.NoSilencedErrors
		$mime     = $finfo ? finfo_file( $finfo, $file['tmp_name'] ) : ( $file['type'] ?? '' );
		if ( $finfo ) {
			finfo_close( $finfo );
		}
		if ( 'image/png' !== $mime ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => __( 'Mockup must be a PNG image.', 'fast-bundle' ),
				),
				400
			);
		}
		$file['name'] = 'fbnd-personalizer-mockup-' . wp_generate_password( 12, false ) . '.png';
		$file['type'] = $filetype['type'];

		if ( ! function_exists( 'wp_handle_upload' ) ) {
			require_once ABSPATH . 'wp-admin/includes/file.php';
		}

		add_filter( 'upload_dir', array( $this, 'fbnd_handle_upload_dir' ) );

		$uploaded = wp_handle_upload(
			$file,
			array(
				'test_form' => false,
				'mimes'     => array( 'png' => 'image/png' ),
			)
		);

		remove_filter( 'upload_dir', array( $this, 'fbnd_handle_upload_dir' ) );

		if ( isset( $uploaded['error'] ) ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => $uploaded['error'],
				),
				400
			);
		}

		$this->fbnd_ensure_upload_dir_security( dirname( $uploaded['file'] ) );

		return new WP_REST_Response(
			array(
				'success' => true,
				'data'    => array(
					'file' => $uploaded,
				),
			),
			200
		);
	}

	/**
	 * Enforce a per-IP upload rate limit using a fixed hourly window.
	 *
	 * @return bool True if the request is within the allowed limit, false otherwise.
	 */
	private function fbnd_check_upload_rate_limit() {
		$ip   = isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : 'unknown'; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput
		$hour = gmdate( 'YmdH' );
		$key  = 'fbnd_upload_' . md5( $ip . $hour );

		$count = (int) get_transient( $key );
		if ( $count >= 20 ) {
			return false;
		}

		set_transient( $key, $count + 1, HOUR_IN_SECONDS );
		return true;
	}

	/**
	 * Enforce a per-IP rate limit on personalizer mockup uploads. A separate
	 * bucket from the regular upload-field limit (fbnd_check_upload_rate_limit)
	 * so a shopper filling several upload fields never eats into the one
	 * mockup capture add-to-cart needs.
	 *
	 * @return bool True if the request is within the allowed limit, false otherwise.
	 */
	private function fbnd_check_mockup_upload_rate_limit() {
		$ip   = isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : 'unknown'; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput
		$hour = gmdate( 'YmdH' );
		$key  = 'fbnd_mockup_upload_' . md5( $ip . $hour );

		$count = (int) get_transient( $key );
		if ( $count >= 30 ) {
			return false;
		}

		set_transient( $key, $count + 1, HOUR_IN_SECONDS );
		return true;
	}

	/**
	 * Sanitize an uploaded SVG file in-place, removing all executable content.
	 *
	 * Parses the SVG as XML, strips dangerous elements (script, foreignObject, …),
	 * event-handler attributes (on*), javascript:/vbscript: URIs, and inline CSS
	 * expressions, then writes the cleaned document back to disk.
	 *
	 * @param string $file_path Absolute path to the uploaded SVG file.
	 * @return bool True on success, false if the file could not be parsed or written.
	 */
	private function fbnd_sanitize_svg_file( $file_path ) {
		$content = @file_get_contents( $file_path ); // phpcs:ignore WordPress.WP.AlternativeFunctions

		if ( false === $content ) {
			return false;
		}

		$dom                     = new \DOMDocument();
		$dom->formatOutput       = false;
		$dom->preserveWhiteSpace = true;

		// Prevent XXE on PHP < 8.0 (libxml 2.9+ disables external entities by default).
		$prev_loader = null;

		if ( version_compare( PHP_VERSION, '8.0.0', '<' ) && function_exists( 'libxml_disable_entity_loader' ) ) {
			$prev_loader = libxml_disable_entity_loader( true ); // phpcs:ignore PHPCompatibility.FunctionUse.RemovedFunctions
		}

		$loaded = @$dom->loadXML( $content, 2048 | 32 | 64 ); // LIBXML_NONET | LIBXML_NOERROR | LIBXML_NOWARNING

		if ( null !== $prev_loader && function_exists( 'libxml_disable_entity_loader' ) ) {
			libxml_disable_entity_loader( $prev_loader ); // phpcs:ignore PHPCompatibility.FunctionUse.RemovedFunctions
		}

		if ( ! $loaded ) {
			@unlink( $file_path ); // phpcs:ignore WordPress.WP.AlternativeFunctions
			return false;
		}

		// Reject files that are not SVGs.
		$root = $dom->documentElement;
		if ( ! $root || 'svg' !== strtolower( $root->localName ) ) {
			@unlink( $file_path ); // phpcs:ignore WordPress.WP.AlternativeFunctions
			return false;
		}

		// Remove elements that can embed or execute code.
		$blocked_tags = array(
			'script',
			'foreignObject',
			'foreignobject',
			'iframe',
			'object',
			'embed',
			'video',
			'audio',
			'frame',
			'frameset',
			'applet',
			'animate',
			'animateMotion',
			'animatemotion',
			'animateTransform',
			'animatetransform',
			'set',
		);

		foreach ( $blocked_tags as $tag ) {
			$nodes = $dom->getElementsByTagName( $tag );

			for ( $i = $nodes->length - 1; $i >= 0; $i-- ) {
				$node = $nodes->item( $i );

				if ( $node && $node->parentNode ) {
					$node->parentNode->removeChild( $node );
				}
			}
		}

		// Remove processing instructions (e.g. xml-stylesheet declarations).
		$xpath = new \DOMXPath( $dom );
		$pis   = $xpath->query( '//processing-instruction()' );

		if ( $pis ) {
			for ( $i = $pis->length - 1; $i >= 0; $i-- ) {
				$pi = $pis->item( $i );

				if ( $pi && $pi->parentNode ) {
					$pi->parentNode->removeChild( $pi );
				}
			}
		}

		// URL-bearing attributes that may carry javascript: or external URLs.
		$url_attrs = array(
			'href',
			'xlink:href',
			'src',
			'action',
			'formaction',
			'data',
			'poster',
			'dynsrc',
			'lowsrc',
		);

		$all_nodes = $dom->getElementsByTagName( '*' );

		for ( $i = 0; $i < $all_nodes->length; $i++ ) {
			$el = $all_nodes->item( $i );

			if ( ! ( $el instanceof \DOMElement ) ) {
				continue;
			}

			$tag_name     = strtolower( $el->localName );
			$remove_attrs = array();
			$attributes   = array();

			foreach ( $el->attributes as $attr ) {
				$attributes[] = $attr;
			}

			foreach ( $attributes as $attr ) {
				$node_local_name = $attr->localName; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
				$node_ns_uri     = $attr->namespaceURI; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
				$node_qname      = $attr->name;

				// Use the local name (namespace prefix stripped) for matching so
				// namespaced attributes like xlink:href are not missed, but keep
				// the namespace URI so removal can target the correct node.
				$attr_name  = strtolower( $node_local_name ? $node_local_name : $node_qname );
				$attr_value = $attr->value;

				$mark_for_removal = static function () use ( &$remove_attrs, $node_qname, $node_ns_uri, $attr_name ) {
					$remove_attrs[] = array(
						'name'  => $node_qname,
						'ns'    => $node_ns_uri,
						'local' => $attr_name,
					);
				};

				// Remove all event-handler attributes (onclick, onload, onerror, etc.).
				if ( 0 === strpos( $attr_name, 'on' ) ) {
					$mark_for_removal();
					continue;
				}

				if ( in_array( $attr_name, $url_attrs, true ) ) {
					// Collapse whitespace to catch tab/newline encoded variants.
					$normalized = strtolower(
						preg_replace( '/[\x00-\x20]+/', '', $attr_value )
					);

					if ( preg_match( '/^(javascript|vbscript|data):/i', $normalized ) ) {
						$mark_for_removal();
						continue;
					}

					// <use> elements must only reference same-document fragments (#id).
					if ( 'use' === $tag_name && '#' !== substr( ltrim( $attr_value ), 0, 1 ) ) {
						$mark_for_removal();
						continue;
					}
				}

				// Remove style attributes containing javascript: or CSS expression().
				if ( 'style' === $attr_name ) {
					$clean = preg_replace( '/\/\*.*?\*\//s', '', $attr_value );

					if (
						preg_match( '/javascript:/i', $clean ) ||
						preg_match( '/expression\s*\(/i', $clean )
					) {
						$mark_for_removal();
						continue;
					}
				}

				// xml:base can redirect relative references to an attacker-controlled URL.
				if ( 'base' === $attr_name && 'http://www.w3.org/XML/1998/namespace' === $node_ns_uri ) {
					$mark_for_removal();
				}
			}

			foreach ( $remove_attrs as $target ) {
				if ( $target['ns'] ) {
					$el->removeAttributeNS( $target['ns'], $target['local'] );
				}

				// Also remove any non-namespaced attribute sharing the qualified name.
				$el->removeAttribute( $target['name'] );
			}
		}

		// Strip dangerous constructs from inline <style> blocks.
		$style_nodes = $dom->getElementsByTagName( 'style' );

		for ( $i = 0; $i < $style_nodes->length; $i++ ) {
			$style_node = $style_nodes->item( $i );

			if ( ! $style_node ) {
				continue;
			}

			$css = $style_node->textContent;

			$css = preg_replace( '/@import\b[^;]*;?/i', '', $css );
			$css = preg_replace( '/url\s*\(\s*["\']?\s*javascript:[^)]*\)/i', 'url()', $css );
			$css = preg_replace( '/expression\s*\([^)]*\)/i', 'none', $css );
			$css = preg_replace( '/\bbehavior\s*:[^;]+;?/i', '', $css );

			while ( $style_node->firstChild ) {
				$style_node->removeChild( $style_node->firstChild );
			}

			$style_node->appendChild( $dom->createTextNode( $css ) );
		}

		$sanitized = $dom->saveXML( $dom->documentElement );

		if ( false === $sanitized ) {
			@unlink( $file_path ); // phpcs:ignore WordPress.WP.AlternativeFunctions
			return false;
		}

		$result = file_put_contents( $file_path, $sanitized ); // phpcs:ignore WordPress.WP.AlternativeFunctions

		return false !== $result;
	}

	/**
	 * Write a .htaccess to the upload directory that forces SVGs to download
	 * rather than render inline, preventing stored XSS via SVG files.
	 *
	 * Only creates the file if it does not already exist; safe to call on every upload.
	 *
	 * @param string $dir_path Absolute filesystem path to the upload directory.
	 */
	private function fbnd_ensure_upload_dir_security( $dir_path ) {
		$htaccess = trailingslashit( $dir_path ) . '.htaccess';
		if ( file_exists( $htaccess ) ) {
			return;
		}

		$rules  = "<IfModule mod_headers.c>\n";
		$rules .= "  <FilesMatch \"\\.svgz?$\">\n";
		$rules .= "    Header set Content-Disposition \"attachment\"\n";
		$rules .= "    Header set X-Content-Type-Options \"nosniff\"\n";
		$rules .= "    Header set Content-Security-Policy \"default-src 'none'\"\n";
		$rules .= "  </FilesMatch>\n";
		$rules .= "  Header set X-Content-Type-Options \"nosniff\"\n";
		$rules .= "</IfModule>\n";

		file_put_contents( $htaccess, $rules ); // phpcs:ignore WordPress.WP.AlternativeFunctions
	}

	/**
	 * Customize the upload directory path for FBND files.
	 *
	 * @param array $upload The existing upload directory data.
	 * @return array The modified upload directory data.
	 */
	public function fbnd_handle_upload_dir( $upload ) {
		$directory        = 'fbnd_option_files/temp';
		$upload['subdir'] = '/' . $directory;
		$upload['path']   = $upload['basedir'] . $upload['subdir'];
		$upload['url']    = $upload['baseurl'] . $upload['subdir'];
		return $upload;
	}

	/**
	 * Set analytics data callback.
	 *
	 * Handles updating analytics data for a given option ID and type.
	 *
	 * @since 1.0.0
	 *
	 * @param \WP_REST_Request $request The REST API request object.
	 * @return WP_REST_Response Response indicating success or failure.
	 */
	public function set_analytics_data_callback( \WP_REST_Request $request ) {
		$request_params = $request->get_params();
		$nonce          = isset( $request_params['nonce'] ) ? sanitize_key( $request_params['nonce'] ) : '';
		if ( ! wp_verify_nonce( $nonce, 'fbnd-nonce' ) ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => __( 'Invalid nonce.', 'fast-bundle' ),
				),
				403
			);
		}
		$option_id = isset( $request_params['optionId'] ) ? sanitize_text_field( $request_params['optionId'] ) : '';
		$type      = isset( $request_params['type'] ) ? sanitize_text_field( $request_params['type'] ) : '';

		if ( $option_id && $type ) {
			do_action( 'fbnd_update_stats_table_data', $option_id, $type, '' );
			return new WP_REST_Response(
				array(
					'success'   => true,
					'option_id' => $option_id,
					'type'      => $type,
					'message'   => __( 'Analytics data updated.', 'fast-bundle' ),
				),
				200
			);
		}
		return new WP_REST_Response(
			array(
				'success' => false,
				'message' => __( 'Invalid Analytics data.', 'fast-bundle' ),
			),
			400
		);
	}

	/**
	 * Retrieves a list of options with search and pagination functionality.
	 *
	 * @since 1.0.0
	 *
	 * @param \WP_REST_Request $request The REST API request object.
	 * @return WP_REST_Response Response containing the list of options and pagination info.
	 */
	public function get_analytics_data_callback( \WP_REST_Request $request ) {
		$params = $request->get_params();
		$search = isset( $params['search'] ) ? sanitize_text_field( $params['search'] ) : '';

		global $wpdb;

		$table_name   = $wpdb->prefix . 'fbnd_stats_graph';
		$table_exists = $wpdb->get_var( $wpdb->prepare( 'SHOW TABLES LIKE %s', $table_name ) ); // phpcs:ignore
		if ( $table_exists ) {
			$stats_graph = $wpdb->get_results( $wpdb->prepare( 'SELECT * FROM `%1$s` ORDER BY id ASC', $table_name ) ); // phpcs:ignore
		} else {
			$wpdb->hide_errors();
			require_once ABSPATH . 'wp-admin/includes/upgrade.php';
			$analytics = new Analytics();
			$analytics->create_stats_graph_table();
			$stats_graph = array();
		}

		return new WP_REST_Response(
			array(
				'success'     => true,
				'stats_table' => $this->stats_table_data(),
				'stats_graph' => ! empty( $stats_graph ) ? $stats_graph : array(),
			),
			200
		);
	}

	/**
	 * Retrieves analytics stats table data for options.
	 *
	 * @since 1.0.0
	 *
	 * @return array Stats table data for options.
	 */
	public function stats_table_data() {
		global $wpdb;

		$table_name   = $wpdb->prefix . 'fbnd_stats_table';
		$table_exists = $wpdb->get_var( $wpdb->prepare( 'SHOW TABLES LIKE %s', $table_name ) ); // phpcs:ignore
		if ( ! $table_exists ) {
			$wpdb->hide_errors();
			require_once ABSPATH . 'wp-admin/includes/upgrade.php';
			$analytics = new Analytics();
			$analytics->create_stats_table();
			return array();
		}

		$paged    = 1;
		$per_page = -1;
		$order    = 'DESC';

		$args = array(
			'post_type'      => 'fbnd_option',
			'posts_per_page' => $per_page,
			'order'          => $order,
			'orderby'        => 'ID',
			'post_status'    => array( 'publish', 'draft' ),
			'paged'          => $paged,
		);

		$query = new \WP_Query( $args );
		$data  = array();

		if ( $query->have_posts() ) {
			while ( $query->have_posts() ) {
				$query->the_post();
				$id           = get_the_ID();
				$option_stats = $wpdb->get_results(//phpcs:ignore
					$wpdb->prepare(
						"SELECT * FROM {$wpdb->prefix}fbnd_stats_table WHERE option_id = %d",
						$id
					)
				);

				if ( ! empty( $option_stats ) ) {
					$option_stats = $option_stats[0];
				} else {
					$option_stats = (object) array();
				}

				$click_rate = ( isset( $option_stats->impression_count ) && isset( $option_stats->click_count ) && $option_stats->impression_count > 0 ) ? ( $option_stats->click_count / $option_stats->impression_count ) * 100 : 0;
				$cart_rate  = ( isset( $option_stats->impression_count ) && isset( $option_stats->add_to_cart_count ) && $option_stats->impression_count > 0 ) ? ( $option_stats->add_to_cart_count / $option_stats->impression_count ) * 100 : 0;

				$data[] = array(
					'id'           => $id,
					'title'        => get_the_title(),
					'click'        => round( $click_rate ),
					'cart'         => round( $cart_rate ),
					'sales'        => isset( $option_stats->sales ) ? $option_stats->sales : 0,
					'option_stats' => $option_stats,
					'assigned'     => fast_bundle()->get_assigned_product_data( $id ),
				);
			}

			wp_reset_postdata();
		}

		return $data;
	}

	/**
	 * Customize the upload directory path for font files.
	 *
	 * @param array $upload The existing upload directory data.
	 * @return array The modified upload directory data.
	 */
	public function fbnd_handle_font_upload_dir( $upload ) {
		$directory        = 'fbnd_font_files';
		$upload['subdir'] = '/' . $directory;
		$upload['path']   = $upload['basedir'] . $upload['subdir'];
		$upload['url']    = $upload['baseurl'] . $upload['subdir'];
		return $upload;
	}

	/**
	 * Upload Font File Callback
	 *
	 * @since 1.0.0
	 *
	 * @param \WP_REST_Request $request The REST API request object.
	 * @return WP_REST_Response Response indicating success or failure.
	 */
	public function upload_font_callback( \WP_REST_Request $request ) {
		// Verify nonce and file.
		if (
			empty( $_FILES['font_file'] ) ||
			! isset( $_FILES['font_file']['name'] ) ||
			( ! ( isset( $_POST['fbndnonce'] ) && wp_verify_nonce( sanitize_key( wp_unslash( $_POST['fbndnonce'] ) ), 'fbnd-nonce' ) ) )
		) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => __( 'No file found or invalid nonce.', 'fast-bundle' ),
				),
				400
			);
		}

		$params      = $request->get_params();
		$font_title  = isset( $params['font_title'] ) ? sanitize_text_field( $params['font_title'] ) : '';
		$font_family = isset( $params['font_family'] ) ? sanitize_text_field( $params['font_family'] ) : '';

		if ( empty( $font_title ) ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => __( 'Font title is required.', 'fast-bundle' ),
				),
				400
			);
		}

		$uploaded_file = $_FILES['font_file']; // phpcs:ignore

		// Check if the wp_handle_upload function exists.
		if ( ! function_exists( 'wp_handle_upload' ) ) {
			require_once ABSPATH . 'wp-admin/includes/file.php';
		}

		// Allowed font file types.
		$allowed_extensions = array( 'woff', 'woff2', 'ttf' );
		$allowed_mime_types = array(
			'font/woff',
			'font/woff2',
			'application/x-font-woff',
			'application/font-woff',
			'application/x-font-ttf',
			'application/x-font-truetype',
			'font/ttf',
		);
		$max_file_size      = 10 * 1024 * 1024; // 10MB
		$file_error         = '';

		// Validate file size.
		if ( $uploaded_file['size'] > $max_file_size ) {
			$file_error = __( 'File size exceeds the maximum allowed limit (10MB).', 'fast-bundle' );
		}

		// Validate file extension.
		$file_extension = strtolower( pathinfo( $uploaded_file['name'], PATHINFO_EXTENSION ) );
		if ( ! in_array( $file_extension, $allowed_extensions, true ) ) {
			$file_error = __( 'Invalid file extension. Allowed types are: woff, woff2, ttf.', 'fast-bundle' );
		}

		// Return error response if validation fails.
		if ( $file_error ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => $file_error,
				),
				400
			);
		}

		// Add custom upload directory filter.
		add_filter( 'upload_dir', array( $this, 'fbnd_handle_font_upload_dir' ) );

		// Check if file with same name exists and rename if necessary.
		$upload_dir = wp_upload_dir();
		$target_dir = $upload_dir['basedir'] . '/fbnd_font_files';

		if ( ! file_exists( $target_dir ) ) {
			wp_mkdir_p( $target_dir );
		}

		$original_filename = $uploaded_file['name'];
		$filename          = basename( $original_filename );
		$target_file       = $target_dir . '/' . $filename;
		$counter           = 1;

		// Rename if file exists.
		while ( file_exists( $target_file ) ) {
			$file_info   = pathinfo( $original_filename );
			$filename    = $file_info['filename'] . '-' . $counter . '.' . $file_info['extension'];
			$target_file = $target_dir . '/' . $filename;
			++$counter;
		}

		$uploaded_file['name'] = $filename;

		$upload_overrides = array(
			'test_form' => false,
			'test_type' => false,
			'mimes'     => array(
				'woff'  => 'font/woff|application/font-woff|application/x-font-woff',
				'woff2' => 'font/woff2',
				'ttf'   => 'font/ttf|application/x-font-ttf|application/x-font-truetype',
			),
		);

		// Handle the file upload.
		$uploaded = wp_handle_upload( $uploaded_file, $upload_overrides );      // Remove the custom upload directory filter after processing.
		remove_filter( 'upload_dir', array( $this, 'fbnd_handle_font_upload_dir' ) );

		if ( isset( $uploaded['error'] ) ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => $uploaded['error'],
				),
				400
			);
		}

		// Save font data to options.
		$fonts = get_option( 'fbnd_custom_fonts', array() );

		if ( ! is_array( $fonts ) ) {
			$fonts = array();
		}

		// Generate font face name if not provided.
		if ( empty( $font_family ) ) {
			$font_family = sanitize_title( $font_title );
		}

		$font_data = array(
			'id'        => uniqid( 'font_' ),
			'title'     => $font_title,
			'src'       => $uploaded['url'],
			'family'    => $font_family,
			'file_type' => $file_extension,
		);

		$fonts[] = $font_data;
		update_option( 'fbnd_custom_fonts', $fonts );

		return new WP_REST_Response(
			array(
				'success' => true,
				'message' => __( 'Font uploaded successfully.', 'fast-bundle' ),
				'data'    => $font_data,
			),
			200
		);
	}

	/**
	 * Get Fonts List Callback
	 *
	 * @since 1.0.0
	 *
	 * @return WP_REST_Response Response containing the fonts list.
	 */
	public function get_fonts_callback() {
		$fonts = get_option( 'fbnd_custom_fonts', array() );

		if ( ! is_array( $fonts ) ) {
			$fonts = array();
		}

		return new WP_REST_Response(
			array(
				'success' => true,
				'data'    => $fonts,
			),
			200
		);
	}

	/**
	 * Delete Font Callback
	 *
	 * @since 1.0.0
	 *
	 * @param \WP_REST_Request $request The REST API request object.
	 * @return WP_REST_Response Response indicating success or failure.
	 */
	public function delete_font_callback( \WP_REST_Request $request ) {
		$params  = $request->get_params();
		$font_id = isset( $params['font_id'] ) ? sanitize_text_field( $params['font_id'] ) : '';
		$nonce   = isset( $params['wpnonce'] ) ? sanitize_text_field( $params['wpnonce'] ) : '';

		if ( ! $nonce || ! wp_verify_nonce( $nonce, 'fbnd-nonce' ) ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => __( 'Invalid or missing nonce.', 'fast-bundle' ),
				),
				403
			);
		}

		if ( empty( $font_id ) ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => __( 'Font ID is required.', 'fast-bundle' ),
				),
				400
			);
		}

		$fonts      = get_option( 'fbnd_custom_fonts', array() );
		$font_found = false;
		$file_path  = '';

		if ( is_array( $fonts ) ) {
			foreach ( $fonts as $key => $font ) {
				if ( $font['id'] === $font_id ) {
					$font_found = true;
					$file_path  = str_replace( wp_upload_dir()['baseurl'], wp_upload_dir()['basedir'], $font['src'] );

					// Delete the physical file.
					if ( file_exists( $file_path ) ) {
						wp_delete_file( $file_path );
					}

					// Remove from array.
					unset( $fonts[ $key ] );
					break;
				}
			}

			// Reindex array.
			$fonts = array_values( $fonts );
			update_option( 'fbnd_custom_fonts', $fonts );
		}

		if ( ! $font_found ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => __( 'Font not found.', 'fast-bundle' ),
				),
				404
			);
		}

		return new WP_REST_Response(
			array(
				'success' => true,
				'message' => __( 'Font deleted successfully.', 'fast-bundle' ),
			),
			200
		);
	}

	/**
	 * Update Font Callback
	 *
	 * @since 1.0.0
	 *
	 * @param \WP_REST_Request $request The REST API request object.
	 * @return WP_REST_Response Response indicating success or failure.
	 */
	public function update_font_callback( \WP_REST_Request $request ) {
		$params      = $request->get_params();
		$font_id     = isset( $params['font_id'] ) ? sanitize_text_field( $params['font_id'] ) : '';
		$font_title  = isset( $params['font_title'] ) ? sanitize_text_field( $params['font_title'] ) : '';
		$font_family = isset( $params['font_family'] ) ? sanitize_text_field( $params['font_family'] ) : '';
		$nonce       = isset( $params['wpnonce'] ) ? sanitize_text_field( $params['wpnonce'] ) : '';

		if ( ! $nonce || ! wp_verify_nonce( $nonce, 'fbnd-nonce' ) ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => __( 'Invalid or missing nonce.', 'fast-bundle' ),
				),
				403
			);
		}

		if ( empty( $font_id ) ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => __( 'Font ID is required.', 'fast-bundle' ),
				),
				400
			);
		}

		if ( empty( $font_title ) ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => __( 'Font title is required.', 'fast-bundle' ),
				),
				400
			);
		}

		$fonts      = get_option( 'fbnd_custom_fonts', array() );
		$font_found = false;

		if ( is_array( $fonts ) ) {
			foreach ( $fonts as $key => $font ) {
				if ( $font['id'] === $font_id ) {
					$font_found              = true;
					$fonts[ $key ]['title']  = $font_title;
					$fonts[ $key ]['family'] = $font_family ? $font_family : $font_title;
					break;
				}
			}

			update_option( 'fbnd_custom_fonts', $fonts );
		}

		if ( ! $font_found ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => __( 'Font not found.', 'fast-bundle' ),
				),
				404
			);
		}

		return new WP_REST_Response(
			array(
				'success' => true,
				'message' => __( 'Font updated successfully.', 'fast-bundle' ),
			),
			200
		);
	}

	/**
	 * Dismiss the builder onboarding tour.
	 *
	 * Sets the same flag that creating a first option list sets, so the site
	 * stops counting as a fresh install. Skipping the tour never creates an
	 * add-on, so without this the tour would reappear on every page load.
	 *
	 * @since v.1.6.17
	 *
	 * @return WP_REST_Response
	 */
	public function dismiss_tour_callback() {
		update_option( 'fbnd_first_option_created', 'yes' );

		return new WP_REST_Response(
			array(
				'success' => true,
			),
			200
		);
	}

	public function durbin_subscribe_callback( \WP_REST_Request $request ) {
		if ( ! wp_verify_nonce( $request->get_header( 'X-WP-Nonce' ), 'wp_rest' ) ) {
			return new WP_REST_Response( array( 'message' => 'Invalid nonce.' ), 403 );
		}

		DurbinClient::send( DurbinClient::WIZARD_ACTION );

		return new WP_REST_Response( array( 'sent' => true ), 200 );
	}
}
