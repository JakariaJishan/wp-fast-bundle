<?php // phpcs:ignore
/**
 * PostType Action.
 *
 * @package FBND\Options
 * @since v.1.0.0
 */
namespace FBND\Includes;

defined( 'ABSPATH' ) || exit;

/**
 * PostType class.
 */
class PostType {

	/**
	 * Setup class.
	 *
	 * @since v.1.0.0
	 */
	public function __construct() {
		add_action( 'init', array( $this, 'post_type_callback' ) );
	}


	/**
	 * Option PostType
	 *
	 * @since v.1.0.0
	 */
	public function post_type_callback() {
		$labels = array(
			'name'               => _x( 'Option', 'Option', 'fast-bundle' ),
			'singular_name'      => _x( 'Option', 'Option', 'fast-bundle' ),
			'menu_name'          => __( 'Option', 'fast-bundle' ),
			'parent_item_colon'  => __( 'Parent Option', 'fast-bundle' ),
			'all_items'          => __( 'Option', 'fast-bundle' ),
			'view_item'          => __( 'View Option', 'fast-bundle' ),
			'add_new_item'       => __( 'Add New', 'fast-bundle' ),
			'add_new'            => __( 'Add New', 'fast-bundle' ),
			'edit_item'          => __( 'Edit Option', 'fast-bundle' ),
			'update_item'        => __( 'Update Option', 'fast-bundle' ),
			'search_items'       => __( 'Search Option', 'fast-bundle' ),
			'not_found'          => __( 'No Option Found', 'fast-bundle' ),
			'not_found_in_trash' => __( 'Not Option found in Trash', 'fast-bundle' ),
		);
		$args   = array(
			'labels'              => $labels,
			'show_in_rest'        => true,
			'supports'            => array( 'title', 'editor' ),
			'hierarchical'        => false,
			'public'              => false,
			'rewrite'             => false,
			'show_ui'             => false,
			'show_in_menu'        => false,
			'show_in_nav_menus'   => false,
			'exclude_from_search' => true,
			'capability_type'     => 'page',
		);
		register_post_type( 'fbnd_option', $args );
	}
}
