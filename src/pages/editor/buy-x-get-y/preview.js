import {
	Button,
	__experimentalHStack as HStack,
	__experimentalText as Text,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { Fragment, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';

import { formatPrice } from '../format-price';
import { useVariationSwatches } from '../variation-attributes';
import { calculateRewardTotals } from './reward-discount';

const PLACEHOLDER_IMAGE = () =>
	`${ fbndBackendData?.url || '' }assets/img/default-product.svg`;

const ACCENT = '#7f54b3';

/**
 * Decorative rating stars for the mock "anchor item" card — there's no real
 * review data in this plugin to attach a specific count to, so this stays a
 * generic, unlabeled rating glyph rather than a fabricated number.
 */
const PlaceholderStars = () => (
	<span
		aria-hidden="true"
		style={ { color: '#f0a500', fontSize: 13, letterSpacing: 1 } }
	>
		★★★★☆
	</span>
);

/**
 * Maps the deal's reward discount to the same three phrases
 * `Buy_X_Get_Y_Cart::get_reward_phrases()` builds server-side, so the
 * preview's headline/badge/subtitle always agree with what the storefront
 * will actually render.
 *
 * @param {Object} discount `{ type, value }`.
 * @return {{badge: string, headline: string, subtitle: string, short: string}}
 */
const getRewardPhrases = ( discount ) => {
	const value = parseFloat( discount.value ) || 0;

	if ( discount.type === 'fixed_price' ) {
		const price = formatPrice( value );
		return {
			badge: sprintf( __( '%s GIFT', 'fast-bundle' ), price ),
			headline: sprintf( __( 'AT %s', 'fast-bundle' ), price ),
			subtitle: sprintf( __( 'for %s', 'fast-bundle' ), price ),
			short: price,
		};
	}

	if ( discount.type === 'percentage' ) {
		const percent = Math.round( value );
		return {
			badge: sprintf( __( '%d%% OFF GIFT', 'fast-bundle' ), percent ),
			headline: sprintf( __( 'AT %d%% OFF', 'fast-bundle' ), percent ),
			subtitle: sprintf( __( 'at %d%% off', 'fast-bundle' ), percent ),
			short: sprintf( __( '-%d%%', 'fast-bundle' ), percent ),
		};
	}

	return {
		badge: __( 'FREE GIFT', 'fast-bundle' ),
		headline: __( 'FREE', 'fast-bundle' ),
		subtitle: __( 'free', 'fast-bundle' ),
		short: __( 'FREE', 'fast-bundle' ),
	};
};

/**
 * A reward row inside the "Your Reward(s)" step: a checkmark, name, and
 * price (struck-through original + free/discounted price), with real
 * variation swatch options when it's a variable product. Every configured
 * reward is shown as included — this plugin doesn't offer a "pick one of
 * several" reward mechanic.
 */
const RewardRow = ( { item, linePrice, originalLinePrice, isFree, swatchGroups, isLast } ) => (
	<div
		style={ {
			borderBottom: isLast ? 'none' : '1px solid #f0f0f0',
			paddingBottom: 8,
		} }
	>
		<HStack justify="space-between" alignment="flex-start">
			<HStack
				spacing={ 2 }
				alignment="flex-start"
				justify="start"
				style={ { minWidth: 0 } }
			>
				<span
					aria-hidden="true"
					style={ {
						width: 16,
						height: 16,
						borderRadius: 3,
						background: '#1e1e1e',
						color: '#fff',
						display: 'inline-flex',
						alignItems: 'center',
						justifyContent: 'center',
						fontSize: 10,
						flexShrink: 0,
						marginTop: 2,
					} }
				>
					✓
				</span>
				<Text truncate>
					{ item.name }
					{ item.quantity > 1 && ` (${ item.quantity }×)` }
				</Text>
			</HStack>
			<HStack
				spacing={ 1 }
				expanded={ false }
				alignment="baseline"
				justify="end"
				style={ { flexShrink: 0 } }
			>
				{ originalLinePrice > linePrice && (
					<Text
						variant="muted"
						size={ 12 }
						style={ { textDecoration: 'line-through' } }
					>
						{ formatPrice( originalLinePrice ) }
					</Text>
				) }
				{ isFree ? (
					<Text
						weight={ 600 }
						size={ 12 }
						style={ {
							color: '#008a00',
							background: '#e6f4ea',
							borderRadius: 100,
							padding: '2px 8px',
						} }
					>
						{ __( 'FREE', 'fast-bundle' ) }
					</Text>
				) : (
					<Text weight={ 600 }>{ formatPrice( linePrice ) }</Text>
				) }
			</HStack>
		</HStack>
		{ swatchGroups.length > 0 && (
			<VStack spacing={ 1 } style={ { marginInlineStart: 24, marginTop: 4 } }>
				{ swatchGroups.map( ( group ) => (
					<HStack
						key={ group.label }
						spacing={ 1 }
						alignment="center"
						justify="start"
						wrap
					>
						<Text variant="muted" size={ 12 }>
							{ group.label }:
						</Text>
						{ group.options.map( ( option, optionIndex ) => (
							<span
								key={ option }
								style={ {
									padding: '2px 8px',
									borderRadius: 4,
									fontSize: 12,
									border:
										optionIndex === 0
											? `1px solid ${ ACCENT }`
											: '1px solid #ddd',
									color: optionIndex === 0 ? ACCENT : '#555',
								} }
							>
								{ option }
							</span>
						) ) }
					</HStack>
				) ) }
			</VStack>
		) }
	</div>
);

/**
 * Live preview of the storefront Buy X Get Y widget, built from the
 * builder's current (unsaved) state, staged inside a mock "anchor item"
 * product-page card (the first trigger product — that's the real page this
 * widget would appear on) so it reads the way it will on the real
 * storefront. The widget card itself mirrors `Buy_X_Get_Y_Cart::render_widget()`
 * exactly: an auto-generated "Buy X Get Y ..." headline (never the deal's
 * own title), a numbered step per trigger product, and a final numbered
 * step listing every reward as included. The anchor-item wrapper,
 * Desktop/Mobile toggle, and status/test-link footer are editor-only chrome
 * with no storefront equivalent.
 *
 * @param {Object} props
 * @param {string} props.title          Deal title — admin-only; not shown on the storefront.
 * @param {Array}  props.triggers       Trigger ("buy") items.
 * @param {Array}  props.rewards        Reward ("get") items.
 * @param {Object} props.rewardDiscount `{ type, value }`.
 * @param {Object} props.display        `{ description, buttonText }`.
 * @param {string} [props.status]       'draft' | 'publish', for the status footer.
 */
const BuyXGetYPreview = ( {
	title,
	triggers,
	rewards,
	rewardDiscount,
	display,
	status,
} ) => {
	const [ viewport, setViewport ] = useState( 'desktop' );
	const allItems = [ ...triggers, ...rewards ];
	const swatchesByProductId = useVariationSwatches( allItems );

	if ( triggers.length === 0 && rewards.length === 0 ) {
		return (
			<p style={ { color: '#757575', fontSize: 13 } }>
				{ __(
					'Add trigger and reward products to see a preview of the storefront widget.',
					'fast-bundle'
				) }
			</p>
		);
	}

	const { rewardTotal, savings } = calculateRewardTotals(
		rewards,
		rewardDiscount
	);
	const triggerTotal = triggers.reduce(
		( sum, item ) => sum + ( parseFloat( item.price ) || 0 ) * item.quantity,
		0
	);
	const rewardOriginalTotal = rewards.reduce(
		( sum, item ) => sum + ( parseFloat( item.price ) || 0 ) * item.quantity,
		0
	);
	const total = triggerTotal + rewardTotal;
	const originalTotal = triggerTotal + rewardOriginalTotal;
	const hasSaving = savings > 0;
	const anchor = triggers[ 0 ] || rewards[ 0 ];

	const rewardUnitPrice = ( item ) => {
		const price = parseFloat( item.price ) || 0;
		const value = parseFloat( rewardDiscount.value ) || 0;
		if ( rewardDiscount.type === 'free' ) {
			return 0;
		}
		if ( rewardDiscount.type === 'fixed_price' ) {
			return Math.max( 0, value );
		}
		return Math.max( 0, price * ( 1 - value / 100 ) );
	};

	const triggerQty = triggers.reduce(
		( sum, item ) => sum + ( parseInt( item.quantity, 10 ) || 0 ),
		0
	);
	const rewardQty = rewards.reduce(
		( sum, item ) => sum + ( parseInt( item.quantity, 10 ) || 0 ),
		0
	);
	const phrases = getRewardPhrases( rewardDiscount );
	const headline = sprintf(
		/* translators: 1: trigger quantity 2: reward quantity 3: discount phrase, e.g. "AT 50% OFF" */
		__( 'Buy %1$d Get %2$d %3$s', 'fast-bundle' ),
		triggerQty,
		rewardQty,
		phrases.headline
	).toUpperCase();
	const triggerLabel =
		triggers.length === 1
			? triggers[ 0 ].name
			: sprintf(
					/* translators: %d: number of trigger items */
					_n( '%d item', '%d items', triggerQty, 'fast-bundle' ),
					triggerQty
			  );
	const rewardLabel =
		rewards.length === 1
			? rewards[ 0 ].name
			: sprintf(
					/* translators: %d: number of reward items */
					_n( '%d item', '%d items', rewardQty, 'fast-bundle' ),
					rewardQty
			  );
	const subtitle = sprintf(
		/* translators: 1: what to buy 2: what you get 3: discount phrase, e.g. "at 50% off" */
		__( 'Add %1$s and get %2$s %3$s!', 'fast-bundle' ),
		triggerLabel,
		rewardLabel,
		phrases.subtitle
	);

	const steps = [
		...triggers.map( ( item ) => ( { type: 'trigger', item } ) ),
		{ type: 'rewards' },
	];
	const showNumbers = steps.length > 1;

	const statusInfo =
		! title || ! title.trim()
			? {
					color: '#dba617',
					label: __( 'Draft — name this deal', 'fast-bundle' ),
			  }
			: triggers.length === 0 || rewards.length === 0
			? {
					color: '#dba617',
					label: __(
						'Draft — needs both buy and get products',
						'fast-bundle'
					),
			  }
			: status === 'publish'
			? { color: '#00a32a', label: __( 'Published', 'fast-bundle' ) }
			: { color: '#00a32a', label: __( 'Ready to Publish', 'fast-bundle' ) };

	return (
		<VStack spacing={ 3 }>
			<HStack justify="space-between" alignment="center">
				<HStack expanded={ false } spacing={ 2 } alignment="center">
					<span
						style={ {
							width: 8,
							height: 8,
							borderRadius: '50%',
							background: '#00a32a',
							display: 'inline-block',
							flexShrink: 0,
						} }
					/>
					<Text weight={ 600 } size={ 11 } style={ { letterSpacing: 0.5 } }>
						{ __( 'STOREFRONT LIVE PREVIEW', 'fast-bundle' ) }
					</Text>
				</HStack>
				<HStack
					expanded={ false }
					spacing={ 0 }
					style={ {
						border: '1px solid #ddd',
						borderRadius: 4,
						overflow: 'hidden',
					} }
				>
					{ [
						{ value: 'desktop', label: __( 'Desktop', 'fast-bundle' ) },
						{ value: 'mobile', label: __( 'Mobile', 'fast-bundle' ) },
					].map( ( option ) => (
						<button
							key={ option.value }
							type="button"
							onClick={ () => setViewport( option.value ) }
							style={ {
								padding: '4px 10px',
								fontSize: 12,
								border: 'none',
								cursor: 'pointer',
								background:
									viewport === option.value
										? '#1e1e1e'
										: '#fff',
								color:
									viewport === option.value
										? '#fff'
										: '#1e1e1e',
							} }
						>
							{ option.label }
						</button>
					) ) }
				</HStack>
			</HStack>

			<div
				style={ {
					maxWidth: viewport === 'mobile' ? 320 : '100%',
					margin: viewport === 'mobile' ? '0 auto' : 0,
				} }
			>
				{ anchor && (
					<div
						style={ {
							border: '1px solid #e0e0e0',
							borderRadius: 6,
							padding: 12,
							marginBottom: 12,
						} }
					>
						<Text
							size={ 11 }
							style={ {
								padding: '2px 8px',
								borderRadius: 4,
								background: '#f0f0f0',
								color: '#555',
								fontWeight: 600,
							} }
						>
							{ __( 'ANCHOR ITEM', 'fast-bundle' ) }
						</Text>
						<HStack
							spacing={ 2 }
							alignment="center"
							justify="start"
							style={ { marginTop: 8 } }
						>
							<img
								src={ anchor.image || PLACEHOLDER_IMAGE() }
								alt=""
								style={ {
									width: 48,
									height: 48,
									objectFit: 'cover',
									borderRadius: 4,
									border: '1px solid #e0e0e0',
									flexShrink: 0,
								} }
							/>
							<VStack spacing={ 0 }>
								<Text weight={ 600 }>{ anchor.name }</Text>
								<PlaceholderStars />
								<Text weight={ 600 }>
									{ formatPrice( anchor.price ) }
								</Text>
							</VStack>
						</HStack>
					</div>
				) }

				<div
					className="fbnd-bxgy"
					style={ {
						position: 'relative',
						border: `2px solid ${ ACCENT }`,
						borderRadius: 8,
						padding: 16,
						background: '#fff',
					} }
				>
					<span
						style={ {
							position: 'absolute',
							top: -1,
							right: -1,
							background: ACCENT,
							color: '#fff',
							fontSize: 11,
							fontWeight: 700,
							padding: '4px 10px',
							borderRadius: '0 8px 0 8px',
						} }
					>
						{ phrases.badge }
					</span>

					<HStack spacing={ 2 } alignment="flex-start" justify="start">
						<span aria-hidden="true" style={ { fontSize: 18, lineHeight: '22px' } }>
							🔥
						</span>
						<VStack spacing={ 0 } style={ { minWidth: 0 } }>
							<Text weight={ 700 } size={ 16 }>
								{ headline }
							</Text>
							<Text
								size={ 13 }
								style={ { color: '#008a00', display: 'block' } }
							>
								{ subtitle }
							</Text>
						</VStack>
					</HStack>

					{ display.description && (
						<div
							className="fbnd-bxgy__desc"
							dangerouslySetInnerHTML={ {
								__html: display.description,
							} }
							style={ { fontSize: 13, color: '#555', marginTop: 8 } }
						/>
					) }

					<HStack
						spacing={ 1 }
						alignment="center"
						justify="start"
						style={ {
							marginTop: 14,
							marginBottom: 14,
							padding: 10,
							background: '#f6f7f7',
							borderRadius: 6,
						} }
					>
						{ allItems.map( ( item, index ) => (
							<Fragment key={ item.product_id }>
								{ index > 0 && <Text variant="muted">+</Text> }
								<VStack spacing={ 0 } alignment="center">
									<div style={ { position: 'relative' } }>
										<img
											src={ item.image || PLACEHOLDER_IMAGE() }
											alt={ item.name }
											style={ {
												width: 44,
												height: 44,
												objectFit: 'cover',
												borderRadius: 4,
												border: '1px solid #e0e0e0',
											} }
										/>
										{ item.quantity > 1 && (
											<span
												style={ {
													position: 'absolute',
													top: -6,
													right: -6,
													background: '#1e1e1e',
													color: '#fff',
													fontSize: 10,
													fontWeight: 700,
													borderRadius: 100,
													padding: '1px 5px',
												} }
											>
												{ item.quantity }×
											</span>
										) }
									</div>
									{ index >= triggers.length && (
										<Text
											size={ 10 }
											weight={ 700 }
											style={ { color: ACCENT } }
										>
											{ sprintf(
												/* translators: %s: discount phrase, e.g. "-50%" or "FREE" */
												__( 'Reward (%s)', 'fast-bundle' ),
												phrases.short
											) }
										</Text>
									) }
								</VStack>
							</Fragment>
						) ) }
					</HStack>

					{ steps.map( ( step, stepIndex ) => {
						const stepNumber = showNumbers ? stepIndex + 1 : null;

						if ( step.type === 'trigger' ) {
							const item = step.item;
							const swatchGroups =
								swatchesByProductId[ item.product_id ] || [];
							const selectLabel =
								item.is_variable && swatchGroups.length > 0
									? sprintf(
											/* translators: %s: joined attribute labels, e.g. "Size & Color" */
											__( 'Select %s', 'fast-bundle' ),
											swatchGroups
												.map( ( group ) => group.label )
												.join( ' & ' )
									  )
									: item.name;

							return (
								<div
									key={ item.product_id }
									style={ {
										marginBottom: 12,
										padding: 12,
										border: '1px solid #e2e9e2',
										borderRadius: 6,
										background: '#f6f7f7',
									} }
								>
									<HStack justify="space-between" alignment="baseline">
										<Text weight={ 600 } size={ 13 }>
											{ stepNumber && `${ stepNumber }. ` }
											{ selectLabel }
											{ item.quantity > 1 &&
												sprintf(
													/* translators: %d: quantity required */
													__( ' (Qty: %d)', 'fast-bundle' ),
													item.quantity
												) }
										</Text>
										<Text weight={ 600 } size={ 14 }>
											{ formatPrice(
												( parseFloat( item.price ) || 0 ) *
													item.quantity
											) }
										</Text>
									</HStack>
									{ swatchGroups.length > 0 && (
										<VStack spacing={ 1 } style={ { marginTop: 8 } }>
											{ swatchGroups.map( ( group ) => (
												<HStack
													key={ group.label }
													spacing={ 1 }
													alignment="center"
													justify="start"
													wrap
												>
													<Text variant="muted" size={ 12 }>
														{ group.label }:
													</Text>
													{ group.options.map(
														( option, optionIndex ) => (
															<span
																key={ option }
																style={ {
																	padding:
																		'2px 8px',
																	borderRadius: 4,
																	fontSize: 12,
																	border:
																		optionIndex ===
																		0
																			? `1px solid ${ ACCENT }`
																			: '1px solid #ddd',
																	color:
																		optionIndex ===
																		0
																			? ACCENT
																			: '#555',
																} }
															>
																{ option }
															</span>
														)
													) }
												</HStack>
											) ) }
										</VStack>
									) }
								</div>
							);
						}

						return (
							<div
								key="rewards"
								style={ {
									marginBottom: 12,
									padding: 12,
									border: `2px solid ${ ACCENT }`,
									borderRadius: 6,
									background: '#f5effb',
								} }
							>
								<HStack justify="space-between" alignment="baseline">
									<Text weight={ 600 } size={ 13 } style={ { color: ACCENT } }>
										{ stepNumber && `${ stepNumber }. ` }
										{ _n(
											'Your Reward',
											'Your Rewards',
											rewards.length,
											'fast-bundle'
										) }
									</Text>
									<HStack
										expanded={ false }
										spacing={ 1 }
										alignment="baseline"
										justify="end"
									>
										<Text weight={ 700 } size={ 14 } style={ { color: ACCENT } }>
											{ formatPrice( rewardTotal ) }
										</Text>
										{ rewardTotal < rewardOriginalTotal && (
											<Text
												variant="muted"
												size={ 12 }
												style={ { textDecoration: 'line-through' } }
											>
												{ formatPrice( rewardOriginalTotal ) }
											</Text>
										) }
									</HStack>
								</HStack>
								<VStack spacing={ 2 } style={ { marginTop: 8 } }>
									{ rewards.map( ( item, index ) => {
										const unitPrice = rewardUnitPrice( item );
										return (
											<RewardRow
												key={ item.product_id }
												item={ item }
												linePrice={ unitPrice * item.quantity }
												originalLinePrice={
													( parseFloat( item.price ) || 0 ) *
													item.quantity
												}
												isFree={ 0 === unitPrice }
												swatchGroups={
													swatchesByProductId[
														item.product_id
													] || []
												}
												isLast={ index === rewards.length - 1 }
											/>
										);
									} ) }
								</VStack>
							</div>
						);
					} ) }

					<HStack
						justify="space-between"
						alignment="center"
						style={ { marginTop: 4 } }
					>
						<Text variant="muted" size={ 13 }>
							{ __( 'Total Deal Price:', 'fast-bundle' ) }
						</Text>
						{ hasSaving && (
							<span
								style={ {
									background: '#e6f4ea',
									color: '#008a00',
									borderRadius: 100,
									padding: '2px 10px',
									fontSize: 12,
									fontWeight: 600,
								} }
							>
								{ sprintf(
									/* translators: %s: formatted savings amount */
									__( 'Saved %s', 'fast-bundle' ),
									formatPrice( savings )
								) }
							</span>
						) }
					</HStack>
					<HStack spacing={ 2 } alignment="baseline" justify="start">
						<Text weight={ 700 } size={ 20 }>
							{ formatPrice( total ) }
						</Text>
						{ hasSaving && (
							<Text
								variant="muted"
								style={ { textDecoration: 'line-through' } }
							>
								{ formatPrice( originalTotal ) }
							</Text>
						) }
					</HStack>

					<button
						type="button"
						disabled
						className="fbnd-bxgy__button"
						style={ {
							width: '100%',
							marginTop: 12,
							padding: '12px 16px',
							borderRadius: 4,
							border: 'none',
							background: ACCENT,
							color: '#fff',
							fontWeight: 600,
							fontSize: 14,
							cursor: 'default',
						} }
					>
						{ '🛒 ' }
						{ display.buttonText ||
							__( 'Add Deal to Cart', 'fast-bundle' ) }
					</button>
					<Text
						variant="muted"
						size={ 11 }
						style={ {
							display: 'block',
							textAlign: 'center',
							marginTop: 6,
						} }
					>
						{ __(
							'Instant cart bundle rule applied • WooCommerce native checkout',
							'fast-bundle'
						) }
					</Text>
				</div>
			</div>

			<HStack
				justify="space-between"
				alignment="center"
				style={ { paddingTop: 10, borderTop: '1px solid #e0e0e0' } }
			>
				<HStack expanded={ false } spacing={ 2 } alignment="center">
					<span
						style={ {
							width: 8,
							height: 8,
							borderRadius: '50%',
							background: statusInfo.color,
							display: 'inline-block',
							flexShrink: 0,
						} }
					/>
					<Text size={ 12 }>
						{ sprintf(
							/* translators: %s: status label */
							__( 'Status: %s', 'fast-bundle' ),
							statusInfo.label
						) }
					</Text>
				</HStack>
				{ anchor?.permalink && (
					<Button
						variant="link"
						onClick={ () =>
							window.open(
								anchor.permalink,
								'_blank',
								'noopener,noreferrer'
							)
						}
					>
						{ __( 'Test PDP View', 'fast-bundle' ) }
					</Button>
				) }
			</HStack>
		</VStack>
	);
};

export default BuyXGetYPreview;
