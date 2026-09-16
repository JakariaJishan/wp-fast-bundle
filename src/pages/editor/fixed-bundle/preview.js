import {
	Button,
	__experimentalHStack as HStack,
	__experimentalText as Text,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { Fragment, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

import { formatPrice } from '../format-price';
import { useVariationSwatches } from '../variation-attributes';
import { calculateTotals } from './discount-settings';

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
 * Live preview of the storefront Fixed Bundle widget, built from the
 * builder's current (unsaved) state, staged inside a mock "anchor item"
 * product-page card so it reads the way it will on the real storefront.
 * Reuses the exact markup and class names `Fixed_Bundle_Cart::render_widget()`
 * renders on the storefront — the admin app also loads that widget's
 * stylesheet — so the actual widget card (border, ribbon, item rows,
 * pricing) is a faithful preview, not an approximation. The anchor-item
 * wrapper around it, the Desktop/Mobile toggle, and the status/test-link
 * footer are editor-only chrome with no storefront equivalent.
 *
 * @param {Object} props
 * @param {string} props.title    Bundle title (falls back to a placeholder).
 * @param {Array}  props.items    Bundle items.
 * @param {Object} props.discount `{ type, value }`.
 * @param {Object} props.display  `{ description, buttonText }`.
 * @param {string} [props.status] 'draft' | 'publish', for the status footer.
 */
const FixedBundlePreview = ( { title, items, discount, display, status } ) => {
	const [ viewport, setViewport ] = useState( 'desktop' );
	const swatchesByProductId = useVariationSwatches( items );

	if ( items.length === 0 ) {
		return (
			<p style={ { color: '#757575', fontSize: 13 } }>
				{ __(
					'Add products to see a preview of the storefront widget.',
					'fast-bundle'
				) }
			</p>
		);
	}

	const totals = calculateTotals( items, discount );
	const hasSaving = totals.savings > 0;
	const savingsPercent =
		totals.originalTotal > 0
			? ( totals.savings / totals.originalTotal ) * 100
			: 0;
	const anchor = items[ 0 ];

	const statusInfo = ! title || ! title.trim()
		? { color: '#dba617', label: __( 'Draft — name this bundle', 'fast-bundle' ) }
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
					<Text
						weight={ 600 }
						size={ 11 }
						style={ { letterSpacing: 0.5 } }
					>
						{ __(
							'STOREFRONT LIVE PREVIEW',
							'fast-bundle'
						) }
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

				<div
					className="fbnd-fixed-bundle"
					style={ {
						position: 'relative',
						border: `2px solid ${ ACCENT }`,
						borderRadius: 8,
						padding: 16,
						background: '#fff',
					} }
				>
					{ hasSaving && (
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
							{ sprintf(
								/* translators: %s: formatted savings amount */
								__( 'SAVE %s', 'fast-bundle' ),
								formatPrice( totals.savings )
							) }
						</span>
					) }

					<h3
						className="fbnd-fixed-bundle__title"
						style={ { margin: '0 0 4px', fontSize: 16 } }
					>
						{ title || __( 'Fixed Bundle', 'fast-bundle' ) }
					</h3>
					{ hasSaving && (
						<Text size={ 13 } style={ { color: '#008a00' } }>
							{ sprintf(
								/* translators: %s: formatted savings amount */
								__(
									'Bundle & save %s instantly when purchased together!',
									'fast-bundle'
								),
								formatPrice( totals.savings )
							) }
						</Text>
					) }
					{ display.description && (
						<div
							className="fbnd-fixed-bundle__desc"
							dangerouslySetInnerHTML={ {
								__html: display.description,
							} }
							style={ { fontSize: 13, color: '#555', marginTop: 4 } }
						/>
					) }

					<HStack
						spacing={ 1 }
						alignment="center"
						justify="start"
						style={ { marginTop: 12, marginBottom: 12 } }
					>
						{ items.map( ( item, index ) => (
							<Fragment key={ item.product_id }>
								{ index > 0 && (
									<Text variant="muted">+</Text>
								) }
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
							</Fragment>
						) ) }
					</HStack>

					<VStack spacing={ 2 }>
						{ items.map( ( item, index ) => {
							const swatchGroups =
								swatchesByProductId[ item.product_id ] || [];
							return (
								<div
									key={ item.product_id }
									style={ {
										borderBottom:
											index < items.length - 1
												? '1px solid #f0f0f0'
												: 'none',
										paddingBottom: 8,
									} }
								>
									<HStack
										justify="space-between"
										alignment="flex-start"
									>
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
												{ index === 0
													? sprintf(
															/* translators: %s: product name */
															__(
																'This item: %s',
																'fast-bundle'
															),
															item.name
													  )
													: item.name }
												{ item.quantity > 1 &&
													` (${ item.quantity }×)` }
											</Text>
										</HStack>
										<Text
											weight={ 600 }
											style={ { flexShrink: 0 } }
										>
											{ formatPrice(
												( parseFloat( item.price ) ||
													0 ) * item.quantity
											) }
										</Text>
									</HStack>
									{ swatchGroups.length > 0 && (
										<VStack
											spacing={ 1 }
											style={ {
												marginInlineStart: 24,
												marginTop: 4,
											} }
										>
											{ swatchGroups.map( ( group ) => (
												<HStack
													key={ group.label }
													spacing={ 1 }
													alignment="center"
													justify="start"
													wrap
												>
													<Text
														variant="muted"
														size={ 12 }
													>
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
						} ) }
					</VStack>

					<HStack
						justify="space-between"
						alignment="center"
						style={ { marginTop: 12 } }
					>
						<Text variant="muted" size={ 13 }>
							{ __( 'Bundle Price:', 'fast-bundle' ) }
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
									/* translators: %s: savings percentage, rounded */
									__(
										'Instant %s%% Savings',
										'fast-bundle'
									),
									savingsPercent.toFixed( 0 )
								) }
							</span>
						) }
					</HStack>
					<HStack spacing={ 2 } alignment="baseline" justify="start">
						<Text weight={ 700 } size={ 20 }>
							{ formatPrice( totals.discountedTotal ) }
						</Text>
						{ hasSaving && (
							<Text
								variant="muted"
								style={ { textDecoration: 'line-through' } }
							>
								{ formatPrice( totals.originalTotal ) }
							</Text>
						) }
					</HStack>

					<button
						type="button"
						disabled
						className="fbnd-fixed-bundle__button"
						style={ {
							width: '100%',
							marginTop: 12,
							padding: '12px 16px',
							borderRadius: 4,
							border: 'none',
							background: '#1e1e1e',
							color: '#fff',
							fontWeight: 600,
							fontSize: 14,
							cursor: 'default',
						} }
					>
						{ display.buttonText ||
							__( 'Add Bundle to Cart', 'fast-bundle' ) }
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
							'1-Click purchase • Native WooCommerce cart session',
							'fast-bundle'
						) }
					</Text>
				</div>
				<Text
					variant="muted"
					size={ 11 }
					style={ {
						display: 'block',
						textAlign: 'center',
						marginTop: 8,
					} }
				>
					{ __(
						'Renders natively via WooCommerce hooks with zero layout shift',
						'fast-bundle'
					) }
				</Text>
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
				{ anchor.permalink && (
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

export default FixedBundlePreview;
