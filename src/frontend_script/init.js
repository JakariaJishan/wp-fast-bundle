import fbndFrontendState from './state';

/**
 * Main initialization function for the storefront bundle display.
 * Placeholder entry point — wire up bundle-specific field handlers here.
 *
 * @function initFbndActions
 */
export function initFbndActions() {
	fbndFrontendState.updateBasePrice(
		Number( document.getElementById( 'fbnd_base_price' )?.textContent || 0 )
	);
}
