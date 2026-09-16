import { assignType } from '@/store/editor/slices/settingsSlice';
import useEditorStore from '@/store/editor/useEditorStore';
import apiFetch from '@wordpress/api-fetch';
import {
	Button,
	CheckboxControl,
	__experimentalHStack as HStack,
	Modal,
	RadioControl,
	Spinner,
	__experimentalText as Text,
	TextControl,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useEffect, useRef, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { close, plus } from '@wordpress/icons';

const SEARCH_TYPE_BY_ASSIGN_TYPE = {
	specific_product: 'products',
	specific_category: 'cat',
};

const LABEL_BY_ASSIGN_TYPE = {
	specific_product: {
		button: __( 'Add products', 'fast-bundle' ),
		search: __( 'Search products…', 'fast-bundle' ),
		empty: __( 'No products found.', 'fast-bundle' ),
	},
	specific_category: {
		button: __( 'Add categories', 'fast-bundle' ),
		search: __( 'Search categories…', 'fast-bundle' ),
		empty: __( 'No categories found.', 'fast-bundle' ),
	},
};

/**
 * Which product(s) show this bundle — reuses the same assignment system
 * (and REST endpoints) the generic Option Sets already use, via the shared
 * `useEditorStore` settings slice. Mirrors the product-picker's search UX
 * (modal, checkbox multi-select, thumbnails) so both bundle types feel the
 * same whether picking bundle items or assignment targets.
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
		<VStack spacing={ 3 }>
			<RadioControl
				label={ __( 'Show this bundle on', 'fast-bundle' ) }
				selected={ aType }
				options={ assignType
					.filter( ( type ) => ! type.isPro )
					.map( ( type ) => ( {
						label: type.label,
						value: type.value,
					} ) ) }
				onChange={ ( value ) => handleAssignedData( 'aType', value ) }
			/>

			{ searchType && (
				<VStack spacing={ 3 }>
					{ isModalOpen && (
						<Modal
							title={ labels.button }
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
									{ ! isSearching && results.length === 0 && (
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
											__( '%d selected', 'fast-bundle' ),
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

					<Button
						variant="secondary"
						icon={ plus }
						onClick={ openModal }
					>
						{ labels.button }
					</Button>

					{ includes.length > 0 && (
						<div
							style={ {
								maxHeight: 300,
								overflowY: 'auto',
							} }
						>
							{ includes.map( ( item ) => (
								<HStack
									key={ item.item_id }
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
									>
										{ item.thumbnail && (
											<img
												src={ item.thumbnail }
												alt=""
												style={ {
													width: 32,
													height: 32,
													objectFit: 'cover',
													borderRadius: 2,
												} }
											/>
										) }
										<Text truncate>{ item.item_name }</Text>
									</HStack>
									<Button
										icon={ close }
										label={ __( 'Remove', 'fast-bundle' ) }
										onClick={ () =>
											removeInclude( item.item_id )
										}
									/>
								</HStack>
							) ) }
						</div>
					) }
				</VStack>
			) }
		</VStack>
	);
};

export default AssignPanel;
