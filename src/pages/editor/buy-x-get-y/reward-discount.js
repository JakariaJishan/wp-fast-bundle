import {
	__experimentalHStack as HStack,
	RadioControl,
	__experimentalText as Text,
	TextControl,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Computes the same reward pricing as
 * `Buy_X_Get_Y::calculate_reward_pricing()` in PHP, for a live preview only
 * — the server always recalculates authoritatively when the deal is added
 * to cart.
 *
 * @param {Array}  rewards  Reward items: `{ price, quantity }`.
 * @param {Object} discount `{ type, value }`.
 * @return {{ rewardTotal: number, savings: number }}
 */
export const calculateRewardTotals = ( rewards, discount ) => {
	const value = parseFloat( discount.value ) || 0;
	let rewardTotal = 0;
	let savings = 0;

	rewards.forEach( ( item ) => {
		const price = parseFloat( item.price ) || 0;
		let unitPrice = price;

		if ( discount.type === 'free' ) {
			unitPrice = 0;
		} else if ( discount.type === 'fixed_price' ) {
			unitPrice = Math.max( 0, value );
		} else {
			unitPrice = Math.max( 0, price * ( 1 - value / 100 ) );
		}

		rewardTotal += unitPrice * item.quantity;
		savings += ( price - unitPrice ) * item.quantity;
	} );

	return { rewardTotal, savings: Math.max( 0, savings ) };
};

/**
 * @param {Object}   props
 * @param {Array}    props.rewards  Reward items, for the live preview.
 * @param {Object}   props.discount `{ type, value }`.
 * @param {Function} props.onChange Called with the next `discount` object.
 */
const RewardDiscount = ( { rewards, discount, onChange } ) => {
	const { rewardTotal, savings } = calculateRewardTotals( rewards, discount );

	return (
		<VStack spacing={ 3 }>
			<RadioControl
				label={ __( 'Reward price', 'fast-bundle' ) }
				selected={ discount.type }
				options={ [
					{ label: __( 'Free', 'fast-bundle' ), value: 'free' },
					{
						label: __( 'Percentage off', 'fast-bundle' ),
						value: 'percentage',
					},
					{
						label: __( 'Fixed price per item', 'fast-bundle' ),
						value: 'fixed_price',
					},
				] }
				onChange={ ( type ) => onChange( { ...discount, type } ) }
			/>
			{ discount.type !== 'free' && (
				<TextControl
					__nextHasNoMarginBottom
					type="number"
					min="0"
					label={
						discount.type === 'percentage'
							? __( 'Percentage (%)', 'fast-bundle' )
							: __( 'Price per item', 'fast-bundle' )
					}
					value={ discount.value }
					onChange={ ( value ) => onChange( { ...discount, value } ) }
				/>
			) }

			<HStack justify="space-between">
				<Text weight={ 600 }>
					{ __( 'Reward total', 'fast-bundle' ) }
				</Text>
				<Text weight={ 600 }>{ rewardTotal.toFixed( 2 ) }</Text>
			</HStack>
			{ savings > 0 && (
				<Text variant="muted">
					{ __( 'Customer saves', 'fast-bundle' ) } { savings.toFixed( 2 ) }
				</Text>
			) }
		</VStack>
	);
};

export default RewardDiscount;
