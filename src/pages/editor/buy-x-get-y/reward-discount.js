import {
	Button,
	__experimentalHStack as HStack,
	__experimentalText as Text,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';

import { formatPrice } from '../format-price';

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

const REWARD_TYPE_COPY = {
	free: {
		title: __( 'Free', 'fast-bundle' ),
		subtitle: __( '100% off reward items', 'fast-bundle' ),
	},
	percentage: {
		title: __( 'Percentage (%)', 'fast-bundle' ),
		subtitle: __( '% off reward items', 'fast-bundle' ),
	},
	fixed_price: {
		title: __( 'Fixed Price ($)', 'fast-bundle' ),
		subtitle: __( 'Set price per item', 'fast-bundle' ),
	},
};

const REWARD_TYPE_ORDER = [ 'free', 'percentage', 'fixed_price' ];

const AMOUNT_LABEL_BY_TYPE = {
	percentage: __( 'Discount Percentage (%)', 'fast-bundle' ),
	fixed_price: __( 'Price Per Item ($)', 'fast-bundle' ),
};

const PRESETS_BY_TYPE = {
	percentage: [ 10, 25, 50 ],
};

const formatPresetLabel = ( type, preset ) =>
	type === 'percentage'
		? sprintf(
				/* translators: %d: preset percentage */
				__( '%d%% Off', 'fast-bundle' ),
				preset
		  )
		: formatPrice( preset );

/**
 * @param {Object}   props
 * @param {Array}    props.rewards  Reward items, for the live preview.
 * @param {Object}   props.discount `{ type, value }`.
 * @param {Function} props.onChange Called with the next `discount` object.
 */
const RewardDiscount = ( { rewards, discount, onChange } ) => {
	const { rewardTotal, savings } = calculateRewardTotals( rewards, discount );
	const needsValue = discount.type !== 'free';
	const presets = PRESETS_BY_TYPE[ discount.type ];
	const amountSymbol =
		discount.type === 'percentage'
			? '%'
			: fbndBackendData?.currencySymbol ?? '$';
	const totalUnits = rewards.reduce(
		( sum, item ) => sum + ( parseInt( item.quantity, 10 ) || 0 ),
		0
	);
	const originalTotal = rewardTotal + savings;
	const savingsPercent =
		originalTotal > 0 ? ( savings / originalTotal ) * 100 : 0;

	return (
		<VStack spacing={ 4 }>
			<HStack
				justify="space-between"
				alignment="center"
				style={ {
					paddingBottom: 12,
					borderBottom: '1px solid #e0e0e0',
				} }
			>
				<Text weight={ 600 } size={ 16 }>
					{ __( 'Reward Pricing Strategy', 'fast-bundle' ) }
				</Text>
				<span
					style={ {
						background: '#e6f4ea',
						color: '#008a00',
						borderRadius: 100,
						padding: '4px 12px',
						fontSize: 12,
						fontWeight: 600,
						whiteSpace: 'nowrap',
					} }
				>
					{ __( 'Auto applied at checkout', 'fast-bundle' ) }
				</span>
			</HStack>

			<VStack spacing={ 2 }>
				<Text weight={ 600 } size={ 13 }>
					{ __( 'Reward Price', 'fast-bundle' ) }
				</Text>
				<div
					style={ {
						display: 'grid',
						gridTemplateColumns:
							'repeat(auto-fit, minmax(150px, 1fr))',
						gap: 12,
					} }
				>
					{ REWARD_TYPE_ORDER.map( ( type ) => {
						const isSelected = type === discount.type;
						const copy = REWARD_TYPE_COPY[ type ];
						return (
							<div
								key={ type }
								role="radio"
								aria-checked={ isSelected }
								tabIndex={ 0 }
								onClick={ () =>
									onChange( { ...discount, type } )
								}
								onKeyDown={ ( e ) => {
									if ( e.key === 'Enter' || e.key === ' ' ) {
										e.preventDefault();
										onChange( { ...discount, type } );
									}
								} }
								style={ {
									padding: '14px 16px',
									border: isSelected
										? '2px solid #7f54b3'
										: '1px solid #ddd',
									borderRadius: 6,
									background: isSelected
										? '#f5effa'
										: '#fff',
									cursor: 'pointer',
									textAlign: 'center',
								} }
							>
								<VStack spacing={ 1 } alignment="center">
									<Text
										weight={ 600 }
										style={ {
											color: isSelected
												? '#7f54b3'
												: '#1e1e1e',
										} }
									>
										{ copy.title }
									</Text>
									<Text variant="muted" size={ 12 }>
										{ copy.subtitle }
									</Text>
								</VStack>
							</div>
						);
					} ) }
				</div>
			</VStack>

			{ needsValue && (
				<div
					style={ {
						background: '#f6f7f7',
						border: '1px solid #e0e0e0',
						borderRadius: 6,
						padding: 16,
					} }
				>
					<HStack
						alignment="flex-end"
						justify="space-between"
						spacing={ 4 }
					>
						<VStack spacing={ 2 } style={ { flex: 1 } }>
							<Text weight={ 600 } size={ 13 }>
								{ AMOUNT_LABEL_BY_TYPE[ discount.type ] }
							</Text>
							<HStack
								spacing={ 0 }
								expanded={ false }
								style={ {
									border: '1px solid #949494',
									borderRadius: 4,
									overflow: 'hidden',
									background: '#fff',
									maxWidth: 220,
								} }
							>
								<div
									style={ {
										padding: '8px 12px',
										background: '#f0f0f0',
										borderRight: '1px solid #ddd',
										fontWeight: 600,
									} }
								>
									{ amountSymbol }
								</div>
								<input
									type="number"
									min="0"
									step="0.01"
									value={ discount.value }
									onChange={ ( e ) =>
										onChange( {
											...discount,
											value: e.target.value,
										} )
									}
									style={ {
										border: 'none',
										outline: 'none',
										padding: '8px 12px',
										flex: 1,
										minWidth: 100,
										fontSize: 14,
									} }
								/>
							</HStack>
						</VStack>

						{ presets && (
							<VStack spacing={ 2 }>
								<Text weight={ 600 } size={ 13 }>
									{ __( 'Quick Presets', 'fast-bundle' ) }
								</Text>
								<HStack spacing={ 2 } expanded={ false }>
									{ presets.map( ( preset ) => {
										const isActive =
											parseFloat( discount.value ) ===
											preset;
										return (
											<Button
												key={ preset }
												variant={
													isActive
														? 'primary'
														: 'secondary'
												}
												onClick={ () =>
													onChange( {
														...discount,
														value: preset,
													} )
												}
												style={
													isActive
														? {
																background:
																	'#7f54b3',
																borderColor:
																	'#7f54b3',
														  }
														: {
																color: '#7f54b3',
																borderColor:
																	'#7f54b3',
														  }
												}
											>
												{ formatPresetLabel(
													discount.type,
													preset
												) }
											</Button>
										);
									} ) }
								</HStack>
							</VStack>
						) }
					</HStack>

					<div
						style={ {
							background: '#fff',
							border: '1px solid #e0e0e0',
							borderRadius: 4,
							padding: 12,
							marginTop: 16,
						} }
					>
						<HStack justify="space-between">
							<Text variant="muted" size={ 13 }>
								{ sprintf(
									/* translators: %d: total reward unit count */
									__(
										'Reward Items Total (%d units):',
										'fast-bundle'
									),
									totalUnits
								) }
							</Text>
							<Text
								size={ 13 }
								style={
									savings > 0
										? {
												textDecoration:
													'line-through',
												color: '#757575',
										  }
										: {}
								}
							>
								{ formatPrice( originalTotal ) }
							</Text>
						</HStack>

						{ savings > 0 && (
							<HStack
								justify="space-between"
								style={ { marginTop: 6 } }
							>
								<Text size={ 13 } style={ { color: '#008a00' } }>
									{ __(
										'Reward Discount applied:',
										'fast-bundle'
									) }
								</Text>
								<Text size={ 13 } style={ { color: '#008a00' } }>
									{ '-' }
									{ formatPrice( savings ) }
								</Text>
							</HStack>
						) }

						<div
							style={ {
								borderTop: '1px solid #e0e0e0',
								marginTop: 10,
								paddingTop: 10,
							} }
						>
							<HStack justify="space-between" alignment="center">
								<Text weight={ 600 }>
									{ __(
										'Final Reward Price:',
										'fast-bundle'
									) }
								</Text>
								<HStack
									expanded={ false }
									spacing={ 2 }
									alignment="center"
								>
									{ savingsPercent > 0 && (
										<span
											style={ {
												background: '#e6f4ea',
												color: '#008a00',
												borderRadius: 100,
												padding: '3px 10px',
												fontSize: 12,
												fontWeight: 600,
												whiteSpace: 'nowrap',
											} }
										>
											{ sprintf(
												/* translators: %s: savings percentage */
												__(
													'Save %s%%',
													'fast-bundle'
												),
												savingsPercent.toFixed( 1 )
											) }
										</span>
									) }
									<Text weight={ 700 } size={ 18 }>
										{ formatPrice( rewardTotal ) }
									</Text>
								</HStack>
							</HStack>
						</div>
					</div>
				</div>
			) }

			{ ! needsValue && (
				<div
					style={ {
						background: '#fff',
						border: '1px solid #e0e0e0',
						borderRadius: 4,
						padding: 12,
					} }
				>
					<HStack justify="space-between" alignment="center">
						<Text weight={ 600 }>
							{ __( 'Final Reward Price:', 'fast-bundle' ) }
						</Text>
						<Text weight={ 700 } size={ 18 }>
							{ formatPrice( rewardTotal ) }
						</Text>
					</HStack>
				</div>
			) }
		</VStack>
	);
};

export default RewardDiscount;
