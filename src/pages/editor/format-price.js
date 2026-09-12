/**
 * Formats a number as a price using the shop's currency settings (already
 * localized onto `fbndBackendData` for the admin app). Preview-only — the
 * real charged price is always computed and formatted server-side.
 *
 * @param {number|string} amount The amount to format.
 * @return {string} The formatted price, e.g. "$12.50".
 */
export const formatPrice = ( amount ) => {
	const number = Number( amount ) || 0;
	const decimals = Number( fbndBackendData?.num_decimals ?? 2 );
	const decimalSep = fbndBackendData?.decimal_sep ?? '.';
	const symbol = fbndBackendData?.currencySymbol ?? '$';
	const pos = fbndBackendData?.currency_pos ?? 'left';

	const fixed = number.toFixed( decimals ).replace( '.', decimalSep );

	switch ( pos ) {
		case 'right':
			return `${ fixed }${ symbol }`;
		case 'left_space':
			return `${ symbol } ${ fixed }`;
		case 'right_space':
			return `${ fixed } ${ symbol }`;
		case 'left':
		default:
			return `${ symbol }${ fixed }`;
	}
};
