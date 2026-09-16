import apiFetch from '@wordpress/api-fetch';
import { useEffect, useRef, useState } from '@wordpress/element';

/**
 * `wc_get_product_variation_attributes()` returns raw attribute keys/values
 * (e.g. `attribute_pa_color` => `navy`) — slugs, not display labels. This
 * turns either into a readable title-cased word, e.g. `navy` -> `Navy`,
 * `attribute_pa_color` -> `Color`.
 *
 * @param {string} raw Raw attribute key or value.
 * @return {string} Human-readable label.
 */
const prettify = ( raw ) =>
	String( raw )
		.replace( /^attribute_/, '' )
		.replace( /^pa_/, '' )
		.replace( /[-_]+/g, ' ' )
		.trim()
		.replace( /\b\w/g, ( char ) => char.toUpperCase() );

/**
 * Collapses a product's available variations into one swatch group per
 * attribute, e.g. `[{ label: 'Color', options: ['Navy', 'Heather Gray'] }]`
 * — every distinct value real shoppers can actually pick, from real
 * variation data (`/fbnd/products_details`), not fabricated.
 *
 * @param {Array} variations `products_details` response's `variation` array.
 * @return {Array} Swatch groups.
 */
const buildSwatchGroups = ( variations ) => {
	const groups = {};

	( variations || [] ).forEach( ( variation ) => {
		Object.entries( variation.attributes || {} ).forEach(
			( [ key, value ] ) => {
				if ( ! value ) {
					return;
				}
				const label = prettify( key );
				if ( ! groups[ label ] ) {
					groups[ label ] = new Set();
				}
				groups[ label ].add( prettify( value ) );
			}
		);
	} );

	return Object.entries( groups ).map( ( [ label, values ] ) => ( {
		label,
		options: Array.from( values ),
	} ) );
};

/**
 * Fetches real variation attribute options for the variable products among
 * `items`, for the live preview's swatch pills — only refetches when the
 * *set* of variable product ids changes, and never refetches a product id
 * it already has.
 *
 * @param {Array} items Items with `{ product_id, is_variable }`.
 * @return {Object} Map of `product_id -> [{ label, options }]`.
 */
export const useVariationSwatches = ( items ) => {
	const [ swatchesByProductId, setSwatchesByProductId ] = useState( {} );
	const fetchedIdsRef = useRef( new Set() );

	const variableIds = items
		.filter( ( item ) => item.is_variable )
		.map( ( item ) => item.product_id );
	const key = variableIds.slice().sort().join( ',' );

	useEffect( () => {
		const idsToFetch = variableIds.filter(
			( id ) => ! fetchedIdsRef.current.has( id )
		);

		if ( idsToFetch.length === 0 ) {
			return;
		}

		idsToFetch.forEach( ( id ) => fetchedIdsRef.current.add( id ) );

		apiFetch( {
			method: 'POST',
			path: '/fbnd/products_details',
			data: { items: idsToFetch.map( ( id ) => ( { id } ) ) },
		} )
			.then( ( response ) => {
				const next = {};
				( Array.isArray( response ) ? response : [] ).forEach(
					( product ) => {
						next[ product.id ] = buildSwatchGroups(
							product.variation
						);
					}
				);
				setSwatchesByProductId( ( prev ) => ( {
					...prev,
					...next,
				} ) );
			} )
			.catch( () => {} );
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ key ] );

	return swatchesByProductId;
};
