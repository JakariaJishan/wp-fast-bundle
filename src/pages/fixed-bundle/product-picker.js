import apiFetch from '@wordpress/api-fetch';
import {
	Button,
	__experimentalHStack as HStack,
	__experimentalText as Text,
	TextControl,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { close } from '@wordpress/icons';

/**
 * Bundle item product picker: search WooCommerce products, add them to the
 * bundle with a quantity, remove them. Simple products only for now —
 * variable products are filtered out of the search results.
 *
 * @param {Object}   props
 * @param {Array}    props.items    Selected bundle items: `{ product_id, quantity, name, image, price, permalink }`.
 * @param {Function} props.onChange Called with the next `items` array.
 */
const ProductPicker = ( { items, onChange } ) => {
	const [ term, setTerm ] = useState( '' );
	const [ results, setResults ] = useState( [] );
	const [ isSearching, setIsSearching ] = useState( false );
	const [ isOpen, setIsOpen ] = useState( false );
	const abortRef = useRef();

	useEffect( () => {
		if ( ! term || term.trim().length < 2 ) {
			setResults( [] );
			return;
		}

		const timeout = setTimeout( () => {
			abortRef.current?.abort();
			const controller = new AbortController();
			abortRef.current = controller;

			setIsSearching( true );
			apiFetch( {
				method: 'POST',
				path: '/fbnd/product_search',
				data: {
					term,
					limit: 10,
					excludes: items.map( ( item ) => item.product_id ),
				},
				signal: controller.signal,
			} )
				.then( ( response ) => {
					const products = Array.isArray( response ) ? response : [];
					setResults( products.filter( ( p ) => ! p.isVariable ) );
					setIsOpen( true );
				} )
				.catch( () => {} )
				.finally( () => setIsSearching( false ) );
		}, 300 );

		return () => clearTimeout( timeout );
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ term ] );

	const addItem = ( product ) => {
		onChange( [
			...items,
			{
				product_id: product.id,
				quantity: 1,
				name: product.value,
				image: product.img,
				price: product.sale || product.regular || 0,
				permalink: product.url,
			},
		] );
		setTerm( '' );
		setResults( [] );
		setIsOpen( false );
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
			<div style={ { position: 'relative' } }>
				<TextControl
					__nextHasNoMarginBottom
					label={ __( 'Add products to this bundle', 'fast-bundle' ) }
					placeholder={ __( 'Search products…', 'fast-bundle' ) }
					value={ term }
					onChange={ setTerm }
					onFocus={ () => results.length && setIsOpen( true ) }
				/>
				{ isOpen && ( isSearching || results.length > 0 ) && (
					<div
						style={ {
							position: 'absolute',
							top: '100%',
							left: 0,
							right: 0,
							zIndex: 30,
							background: '#fff',
							border: '1px solid #ddd',
							borderRadius: 4,
							maxHeight: 260,
							overflowY: 'auto',
							boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
						} }
					>
						{ isSearching && (
							<div style={ { padding: 12 } }>
								<Text variant="muted">
									{ __( 'Searching…', 'fast-bundle' ) }
								</Text>
							</div>
						) }
						{ ! isSearching &&
							results.map( ( product ) => (
								<Button
									key={ product.id }
									onClick={ () => addItem( product ) }
									style={ {
										width: '100%',
										justifyContent: 'flex-start',
										padding: '8px 12px',
										height: 'auto',
									} }
								>
									<HStack spacing={ 2 } alignment="center">
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
									</HStack>
								</Button>
							) ) }
					</div>
				) }
			</div>

			{ items.length === 0 ? (
				<Text variant="muted">
					{ __(
						'No products added yet. Search above to add the first one.',
						'fast-bundle'
					) }
				</Text>
			) : (
				<VStack spacing={ 2 }>
					{ items.map( ( item ) => (
						<HStack
							key={ item.product_id }
							justify="space-between"
							style={ {
								padding: '8px 12px',
								border: '1px solid #e0e0e0',
								borderRadius: 4,
							} }
						>
							<HStack spacing={ 2 } alignment="center" justify="start">
								{ item.image && (
									<img
										src={ item.image }
										alt=""
										style={ {
											width: 32,
											height: 32,
											objectFit: 'cover',
											borderRadius: 2,
										} }
									/>
								) }
								<Text truncate>{ item.name }</Text>
							</HStack>
							<HStack spacing={ 2 } expanded={ false } justify="end">
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
									style={ { width: 56, height: 30 } }
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
				</VStack>
			) }
		</VStack>
	);
};

export default ProductPicker;
