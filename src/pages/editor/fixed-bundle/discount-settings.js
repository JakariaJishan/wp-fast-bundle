import {
	__experimentalHStack as HStack,
	RadioControl,
	__experimentalText as Text,
	TextControl,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Computes the same original/discounted/savings totals as
 * `Fixed_Bundle::calculate_totals()` in PHP, for a live preview only — the
 * server always recalculates authoritatively when the bundle is added to
 * cart, so this being approximate (e.g. rounding) is fine.
 *
 * @param {Array}  items    Bundle items: `{ price, quantity }`.
 * @param {Object} discount `{ type, value }`.
 * @return {{originalTotal: number, discountedTotal: number, savings: number}}
 */
export const calculateTotals = ( items, discount ) => {
	const originalTotal = items.reduce(
		( sum, item ) => sum + ( parseFloat( item.price ) || 0 ) * item.quantity,
		0
	);

	const value = parseFloat( discount.value ) || 0;
	let discountedTotal = originalTotal;

	if ( discount.type === 'fixed_amount' ) {
		discountedTotal = Math.max( 0, originalTotal - value );
	} else if ( discount.type === 'fixed_price' ) {
		discountedTotal = Math.max( 0, value );
	} else {
		discountedTotal = Math.max( 0, originalTotal * ( 1 - value / 100 ) );
	}

	return {
		originalTotal,
		discountedTotal,
		savings: Math.max( 0, originalTotal - discountedTotal ),
	};
};

/**
 * @param {Object}   props
 * @param {Array}    props.items    Bundle items, for the live preview.
 * @param {Object}   props.discount `{ type, value }`.
 * @param {Function} props.onChange Called with the next `discount` object.
 */
const DiscountSettings = ( { items, discount, onChange } ) => {
	const totals = calculateTotals( items, discount );

	return (
		<VStack spacing={ 3 }>
			<RadioControl
				label={ __( 'Discount', 'fast-bundle' ) }
				selected={ discount.type }
				options={ [
					{
						label: __( 'Percentage off', 'fast-bundle' ),
						value: 'percentage',
					},
					{
						label: __( 'Fixed amount off', 'fast-bundle' ),
						value: 'fixed_amount',
					},
					{
						label: __( 'Fixed bundle price', 'fast-bundle' ),
						value: 'fixed_price',
					},
				] }
				onChange={ ( type ) => onChange( { ...discount, type } ) }
			/>
			<TextControl
				__nextHasNoMarginBottom
				type="number"
				min="0"
				label={
					discount.type === 'percentage'
						? __( 'Percentage (%)', 'fast-bundle' )
						: __( 'Amount', 'fast-bundle' )
				}
				value={ discount.value }
				onChange={ ( value ) => onChange( { ...discount, value } ) }
			/>

			<HStack
				justify="space-between"
				style={ {
					padding: '10px 12px',
					background: '#f6f7f7',
					borderRadius: 4,
				} }
			>
				<Text variant="muted">
					{ __( 'Original total', 'fast-bundle' ) }
				</Text>
				<Text
					style={
						totals.savings > 0
							? { textDecoration: 'line-through', opacity: 0.6 }
							: {}
					}
				>
					{ totals.originalTotal.toFixed( 2 ) }
				</Text>
			</HStack>
			<HStack justify="space-between">
				<Text weight={ 600 }>
					{ __( 'Bundle price', 'fast-bundle' ) }
				</Text>
				<Text weight={ 600 }>
					{ totals.discountedTotal.toFixed( 2 ) }
				</Text>
			</HStack>
			{ totals.savings > 0 && (
				<Text variant="muted">
					{ __( 'Customer saves', 'fast-bundle' ) }{ ' ' }
					{ totals.savings.toFixed( 2 ) }
				</Text>
			) }
		</VStack>
	);
};

export default DiscountSettings;
