/**
 * Shared variant-selector logic for storefront widgets that can contain a
 * variable product (Fixed Bundle's items, Buy X Get Y's triggers/rewards):
 * resolves a shopper's attribute picks (dropdowns or swatches) to a specific
 * variation, keeps the displayed price/total live, and gates add-to-cart
 * until every variable item resolves.
 *
 * One delegated listener set, scoped to `.fbnd-variation-picker` — any
 * widget that renders that markup (via `Grouped_Offer_Cart::render_variation_picker()`)
 * gets this for free once `initVariationSelectors()` runs, without needing
 * its own wiring.
 */

/**
 * Formats a price using a widget's localized currency settings
 * (`fbndFixedBundle.currency` / `fbndBuyXGetY.currency`, from
 * `Functions::get_currency_format()`). Falls back to a plain number if no
 * currency config is available.
 *
 * @param {number} amount   The amount to format.
 * @param {Object} currency `{ symbol, decimals, decimalSeparator, thousandSeparator, position }`.
 * @return {string} The formatted price.
 */
function formatMoney( amount, currency ) {
	const value = Number( amount ) || 0;

	if ( ! currency ) {
		return value.toFixed( 2 );
	}

	const decimals = currency.decimals ?? 2;
	const decimalSep = currency.decimalSeparator ?? '.';
	const thousandSep = currency.thousandSeparator ?? ',';
	const symbol = currency.symbol ?? '';

	const [ intPart, decPart ] = value.toFixed( decimals ).split( '.' );
	const withThousands = intPart.replace( /\B(?=(\d{3})+(?!\d))/g, thousandSep );
	const formatted = decPart ? `${ withThousands }${ decimalSep }${ decPart }` : withThousands;

	switch ( currency.position ) {
		case 'right':
			return `${ formatted }${ symbol }`;
		case 'left_space':
			return `${ symbol } ${ formatted }`;
		case 'right_space':
			return `${ formatted } ${ symbol }`;
		case 'left':
		default:
			return `${ symbol }${ formatted }`;
	}
}

/**
 * @param {HTMLElement} picker A `.fbnd-variation-picker` container.
 * @return {Object} Map of `attribute key => currently chosen value` ('' when unset).
 */
function getSelectedAttributes( picker ) {
	const selected = {};

	picker
		.querySelectorAll( '.fbnd-variation-picker__attribute' )
		.forEach( ( attributeEl ) => {
			const key = attributeEl.dataset.attribute;
			const select = attributeEl.querySelector( '.fbnd-variation-picker__select' );

			if ( select ) {
				selected[ key ] = select.value;
				return;
			}

			const activeSwatch = attributeEl.querySelector(
				'.fbnd-variation-picker__swatch--selected'
			);
			selected[ key ] = activeSwatch ? activeSwatch.dataset.value : '';
		} );

	return selected;
}

/**
 * @param {Array}  variations The picker's `data-variations` list.
 * @param {Object} selected   From `getSelectedAttributes()`.
 * @return {Object|null} The matching variation, or null if attributes are
 *                        incomplete or no variation matches (an empty
 *                        variation attribute value means "any", matching
 *                        every selection for that attribute).
 */
function matchVariation( variations, selected ) {
	const keys = Object.keys( selected );

	if ( keys.length === 0 || keys.some( ( key ) => ! selected[ key ] ) ) {
		return null;
	}

	return (
		variations.find( ( variation ) =>
			keys.every( ( key ) => {
				const value = variation.attributes?.[ key ] ?? '';
				return '' === value || value === selected[ key ];
			} )
		) || null
	);
}

/**
 * Re-resolves one picker against its currently selected attributes: updates
 * its hidden variation-id field and "unavailable" message.
 *
 * @param {HTMLElement} picker A `.fbnd-variation-picker` container.
 * @return {Object|null} The resolved variation, or null.
 */
function resolvePicker( picker ) {
	let variations = [];
	try {
		variations = JSON.parse( picker.dataset.variations || '[]' );
	} catch ( error ) {
		variations = [];
	}

	const selected = getSelectedAttributes( picker );
	const allChosen = Object.values( selected ).every( ( value ) => value );
	const match = allChosen ? matchVariation( variations, selected ) : null;

	const variationInput = picker.querySelector(
		'.fbnd-variation-picker__variation-id'
	);
	if ( variationInput ) {
		variationInput.value = match ? match.variation_id : '';
	}

	const unavailableEl = picker.querySelector(
		'.fbnd-variation-picker__unavailable'
	);
	if ( unavailableEl ) {
		unavailableEl.hidden = ! allChosen || !! match;
	}

	return match;
}

