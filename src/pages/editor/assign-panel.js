import { assignType } from '@/store/editor/slices/settingsSlice';
import useEditorStore from '@/store/editor/useEditorStore';
import apiFetch from '@wordpress/api-fetch';
import {
	Button,
	__experimentalHStack as HStack,
	RadioControl,
	__experimentalText as Text,
	TextControl,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { close } from '@wordpress/icons';

const SEARCH_TYPE_BY_ASSIGN_TYPE = {
	specific_product: 'products',
	specific_category: 'cat',
};

/**
 * Which product(s) show this bundle — reuses the same assignment system
 * (and REST endpoints) the generic Option Sets already use, via the shared
 * `useEditorStore` settings slice.
 */
const AssignPanel = () => {
	const assignedData = useEditorStore( ( state ) => state.assignedData );
	const handleAssignedData = useEditorStore(
		( state ) => state.handleAssignedData
	);

	const [ term, setTerm ] = useState( '' );
	const [ results, setResults ] = useState( [] );
	const [ isSearching, setIsSearching ] = useState( false );

	const aType = assignedData.aType || 'all_product';
	const includes = assignedData.includes || [];
	const searchType = SEARCH_TYPE_BY_ASSIGN_TYPE[ aType ];

	useEffect( () => {
		if ( ! searchType || ! term || term.trim().length < 2 ) {
			setResults( [] );
			return;
		}

		const timeout = setTimeout( () => {
			setIsSearching( true );
			apiFetch( {
				method: 'POST',
				path: '/fbnd/assign_search',
				data: { type: searchType, term, limit: 20 },
			} )
				.then( ( response ) => {
					setResults(
						Array.isArray( response?.data ) ? response.data : []
					);
				} )
				.catch( () => {} )
				.finally( () => setIsSearching( false ) );
		}, 300 );

		return () => clearTimeout( timeout );
	}, [ term, searchType ] );

	const addInclude = ( item ) => {
		if ( includes.some( ( i ) => i.item_id === item.item_id ) ) {
			return;
		}
		handleAssignedData( 'includes', [ ...includes, item ] );
		setTerm( '' );
		setResults( [] );
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
				<div style={ { position: 'relative' } }>
					<TextControl
						__nextHasNoMarginBottom
						placeholder={
							aType === 'specific_category'
								? __( 'Search categories…', 'fast-bundle' )
								: __( 'Search products…', 'fast-bundle' )
						}
						value={ term }
						onChange={ setTerm }
					/>
					{ ( isSearching || results.length > 0 ) && (
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
								maxHeight: 220,
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
								results.map( ( item ) => (
									<Button
										key={ item.item_id }
										onClick={ () => addInclude( item ) }
										style={ {
											width: '100%',
											justifyContent: 'flex-start',
											padding: '8px 12px',
											height: 'auto',
										} }
									>
										{ item.item_name }
									</Button>
								) ) }
						</div>
					) }
				</div>
			) }

			{ searchType && includes.length > 0 && (
				<VStack spacing={ 1 }>
					{ includes.map( ( item ) => (
						<HStack
							key={ item.item_id }
							justify="space-between"
							style={ {
								padding: '4px 12px',
								border: '1px solid #e0e0e0',
								borderRadius: 4,
							} }
						>
							<Text truncate>{ item.item_name }</Text>
							<Button
								icon={ close }
								size="small"
								label={ __( 'Remove', 'fast-bundle' ) }
								onClick={ () => removeInclude( item.item_id ) }
							/>
						</HStack>
					) ) }
				</VStack>
			) }
		</VStack>
	);
};

export default AssignPanel;
