import { assignType } from '@/store/editor/slices/settingsSlice';
import useEditorStore from '@/store/editor/useEditorStore';
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
import { close } from '@wordpress/icons';

const SEARCH_TYPE_BY_ASSIGN_TYPE = {
	specific_product: 'products',
	specific_category: 'cat',
};

// Card copy for the targeting-rule grid — kept separate from `assignType`'s
// generic store labels so this view can show the fuller title/description
// pairing without changing what's persisted (`assignType[].value` is still
// what's saved).
const CARD_COPY_BY_ASSIGN_TYPE = {
	all_product: {
		title: __( 'All Products', 'fast-bundle' ),
		description: __(
			'Display this on every single product page.',
			'fast-bundle'
		),
	},
	specific_product: {
		title: __( 'Specific Products', 'fast-bundle' ),
		description: __(
			'Only trigger on designated anchor products.',
			'fast-bundle'
		),
	},
	specific_category: {
		title: __( 'Specific Categories', 'fast-bundle' ),
		description: __(
			'Show on products under selected taxonomy terms.',
			'fast-bundle'
		),
	},
};

const LABEL_BY_ASSIGN_TYPE = {
	specific_product: {
		modalTitle: __( 'Add products', 'fast-bundle' ),
		search: __( 'Search products…', 'fast-bundle' ),
		empty: __( 'No products found.', 'fast-bundle' ),
		sectionTitle: __( 'Trigger Products', 'fast-bundle' ),
		sectionHint: __(
			'(Bundle is displayed on these product pages)',
			'fast-bundle'
		),
		addChipText: __( '+ Add product…', 'fast-bundle' ),
		footerHint: __(
			'Type a product name or SKU to add more target pages.',
			'fast-bundle'
		),
	},
	specific_category: {
		modalTitle: __( 'Add categories', 'fast-bundle' ),
		search: __( 'Search categories…', 'fast-bundle' ),
		empty: __( 'No categories found.', 'fast-bundle' ),
		sectionTitle: __( 'Trigger Categories', 'fast-bundle' ),
		sectionHint: __(
			'(Bundle is displayed on products in these categories)',
			'fast-bundle'
		),
		addChipText: __( '+ Add category…', 'fast-bundle' ),
		footerHint: __(
			'Type a category name to add more target categories.',
			'fast-bundle'
		),
	},
};

/**
 * Which product(s) show this bundle — reuses the same assignment system
 * (and REST endpoints) the generic Option Sets already use, via the shared
 * `useEditorStore` settings slice. The search/pick flow (modal, checkbox
 * multi-select, thumbnails) mirrors the product-picker's, so both bundle
 * types feel the same whether picking bundle items or assignment targets.
 */
