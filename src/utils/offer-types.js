import { __ } from '@wordpress/i18n';

/**
 * Registry of the non-generic "offer" post types built on top of the
 * `fbnd_option` CPT (Fixed Bundle, Buy X Get Y, and whatever comes next).
 *
 * Each one gets its own builder screen (under `src/pages/editor/<name>/`)
 * and its own URL hash family (`#<prefix>/{id}`), but shares everything
 * else — the CPT, the listing table, the product/category assignment
 * system, and the storefront script/style bundle. Adding a new offer type
 * means adding one entry here (plus its builder + storefront module); it
 * does not mean a new webpack entry or a new top-level page folder.
 *
 * A post with no matching entry here (or `fbnd_option_type: 'custom'`) is a
 * regular Option Set and uses the generic block canvas editor instead.
 */
export const OFFER_TYPES = {
	fixed_bundle: {
		prefix: 'bundle',
		label: __( 'Fixed Bundle', 'fast-bundle' ),
		createLabel: __( 'Create Fixed Bundle', 'fast-bundle' ),
	},
	buy_x_get_y: {
		prefix: 'bxgy',
		label: __( 'Buy X Get Y', 'fast-bundle' ),
		createLabel: __( 'Create Buy X Get Y', 'fast-bundle' ),
	},
};

/**
 * @param {string} type `fbnd_option_type` value.
 * @return {string} The hash prefix for that type, or 'lists' when it isn't
 *                   a registered offer type (a regular Option Set).
 */
export const getOfferHashPrefix = ( type ) =>
	OFFER_TYPES[ type ]?.prefix || 'lists';

/**
 * @param {string} type `fbnd_option_type` value.
 * @return {string} A short display label, or '' for a regular Option Set.
 */
export const getOfferLabel = ( type ) => OFFER_TYPES[ type ]?.label || '';

/**
 * @param {string} prefix A URL hash prefix, e.g. from `getHashPrefix()`.
 * @return {string} The matching `fbnd_option_type`, or '' when the prefix
 *                   isn't a registered offer type (i.e. it's 'lists').
 */
export const getOfferTypeForPrefix = ( prefix ) =>
	Object.keys( OFFER_TYPES ).find(
		( type ) => OFFER_TYPES[ type ].prefix === prefix
	) || '';
