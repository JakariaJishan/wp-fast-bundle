<?php
/**
 * Plugin Name: Fast Bundle
 * Description: Build fast, flexible WooCommerce product bundles.
 * Version:     1.0.0
 * Author:      FUSTBUNDLE
 * Author URI:  https://www.fastbundle.com/about
 * Text Domain: fast-bundle
 * Requires Plugins: woocommerce
 * License:     GPLv3
 * License URI: http://www.gnu.org/licenses/gpl-3.0.html
 *
 * @package FastBundle
 */

use FBND\Includes\Common\Functions;
use FBND\Includes\Initialization;

defined( 'ABSPATH' ) || exit;

// Define Vars.
define( 'FBND_VER', '1.0.0' );
define( 'FBND_URL', plugin_dir_url( __FILE__ ) );
define( 'FBND_BASE', plugin_basename( __FILE__ ) );
define( 'FBND_PATH', plugin_dir_path( __FILE__ ) );

spl_autoload_register( 'fbnd_autoloader' );

if ( ! function_exists( 'fast_bundle' ) ) {
	/**
	 * Returns an instance of the Functions class for Fast Bundle.
	 *
	 * @return Functions
	 */
	function fast_bundle() { //phpcs:ignore
		return new Functions();
	}
}

add_action( 'plugins_loaded', 'fbnd_init', 10 );

/**
 * Initializes the plugin.
 */
function fbnd_init() {
	new Initialization();
}

/**
 * Autoloader for FBND namespace classes.
 *
 * @param string $class_name The fully-qualified class name.
 */
function fbnd_autoloader( $class_name ) {
	$namespace = 'FBND\\';
	$base_dir  = trailingslashit( FBND_PATH );

	$len = strlen( $namespace );
	if ( strncmp( $namespace, $class_name, $len ) !== 0 ) {
		return;
	}

	$relative_class = substr( $class_name, $len );
	$segments       = explode( '\\', $relative_class );

	$file_name = array_pop( $segments );
	$subfolder = strtolower(
		implode(
			'/',
			array_map(
				function ( $segment ) {
					return str_replace( '_', '-', $segment );
				},
				$segments
			)
		)
	);

	$prefix    = ( strpos( $subfolder, 'traits' ) !== false ) ? 'trait-' : 'class-';
	$file_name = strtolower(
		preg_replace(
			'/([a-z])([A-Z])/',
			'$1-$2',
			str_replace( '_', '-', $file_name )
		)
	);

	$file = rtrim( $base_dir . $subfolder, '/' ) . '/' . $prefix . $file_name . '.php';

	if ( file_exists( $file ) ) {
		require_once $file;
	}
}