const AssignPanel = () => {
	const assignedData = useEditorStore( ( state ) => state.assignedData );
	const handleAssignedData = useEditorStore(
		( state ) => state.handleAssignedData
	);

	const aType = assignedData.aType || 'all_product';
	const includes = assignedData.includes || [];
	const searchType = SEARCH_TYPE_BY_ASSIGN_TYPE[ aType ];
	const labels = LABEL_BY_ASSIGN_TYPE[ aType ] || {};

	const cardOptions = assignType
		.filter( ( type ) => ! type.isPro )
		.map( ( type ) => ( {
			...type,
			...( CARD_COPY_BY_ASSIGN_TYPE[ type.value ] || {
				title: type.label,
			} ),
		} ) );

	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const [ term, setTerm ] = useState( '' );
	const [ results, setResults ] = useState( [] );
	const [ isSearching, setIsSearching ] = useState( false );
	// Keyed by item id so re-searching doesn't lose earlier picks.
	const [ selected, setSelected ] = useState( {} );
	const abortRef = useRef();

	const runSearch = ( searchTerm ) => {
		if ( ! searchType ) {
			return;
		}
		abortRef.current?.abort();
		const controller = new AbortController();
		abortRef.current = controller;

		setIsSearching( true );
		apiFetch( {
			method: 'POST',
			path: '/fbnd/assign_search',
			data: { type: searchType, term: searchTerm, limit: 20 },
			signal: controller.signal,
		} )
			.then( ( response ) => {
				const items = Array.isArray( response?.data )
					? response.data
					: [];
				setResults(
					items.filter(
						( item ) =>
							! includes.some(
								( i ) => i.item_id === item.item_id
							)
					)
				);
			} )
			.catch( () => {} )
			.finally( () => setIsSearching( false ) );
	};

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

	const toggleSelected = ( item ) => {
		setSelected( ( prev ) => {
			const next = { ...prev };
			if ( next[ item.item_id ] ) {
				delete next[ item.item_id ];
			} else {
				next[ item.item_id ] = item;
			}
			return next;
		} );
	};

	const selectedItems = Object.values( selected );

	const applySelection = () => {
		if ( selectedItems.length === 0 ) {
			return;
		}

		handleAssignedData( 'includes', [ ...includes, ...selectedItems ] );
		closeModal();
	};

	const removeInclude = ( itemId ) => {
		handleAssignedData(
			'includes',
			includes.filter( ( i ) => i.item_id !== itemId )
		);
	};

	return (
		<VStack spacing={ 4 }>
			<HStack
				justify="space-between"
				alignment="baseline"
				style={ {
					paddingBottom: 12,
					borderBottom: '1px solid #e0e0e0',
				} }
			>
				<Text weight={ 600 } size={ 16 }>
					{ __( 'Targeting & Display Rules', 'fast-bundle' ) }
				</Text>
				<Text variant="muted" size={ 13 }>
					{ __( 'Where this widget appears', 'fast-bundle' ) }
				</Text>
			</HStack>

			<div
				style={ {
					display: 'grid',
					gridTemplateColumns: 'repeat(2, 1fr)',
					gap: 12,
				} }
			>
				{ cardOptions.map( ( option, index ) => {
					const isSelected = option.value === aType;
					const isLastOdd =
						index === cardOptions.length - 1 &&
						cardOptions.length % 2 !== 0;

					return (
						<div
							key={ option.value }
							role="radio"
							aria-checked={ isSelected }
							tabIndex={ 0 }
							onClick={ () =>
								handleAssignedData( 'aType', option.value )
							}
							onKeyDown={ ( e ) => {
								if ( e.key === 'Enter' || e.key === ' ' ) {
									e.preventDefault();
									handleAssignedData(
										'aType',
										option.value
									);
								}
							} }
							style={ {
								gridColumn: isLastOdd ? '1 / -1' : undefined,
								display: 'flex',
								gap: 10,
								alignItems: 'flex-start',
								padding: '14px 16px',
								border: isSelected
									? '2px solid #2271b1'
									: '1px solid #ddd',
								borderRadius: 6,
								background: isSelected ? '#f0f6fc' : '#fff',
								cursor: 'pointer',
							} }
						>
							<span
								style={ {
									width: 16,
									height: 16,
									borderRadius: '50%',
									border: isSelected
										? '5px solid #2271b1'
										: '1.5px solid #949494',
									flexShrink: 0,
									marginTop: 2,
									boxSizing: 'border-box',
									background: '#fff',
								} }
							/>
							<VStack spacing={ 1 }>
								<Text
									weight={ 600 }
									style={ {
										color: isSelected
											? '#2271b1'
											: '#1e1e1e',
									} }
								>
									{ option.title }
								</Text>
								<Text variant="muted" size={ 12 }>
									{ option.description }
								</Text>
							</VStack>
						</div>
					);
				} ) }
			</div>

			{ searchType && (
				<VStack spacing={ 2 }>
					{ isModalOpen && (
						<Modal
							title={ labels.modalTitle }
							onRequestClose={ closeModal }
							size="medium"
						>
							<VStack spacing={ 4 }>
								<TextControl
									__nextHasNoMarginBottom
									placeholder={ labels.search }
									value={ term }
									onChange={ setTerm }
								/>

								{ selectedItems.length > 0 && (
									<HStack spacing={ 2 } wrap justify="start">
										{ selectedItems.map( ( item ) => (
											<HStack
												key={ item.item_id }
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
													{ item.item_name }
												</Text>
												<Button
													icon={ close }
													size="small"
													label={ __(
														'Unselect',
														'fast-bundle'
													) }
													onClick={ () =>
														toggleSelected( item )
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
									{ ! isSearching &&
										results.length === 0 && (
											<Text
												variant="muted"
												style={ {
													display: 'block',
													padding: 16,
												} }
											>
												{ labels.empty }
											</Text>
										) }
									{ ! isSearching &&
										results.map( ( item ) => (
											<HStack
												key={ item.item_id }
												style={ { padding: 8 } }
											>
												<CheckboxControl
													__nextHasNoMarginBottom
													checked={
														!! selected[
															item.item_id
														]
													}
													onChange={ () =>
														toggleSelected( item )
													}
													style={ {
														padding: '8px 12px',
													} }
												/>
												<HStack
													spacing={ 2 }
													align="center"
													justify="start"
												>
													{ item.thumbnail && (
														<img
															src={
																item.thumbnail
															}
															alt=""
															style={ {
																width: 28,
																height: 28,
																objectFit:
																	'cover',
																borderRadius: 2,
															} }
														/>
													) }
													<Text>
														{ item.item_name }
													</Text>
												</HStack>
											</HStack>
										) ) }
								</VStack>

								<HStack justify="space-between">
									<Text variant="muted">
										{ sprintf(
											/* translators: %d: number of selected items */
											__(
												'%d selected',
												'fast-bundle'
											),
											selectedItems.length
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
											disabled={
												selectedItems.length === 0
											}
										>
											{ __( 'Apply', 'fast-bundle' ) }
										</Button>
									</HStack>
								</HStack>
							</VStack>
						</Modal>
					) }

					<HStack spacing={ 1 } alignment="baseline" justify="start">
						<Text weight={ 600 } size={ 13 }>
							{ labels.sectionTitle }
						</Text>
						<Text variant="muted" size={ 12 }>
							{ labels.sectionHint }
						</Text>
					</HStack>

					<div
						style={ {
							border: '1px solid #ddd',
							borderRadius: 4,
							padding: 8,
							display: 'flex',
							flexWrap: 'wrap',
							gap: 8,
							alignItems: 'center',
							minHeight: 44,
							boxSizing: 'border-box',
						} }
					>
						{ includes.map( ( item ) => (
							<HStack
								key={ item.item_id }
								expanded={ false }
								spacing={ 1 }
								style={ {
									padding: '6px 10px',
									borderRadius: 4,
									background: '#f0f0f0',
								} }
							>
								<Text size={ 13 } truncate style={ { maxWidth: 200 } }>
									{ item.item_name }
								</Text>
								<Button
									icon={ close }
									size="small"
									label={ __( 'Remove', 'fast-bundle' ) }
									onClick={ () =>
										removeInclude( item.item_id )
									}
								/>
							</HStack>
						) ) }
						<Button
							variant="link"
							onClick={ openModal }
							style={ { paddingLeft: 4 } }
						>
							{ labels.addChipText }
						</Button>
					</div>

					<Text variant="muted" size={ 12 }>
						{ labels.footerHint }
					</Text>
				</VStack>
			) }
		</VStack>
	);
};

export default AssignPanel;