/**
 * @param {HTMLElement} widget A widget root (`.fbnd-fixed-bundle` or `.fbnd-bxgy`).
 * @return {Object|null} Map of `product_id => variation_id` for every variable
 *                        item in the widget, or null if any is unresolved.
 */
export function collectSelections( widget ) {
	const pickers = widget.querySelectorAll( '.fbnd-variation-picker' );
	const selections = {};

	for ( const picker of pickers ) {
		const match = resolvePicker( picker );
		if ( ! match ) {
			return null;
		}
		selections[ picker.dataset.productId ] = match.variation_id;
	}

	return selections;
}

/**
 * Finds a picker's currently resolved variation price, falling back to the
 * item's server-rendered estimate (cheapest variation) when unresolved.
 *
 * @param {HTMLElement} widget    A widget root.
 * @param {Object}      item      `{ product_id, quantity, price }`, from the widget's `data-pricing`.
 * @return {number} The item's current unit price.
 */
function currentItemPrice( widget, item ) {
	const picker = widget.querySelector(
		`.fbnd-variation-picker[data-product-id="${ item.product_id }"]`
	);
	if ( ! picker ) {
		return item.price;
	}

	let variations = [];
	try {
		variations = JSON.parse( picker.dataset.variations || '[]' );
	} catch ( error ) {
		variations = [];
	}

	const variationId = picker.querySelector(
		'.fbnd-variation-picker__variation-id'
	)?.value;
	const match = variations.find(
		( variation ) => String( variation.variation_id ) === String( variationId )
	);

	return match ? match.price : item.price;
}

/**
 * Recomputes and displays a Fixed Bundle widget's total, mirroring
 * `Fixed_Bundle::calculate_totals()`'s proportional-discount math.
 *
 * @param {HTMLElement} widget The `.fbnd-fixed-bundle` root.
 * @return {void}
 */
function recalcFixedBundleTotals( widget ) {
	let pricing;
	try {
		pricing = JSON.parse( widget.dataset.pricing || '{}' );
	} catch ( error ) {
		return;
	}
	if ( ! Array.isArray( pricing.items ) ) {
		return;
	}

	const currency = window.fbndFixedBundle?.currency;
	const i18n = window.fbndFixedBundle?.i18n || {};

	const originalTotal = pricing.items.reduce(
		( sum, item ) => sum + currentItemPrice( widget, item ) * item.quantity,
		0
	);

	const { type = 'percentage', value = 0 } = pricing.discount || {};
	const numValue = parseFloat( value ) || 0;
	let discountedTotal = originalTotal;

	if ( 'fixed_amount' === type ) {
		discountedTotal = Math.max( 0, originalTotal - numValue );
	} else if ( 'fixed_price' === type ) {
		discountedTotal = Math.max( 0, numValue );
	} else {
		discountedTotal = Math.max( 0, originalTotal * ( 1 - numValue / 100 ) );
	}

	const savings = Math.max( 0, originalTotal - discountedTotal );
	const hasSaving = savings > 0;

	const originalEl = widget.querySelector( '.fbnd-fixed-bundle__original' );
	const discountedEl = widget.querySelector( '.fbnd-fixed-bundle__discounted' );
	const savingsEl = widget.querySelector( '.fbnd-fixed-bundle__savings' );

	if ( discountedEl ) {
		discountedEl.innerHTML = formatMoney( discountedTotal, currency );
	}
	if ( originalEl ) {
		originalEl.innerHTML = formatMoney( originalTotal, currency );
		originalEl.hidden = ! hasSaving;
	}
	if ( savingsEl ) {
		savingsEl.innerHTML = ( i18n.youSave || 'You save %s' ).replace(
			'%s',
			formatMoney( savings, currency )
		);
		savingsEl.hidden = ! hasSaving;
	}
}

/**
 * Recomputes and displays a Buy X Get Y widget's per-reward price and total,
 * mirroring `Buy_X_Get_Y::calculate_reward_pricing()`.
 *
 * @param {HTMLElement} widget The `.fbnd-bxgy` root.
 * @return {void}
 */
