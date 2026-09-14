/**
 * Fixed Bundle storefront widget: handles the "Add Bundle to Cart" button.
 *
 * Vanilla JS (matching this plugin's other storefront scripts) rather than a
 * framework — the widget itself is server-rendered by
 * `Fixed_Bundle_Cart::render_widget()`; this module only wires up the
 * button. Bundled into the single `frontend-script.js` entry, initialized
 * from `init.js` alongside every other offer type's handlers.
 */

import { collectSelections } from './variation-selector';

let isBound = false;

/**
 * @param {HTMLElement} widget The `.fbnd-fixed-bundle` container.
 * @param {string}      text   Message to show.
 * @param {string}      state  'error' or '' (default/success).
 */
function setMessage( widget, text, state ) {
	const messageEl = widget.querySelector( '.fbnd-fixed-bundle__message' );
	if ( ! messageEl ) {
		return;
	}
	messageEl.textContent = text;
	messageEl.classList.toggle( 'fbnd-fixed-bundle__message--error', state === 'error' );
}

/**
 * @param {HTMLElement} widget  The bundle container.
 * @param {string}      cartUrl URL of the cart page.
 */
function showAdded( widget, cartUrl ) {
	const messageEl = widget.querySelector( '.fbnd-fixed-bundle__message' );
	if ( ! messageEl ) {
		return;
	}
	const i18n = window.fbndFixedBundle?.i18n || {};
	messageEl.classList.remove( 'fbnd-fixed-bundle__message--error' );
	messageEl.textContent = '';

	const text = document.createElement( 'span' );
	text.textContent = i18n.added || 'Added to cart.';
	messageEl.appendChild( text );

	if ( cartUrl ) {
		messageEl.appendChild( document.createTextNode( ' ' ) );
		const link = document.createElement( 'a' );
		link.href = cartUrl;
		link.textContent = i18n.viewCart || 'View cart';
		messageEl.appendChild( link );
	}
}

/**
 * @param {HTMLElement} button The clicked "Add Bundle to Cart" button.
 */
function handleAddToCart( button ) {
	const widget = button.closest( '.fbnd-fixed-bundle' );
	const settings = window.fbndFixedBundle;

	if ( ! widget || ! settings ) {
		return;
	}

	const bundleId = button.getAttribute( 'data-bundle-id' );
	const i18n = settings.i18n || {};
	const originalLabel = button.textContent;

	const selections = collectSelections( widget );
	if ( ! selections ) {
		setMessage(
			widget,
			i18n.selectOptions || 'Please select options for all products.',
			'error'
		);
		return;
	}

	button.disabled = true;
	button.textContent = i18n.adding || 'Adding…';
	setMessage( widget, '', '' );

	const body = new URLSearchParams();
	body.set( 'action', 'fbnd_add_fixed_bundle' );
	body.set( 'bundle_id', bundleId );
	body.set( 'nonce', settings.nonce );
	body.set( 'selections', JSON.stringify( selections ) );

	fetch( settings.ajaxUrl, {
		method: 'POST',
		credentials: 'same-origin',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: body.toString(),
	} )
		.then( ( response ) => response.json() )
		.then( ( response ) => {
			if ( response && response.success ) {
				showAdded( widget, response.data && response.data.cart_url );

				// Isolated: a third-party plugin's `added_to_cart`/
				// `wc_fragment_refresh` handler can throw (e.g. it assumes a
				// real `form.cart` button context, which this widget isn't).
				// That must not get miscaught below and reported as our own
				// add-to-cart failure when it actually succeeded.
				if ( window.jQuery ) {
					try {
						window.jQuery( document.body ).trigger( 'wc_fragment_refresh' );
						window.jQuery( document.body ).trigger( 'added_to_cart', [ {}, '', button ] );
					} catch ( error ) {
						// eslint-disable-next-line no-console
						console.log( 'fast-bundle: a wc_fragment_refresh/added_to_cart listener threw', error );
					}
				}
			} else {
				const message = ( response && response.data && response.data.message ) || i18n.error || 'Something went wrong. Please try again.';
				setMessage( widget, message, 'error' );
			}
		} )
		.catch( () => {
			setMessage( widget, i18n.error || 'Something went wrong. Please try again.', 'error' );
		} )
		.finally( () => {
			button.disabled = false;
			button.textContent = originalLabel;
		} );
}

/**
 * Wires up every `.fbnd-fixed-bundle__button` on the page via one delegated
 * listener. Safe to call more than once — only binds the listener the first
 * time.
 */
export function initFixedBundleActions() {
	if ( isBound ) {
		return;
	}
	isBound = true;

	document.addEventListener( 'click', function ( event ) {
		const button = event.target.closest( '.fbnd-fixed-bundle__button' );
		if ( button ) {
			handleAddToCart( button );
		}
	} );
}
