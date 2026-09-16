import apiFetch from '@wordpress/api-fetch';
import {
	Button,
	CheckboxControl,
	__experimentalHStack as HStack,
	Modal,
	Spinner,
	__experimentalText as Text,
	TextControl,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useEffect, useRef, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { close, dragHandle, Icon, trash } from '@wordpress/icons';

import { formatPrice } from './format-price';

/**
 * Shared product picker used by every offer type's builder (Fixed Bundle's
 * items, Buy X Get Y's triggers and rewards, ...): a header shows the item
 * count and a live catalog subtotal, a search row opens a modal with a
 * searchable, checkbox-selectable product list, and the picked products are
 * listed below with their SKU, stock and per-unit price plus a quantity
 * stepper. Variable products are supported — the shopper picks a specific
 * variation on the storefront later, so the picker only needs an estimated
 * (cheapest-variation) price for the editor's own totals.
 *
 * @param {Object}   props
 * @param {Array}    props.items             Selected items: `{ product_id, quantity, name, image, price, permalink, is_variable, sku, stockStatus, manageStock, stockQuantity }`.
 * @param {Function} props.onChange          Called with the next `items` array.
 * @param {string}   [props.title]           Heading shown above the list, with the item count badge.
 * @param {string}   [props.description]     Helper text shown under the heading.
 * @param {string}   [props.label]           Modal title / accessible label for the "Add Products" flow.
 * @param {string}   [props.addButtonText]   Text on the "Add Product" trigger button.
 * @param {string}   [props.searchPlaceholder] Placeholder for the inline search row.
 * @param {string}   [props.emptyText]       Shown when `items` is empty.
 * @param {string}   [props.totalLabel]      Label for the footer's price total.
 */

/**
 * A variable product's parent has no single price — estimate with the
 * cheapest available variation, same convention the PHP hydration
 * (`Fixed_Bundle::get_items()`/`Buy_X_Get_Y::hydrate_items()`) uses for its
 * own pre-selection display estimate.
 *
 * @param {Object} product A `/fbnd/product_search` result row.
 * @return {number} Estimated unit price.
 */
const getDisplayPrice = ( product ) => {
	if ( product.isVariable ) {
		const prices = ( product.variation || [] )
			.map( ( variation ) =>
				parseFloat( variation.sale || variation.regular )
			)
			.filter( ( price ) => ! isNaN( price ) );
		return prices.length ? Math.min( ...prices ) : 0;
	}
	return parseFloat( product.sale || product.regular ) || 0;
};

/**
 * Maps a picked item's saved stock fields to display text/color, mirroring
 * WooCommerce's own stock statuses (`instock`, `outofstock`, `onbackorder`).
 *
 * @param {Object} item A selected item.
 * @return {{text: string, color: string}} What to render for stock state.
 */
const getStockDisplay = ( item ) => {
	if ( item.stockStatus === 'outofstock' ) {
		return { text: __( 'Out of Stock', 'fast-bundle' ), color: '#cc1818' };
	}
	if ( item.stockStatus === 'onbackorder' ) {
		return { text: __( 'On Backorder', 'fast-bundle' ), color: '#b26200' };
	}
	if (
		item.manageStock &&
		item.stockQuantity !== null &&
		item.stockQuantity !== undefined
	) {
		return {
			text: sprintf(
				/* translators: %d: available stock quantity */
				__( 'In Stock (%d)', 'fast-bundle' ),
				item.stockQuantity
			),
			color: '#008a00',
		};
	}
	return { text: __( 'In Stock', 'fast-bundle' ), color: '#008a00' };
};

const ProductPicker = ( {
	items,
	onChange,
	title,
	description = __(
		'Search and add items to sell together. The price and inventory will automatically recalculate.',
		'fast-bundle'
	),
	label = __( 'Add products to this bundle', 'fast-bundle' ),
	addButtonText = __( 'Add Product', 'fast-bundle' ),
	searchPlaceholder = __(
		'Search products by title or SKU to add…',
		'fast-bundle'
	),
	emptyText = __(
		'No products added yet. Click "Add Product" to add the first one.',
		'fast-bundle'
	),
	totalLabel = __( 'Catalog Subtotal', 'fast-bundle' ),
} ) => {
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const [ term, setTerm ] = useState( '' );
	const [ results, setResults ] = useState( [] );
	const [ isSearching, setIsSearching ] = useState( false );
	// Keyed by product id so re-searching doesn't lose earlier picks.
	const [ selected, setSelected ] = useState( {} );
	const [ isReordering, setIsReordering ] = useState( false );
	const abortRef = useRef();
	const dragIndexRef = useRef( null );

	const runSearch = ( searchTerm ) => {
		abortRef.current?.abort();
		const controller = new AbortController();
		abortRef.current = controller;

		setIsSearching( true );
		apiFetch( {
			method: 'POST',
			path: '/fbnd/product_search',
			data: {
				term: searchTerm,
				limit: 10,
				excludes: items.map( ( item ) => item.product_id ),
			},
			signal: controller.signal,
		} )
			.then( ( response ) => {
				const products = Array.isArray( response ) ? response : [];
				setResults( products );
			} )
			.catch( () => {} )
			.finally( () => setIsSearching( false ) );
	};

	// Typing a term re-searches (debounced); an empty term shows the default
	// top-10 list, same as when the modal first opens.
	useEffect( () => {
		if ( ! isModalOpen ) {
			return;
		}

		const timeout = setTimeout( () => runSearch( term.trim() ), 300 );

		return () => clearTimeout( timeout );
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ term, isModalOpen ] );

	const openModal = () => {
		setTerm( '' );
		setSelected( {} );
		setIsModalOpen( true );
		runSearch( '' );
	};

	const closeModal = () => {
		abortRef.current?.abort();
		setIsModalOpen( false );
	};

	const toggleSelected = ( product ) => {
		setSelected( ( prev ) => {
			const next = { ...prev };
			if ( next[ product.id ] ) {
				delete next[ product.id ];
			} else {
				next[ product.id ] = product;
			}
			return next;
		} );
	};

	const selectedProducts = Object.values( selected );

	const applySelection = () => {
		if ( selectedProducts.length === 0 ) {
			return;
		}

		onChange( [
			...items,
			...selectedProducts.map( ( product ) => ( {
				product_id: product.id,
				quantity: 1,
				name: product.value,
				image: product.img,
				price: getDisplayPrice( product ),
				permalink: product.url,
				is_variable: !! product.isVariable,
				sku: product.sku || '',
				stockStatus: product.stockStatus || 'instock',
				manageStock: !! product.manageStock,
				stockQuantity:
					product.stockQuantity === undefined
						? null
						: product.stockQuantity,
			} ) ),
		] );
		closeModal();
	};

	const removeItem = ( productId ) => {
		onChange( items.filter( ( item ) => item.product_id !== productId ) );
	};

	const setQuantity = ( productId, quantity ) => {
		const next = Math.max( 1, parseInt( quantity, 10 ) || 1 );
		onChange(
			items.map( ( item ) =>
				item.product_id === productId
					? { ...item, quantity: next }
					: item
			)
		);
	};

	const handleDragStart = ( index ) => ( e ) => {
		dragIndexRef.current = index;
		e.dataTransfer.effectAllowed = 'move';
	};

	const handleDragOver = ( e ) => {
		e.preventDefault();
	};

	const handleDrop = ( index ) => ( e ) => {
		e.preventDefault();
		const from = dragIndexRef.current;
		dragIndexRef.current = null;
		if ( from === null || from === index ) {
			return;
		}
		const next = [ ...items ];
		const [ moved ] = next.splice( from, 1 );
		next.splice( index, 0, moved );
		onChange( next );
	};

	const totalUnits = items.reduce(
		( sum, item ) => sum + ( parseInt( item.quantity, 10 ) || 0 ),
		0
	);
	const catalogSubtotal = items.reduce(
		( sum, item ) =>
			sum +
			( parseFloat( item.price ) || 0 ) *
				( parseInt( item.quantity, 10 ) || 0 ),
		0
	);

	return (
		<VStack spacing={ 3 }>
			{ isModalOpen && (
				<Modal
					title={ label }
					onRequestClose={ closeModal }
					size="medium"
				>
					<VStack spacing={ 4 }>
						<TextControl
							__nextHasNoMarginBottom
							placeholder={ __(
								'Search products…',
								'fast-bundle'
							) }
							value={ term }
							onChange={ setTerm }
						/>

						{ selectedProducts.length > 0 && (
							<HStack spacing={ 2 } wrap justify="start">
								{ selectedProducts.map( ( product ) => (
									<HStack
										key={ product.id }
										expanded={ false }
										spacing={ 1 }
										style={ {
											padding: '4px 8px',
											borderRadius: 100,
											background: '#f0f0f0',
										} }
									>
										<Text
											size={ 12 }
											truncate
											style={ { maxWidth: 140 } }
										>
											{ product.value }
										</Text>
										<Button
											icon={ close }
											size="small"
											label={ __(
												'Unselect',
												'fast-bundle'
											) }
											onClick={ () =>
												toggleSelected( product )
											}
										/>
									</HStack>
								) ) }
							</HStack>
						) }

						<VStack>
							{ isSearching && (
								<HStack
									justify="center"
									style={ { padding: 24 } }
								>
									<Spinner />
								</HStack>
							) }
							{ ! isSearching && results.length === 0 && (
								<Text
									variant="muted"
									style={ { display: 'block', padding: 16 } }
								>
									{ __(
										'No products found.',
										'fast-bundle'
									) }
								</Text>
							) }
							{ ! isSearching &&
								results.map( ( product ) => (
									<HStack
										key={ product.id }
										style={ {
											padding: 8,
										} }
									>
										<CheckboxControl
											__nextHasNoMarginBottom
											checked={
												!! selected[ product.id ]
											}
											onChange={ () =>
												toggleSelected( product )
											}
											style={ { padding: '8px 12px' } }
										/>
										<HStack
											spacing={ 2 }
											align="center"
											justify="start"
										>
											{ product.img && (
												<img
													src={ product.img }
													alt=""
													style={ {
														width: 28,
														height: 28,
														objectFit: 'cover',
														borderRadius: 2,
													} }
												/>
											) }
											<Text>{ product.value }</Text>
											{ product.sku && (
												<Text
													variant="muted"
													size={ 12 }
													style={ {
														padding: '2px 6px',
														borderRadius: 4,
														background: '#f0f0f0',
													} }
												>
													{ product.sku }
												</Text>
											) }
											{ product.isVariable && (
												<Text
													variant="muted"
													size={ 12 }
													style={ {
														padding: '2px 6px',
														borderRadius: 100,
														background: '#f0f0f0',
													} }
												>
													{ __(
														'Variable',
														'fast-bundle'
													) }
												</Text>
											) }
										</HStack>
									</HStack>
								) ) }
						</VStack>

						<HStack justify="space-between">
							<Text variant="muted">
								{ sprintf(
									/* translators: %d: number of selected products */
									__( '%d selected', 'fast-bundle' ),
									selectedProducts.length
								) }
							</Text>
							<HStack expanded={ false } justify="end">
								<Button
									variant="tertiary"
									onClick={ closeModal }
								>
									{ __( 'Cancel', 'fast-bundle' ) }
								</Button>
								<Button
									variant="primary"
									onClick={ applySelection }
									disabled={ selectedProducts.length === 0 }
								>
									{ __( 'Apply', 'fast-bundle' ) }
								</Button>
							</HStack>
						</HStack>
					</VStack>
				</Modal>
			) }

			<HStack justify="space-between" alignment="center">
				<HStack expanded={ false } spacing={ 2 } alignment="center">
					{ title && (
						<Text weight={ 600 } size={ 15 }>
							{ title }
						</Text>
					) }
					<Text
						size={ 12 }
						style={ {
							padding: '2px 10px',
							borderRadius: 100,
							background: '#f0f0f0',
							color: '#555',
							fontWeight: 500,
						} }
					>
						{ sprintf(
							/* translators: %d: number of items in the list */
							_n( '%d Item', '%d Items', items.length, 'fast-bundle' ),
							items.length
						) }
					</Text>
				</HStack>
				{ items.length > 1 && (
					<Button
						variant="link"
						onClick={ () => setIsReordering( ( prev ) => ! prev ) }
					>
						{ isReordering
							? __( 'Done', 'fast-bundle' )
							: __( 'Reorder', 'fast-bundle' ) }
					</Button>
				) }
			</HStack>

			{ description && (
				<Text variant="muted" size={ 13 }>
					{ description }
				</Text>
			) }

			<HStack spacing={ 2 } alignment="flex-start">
				<div style={ { flex: 1 } }>
					<TextControl
						__nextHasNoMarginBottom
						placeholder={ searchPlaceholder }
						value=""
						readOnly
						onFocus={ openModal }
						onClick={ openModal }
					/>
				</div>
				<Button
					variant="secondary"
					onClick={ openModal }
					style={ { flexShrink: 0 } }
				>
					{ addButtonText }
				</Button>
			</HStack>

			{ items.length === 0 ? (
				<Text variant="muted">{ emptyText }</Text>
			) : (
				<div
					style={ {
						border: '1px solid #e0e0e0',
						borderRadius: 4,
						maxHeight: 360,
						overflowY: 'auto',
					} }
				>
					{ items.map( ( item, index ) => {
						const stockDisplay = getStockDisplay( item );
						return (
							<div
								key={ item.product_id }
								draggable={ isReordering }
								onDragStart={ handleDragStart( index ) }
								onDragOver={ handleDragOver }
								onDrop={ handleDrop( index ) }
								style={ {
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'space-between',
									gap: 12,
									padding: '12px',
									borderBottom:
										index < items.length - 1
											? '1px solid #e5e5e5'
											: 'none',
									background: '#fff',
								} }
							>
								<HStack
									spacing={ 3 }
									alignment="center"
									justify="start"
									style={ { minWidth: 0 } }
								>
									{ isReordering && (
										<Icon
											icon={ dragHandle }
											size={ 18 }
											style={ {
												flexShrink: 0,
												color: '#949494',
												cursor: 'grab',
											} }
										/>
									) }
									{ item.image && (
										<img
											src={ item.image }
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
									) }
									<VStack spacing={ 0 } style={ { minWidth: 0 } }>
										<HStack
											spacing={ 2 }
											alignment="center"
											justify="start"
										>
											<Text weight={ 600 } truncate>
												{ item.name }
											</Text>
											{ item.sku && (
												<Text
													size={ 11 }
													style={ {
														padding: '2px 6px',
														borderRadius: 4,
														background: '#f0f0f0',
														color: '#555',
														flexShrink: 0,
														whiteSpace: 'nowrap',
													} }
												>
													{ item.sku }
												</Text>
											) }
										</HStack>
										<HStack
											spacing={ 1 }
											alignment="center"
											justify="start"
										>
											<Text variant="muted" size={ 12 }>
												{ sprintf(
													/* translators: %s: formatted unit price */
													__( '%s / unit', 'fast-bundle' ),
													formatPrice( item.price )
												) }
											</Text>
											<Text variant="muted" size={ 12 }>
												•
											</Text>
											<Text
												size={ 12 }
												style={ {
													color: stockDisplay.color,
													fontWeight: 500,
												} }
											>
												{ stockDisplay.text }
											</Text>
										</HStack>
									</VStack>
								</HStack>

								<HStack
									spacing={ 3 }
									expanded={ false }
									justify="end"
									style={ { flexShrink: 0 } }
								>
									<HStack
										spacing={ 0 }
										expanded={ false }
										style={ {
											border: '1px solid #ddd',
											borderRadius: 4,
											overflow: 'hidden',
										} }
									>
										<button
											type="button"
											onClick={ () =>
												setQuantity(
													item.product_id,
													item.quantity - 1
												)
											}
											disabled={ item.quantity <= 1 }
											style={ {
												width: 28,
												height: 30,
												border: 'none',
												borderRight: '1px solid #ddd',
												background: '#f6f7f7',
												cursor:
													item.quantity <= 1
														? 'not-allowed'
														: 'pointer',
											} }
										>
											−
										</button>
										<input
											type="number"
											min="1"
											value={ item.quantity }
											onChange={ ( e ) =>
												setQuantity(
													item.product_id,
													e.target.value
												)
											}
											style={ {
												width: 36,
												height: 30,
												textAlign: 'center',
												border: 'none',
												outline: 'none',
												fontWeight: 600,
											} }
										/>
										<button
											type="button"
											onClick={ () =>
												setQuantity(
													item.product_id,
													item.quantity + 1
												)
											}
											style={ {
												width: 28,
												height: 30,
												border: 'none',
												borderLeft: '1px solid #ddd',
												background: '#f6f7f7',
												cursor: 'pointer',
											} }
										>
											+
										</button>
									</HStack>
									<Text
										weight={ 600 }
										style={ {
											minWidth: 64,
											textAlign: 'right',
										} }
									>
										{ formatPrice(
											( parseFloat( item.price ) || 0 ) *
												item.quantity
										) }
									</Text>
									<Button
										icon={ trash }
										label={ __( 'Remove', 'fast-bundle' ) }
										onClick={ () =>
											removeItem( item.product_id )
										}
									/>
								</HStack>
							</div>
						);
					} ) }
				</div>
			) }

			{ items.length > 0 && (
				<HStack
					justify="space-between"
					style={ {
						paddingTop: 10,
						borderTop: '1px solid #e0e0e0',
					} }
				>
					<Text variant="muted" size={ 13 }>
						{ sprintf(
							/* translators: 1: total unit count 2: total product count */
							__(
								'Items Total: %1$d units (%2$d products)',
								'fast-bundle'
							),
							totalUnits,
							items.length
						) }
					</Text>
					<HStack expanded={ false } spacing={ 1 } justify="end">
						<Text size={ 13 }>{ totalLabel }:</Text>
						<Text size={ 13 } weight={ 600 }>
							{ formatPrice( catalogSubtotal ) }
						</Text>
					</HStack>
				</HStack>
			) }
		</VStack>
	);
};

export default ProductPicker;
