/**
 * Fixed Bundle storefront widget: handles the "Add Bundle to Cart" button.
 *
 * Vanilla JS (matching this plugin's other storefront scripts) rather than a
 * framework — the widget itself is server-rendered by
 * `Fixed_Bundle_Cart::render_widget()`; this file only wires up the button.
 */

( function () {
	'use strict';

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
	 * @param {HTMLElement} widget    The bundle container.
	 * @param {string}      cartUrl   URL of the cart page.
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

		button.disabled = true;
		button.textContent = i18n.adding || 'Adding…';
		setMessage( widget, '', '' );

		const body = new URLSearchParams();
		body.set( 'action', 'fbnd_add_fixed_bundle' );
		body.set( 'bundle_id', bundleId );
		body.set( 'nonce', settings.nonce );

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

					if ( window.jQuery ) {
						window.jQuery( document.body ).trigger( 'wc_fragment_refresh' );
						window.jQuery( document.body ).trigger( 'added_to_cart', [ {}, '', button ] );
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

	document.addEventListener( 'click', function ( event ) {
		const button = event.target.closest( '.fbnd-fixed-bundle__button' );
		if ( button ) {
			handleAddToCart( button );
		}
	} );
} )();