function recalcBuyXGetYTotals( widget ) {
	let pricing;
	try {
		pricing = JSON.parse( widget.dataset.pricing || '{}' );
	} catch ( error ) {
		return;
	}
	if ( ! Array.isArray( pricing.triggers ) || ! Array.isArray( pricing.rewards ) ) {
		return;
	}

	const currency = window.fbndBuyXGetY?.currency;
	const i18n = window.fbndBuyXGetY?.i18n || {};

	const { type = 'free', value = 0 } = pricing.rewardDiscount || {};
	const numValue = parseFloat( value ) || 0;

	let triggerTotal = 0;
	pricing.triggers.forEach( ( item ) => {
		triggerTotal += currentItemPrice( widget, item ) * item.quantity;
	} );

	let rewardTotal = 0;
	let savings = 0;

	pricing.rewards.forEach( ( item ) => {
		const price = currentItemPrice( widget, item );
		let rewardPrice = price;

		if ( 'free' === type ) {
			rewardPrice = 0;
		} else if ( 'fixed_price' === type ) {
			rewardPrice = Math.max( 0, numValue );
		} else {
			rewardPrice = Math.max( 0, price * ( 1 - numValue / 100 ) );
		}

		rewardTotal += rewardPrice * item.quantity;
		savings += ( price - rewardPrice ) * item.quantity;

		const priceEl = widget.querySelector(
			`.fbnd-bxgy__item-price[data-product-id="${ item.product_id }"]`
		);
		if ( priceEl ) {
			const originalMarkup =
				rewardPrice < price
					? `<span class="fbnd-bxgy__item-price-original">${ formatMoney(
							price,
							currency
					  ) }</span>`
					: '';
			const priceMarkup =
				0 === rewardPrice
					? `<span class="fbnd-bxgy__item-price-free">${
							i18n.free || 'FREE'
					  }</span>`
					: formatMoney( rewardPrice, currency );
			priceEl.innerHTML = originalMarkup + priceMarkup;
		}
	} );

	savings = Math.max( 0, savings );
	const hasSaving = savings > 0;

	const totalEl = widget.querySelector( '.fbnd-bxgy__total' );
	const savingsEl = widget.querySelector( '.fbnd-bxgy__savings' );

	if ( totalEl ) {
		totalEl.innerHTML = formatMoney( triggerTotal + rewardTotal, currency );
	}
	if ( savingsEl ) {
		savingsEl.innerHTML = ( i18n.youSave || 'You save %s' ).replace(
			'%s',
			formatMoney( savings, currency )
		);
		savingsEl.hidden = ! hasSaving;
	}
}

/**
 * Re-resolves every picker in a widget and refreshes its live total.
 *
 * @param {HTMLElement} widget A widget root.
 * @return {void}
 */
function refreshWidget( widget ) {
	widget
		.querySelectorAll( '.fbnd-variation-picker' )
		.forEach( ( picker ) => resolvePicker( picker ) );

	if ( widget.classList.contains( 'fbnd-fixed-bundle' ) ) {
		recalcFixedBundleTotals( widget );
	} else if ( widget.classList.contains( 'fbnd-bxgy' ) ) {
		recalcBuyXGetYTotals( widget );
	}
}

let isBound = false;

/**
 * Wires up every `.fbnd-variation-picker` on the page via delegated
 * listeners. Safe to call more than once — only binds the listeners the
 * first time.
 *
 * @return {void}
 */
export function initVariationSelectors() {
	if ( isBound ) {
		return;
	}
	isBound = true;

	document.addEventListener( 'change', function ( event ) {
		const select = event.target.closest( '.fbnd-variation-picker__select' );
		if ( ! select ) {
			return;
		}
		const widget = select.closest( '.fbnd-fixed-bundle, .fbnd-bxgy' );
		if ( widget ) {
			refreshWidget( widget );
		}
	} );

	document.addEventListener( 'click', function ( event ) {
		const swatch = event.target.closest( '.fbnd-variation-picker__swatch' );
		if ( ! swatch ) {
			return;
		}

		const attributeEl = swatch.closest( '.fbnd-variation-picker__attribute' );
		attributeEl
			.querySelectorAll( '.fbnd-variation-picker__swatch' )
			.forEach( ( button ) =>
				button.classList.remove( 'fbnd-variation-picker__swatch--selected' )
			);
		swatch.classList.add( 'fbnd-variation-picker__swatch--selected' );

		const widget = swatch.closest( '.fbnd-fixed-bundle, .fbnd-bxgy' );
		if ( widget ) {
			refreshWidget( widget );
		}
	} );
}
