import { initBuyXGetYActions } from './buy-x-get-y';
import { initFixedBundleActions } from './fixed-bundle';
import fbndFrontendState from './state';
import { initVariationSelectors } from './variation-selector';

/**
 * Main initialization function for the storefront bundle display. Runs each
 * offer type's own handler; add a new one here when a new offer type ships.
 *
 * @function initFbndActions
 */
export function initFbndActions() {
	fbndFrontendState.updateBasePrice(
		Number( document.getElementById( 'fbnd_base_price' )?.textContent || 0 )
	);

	initFixedBundleActions();
	initBuyXGetYActions();
	initVariationSelectors();
}
