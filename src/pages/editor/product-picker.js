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
import { __, sprintf } from '@wordpress/i18n';
import { close, plus } from '@wordpress/icons';

/**
 * Shared product picker used by every offer type's builder (Fixed Bundle's
 * items, Buy X Get Y's triggers and rewards, ...): a button opens a modal
 * with a searchable, checkbox-selectable product list; Apply adds every
 * checked product at once. Variable products are supported — the shopper
 * picks a specific variation on the storefront later, so the picker only
 * needs an estimated (cheapest-variation) price for the editor's own totals.
 *
 * @param {Object}   props
 * @param {Array}    props.items       Selected items: `{ product_id, quantity, name, image, price, permalink, is_variable }`.
 * @param {Function} props.onChange    Called with the next `items` array.
 * @param {string}   [props.label]     Label on the "Add Products" trigger button.
 * @param {string}   [props.emptyText] Shown when `items` is empty.
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
const ProductPicker = ( {
	items,
	onChange,
	label = __( 'Add products to this bundle', 'fast-bundle' ),
	emptyText = __(
		'No products added yet. Click "Add Products" to add the first one.',
		'fast-bundle'
	),
} ) => {
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const [ term, setTerm ] = useState( '' );
	const [ results, setResults ] = useState( [] );
	const [ isSearching, setIsSearching ] = useState( false );
	// Keyed by product id so re-searching doesn't lose earlier picks.
	const [ selected, setSelected ] = useState( {} );
	const abortRef = useRef();

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
										style={ {
											padding: 8,
										} }
									>
										<CheckboxControl
											__nextHasNoMarginBottom
											key={ product.id }
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

			<Button variant="secondary" icon={ plus } onClick={ openModal }>
				{ label }
			</Button>

			{ items.length === 0 ? (
				<Text variant="muted">{ emptyText }</Text>
			) : (
				<div
					style={ {
						maxHeight: 300,
						overflowY: 'auto',
					} }
				>
					{ items.map( ( item ) => (
						<HStack
							key={ item.product_id }
							justify="space-between"
							style={ {
								padding: '8px 12px',
								border: '1px solid #e0e0e0',
								borderRadius: 4,
								boxSizing: 'border-box',
								marginBottom: 8,
							} }
						>
							<HStack
								spacing={ 2 }
								alignment="center"
								justify="start"
								style={ { minWidth: 0 } }
							>
								{ item.image && (
									<img
										src={ item.image }
										alt=""
										style={ {
											width: 32,
											height: 32,
											objectFit: 'cover',
											borderRadius: 2,
											flexShrink: 0,
										} }
									/>
								) }
								<Text truncate>{ item.name }</Text>
							</HStack>
							<HStack
								spacing={ 2 }
								expanded={ false }
								justify="end"
								style={ { flexShrink: 0 } }
							>
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
									style={ { width: 90, height: 30 } }
								/>
								<Button
									icon={ close }
									label={ __( 'Remove', 'fast-bundle' ) }
									onClick={ () =>
										removeItem( item.product_id )
									}
								/>
							</HStack>
						</HStack>
					) ) }
				</div>
			) }
		</VStack>
	);
};

export default ProductPicker;
