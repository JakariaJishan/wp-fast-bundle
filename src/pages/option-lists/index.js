import useToastStore from '@/store/toast/useToastStore';
import apiFetch from '@wordpress/api-fetch';
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';

import AssignedShow from '@/components/assigned-show';
import { updateOptionBlockIds } from '@/utils/utils';

import { DataViews } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';

import CreateOfferButton from '@/components/create-offer-button';
import { getOfferHashPrefix, getOfferLabel, OFFER_TYPES } from '@/utils/offer-types';
import {
	Button,
	Card,
	CardBody,
	__experimentalHeading as Heading,
	__experimentalHStack as HStack,
	Icon,
	__experimentalText as Text,
	ToggleControl,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import {
	check,
	closeSmall,
	copy,
	pencil,
	trash,
	upload,
} from '@wordpress/icons';

const VIEW_PREFS_STORAGE_KEY = 'fbnd_option_list_view_prefs';
const PERSISTED_VIEW_KEYS = [ 'fields', 'sort', 'perPage', 'layout' ];
const CANONICAL_FIELD_ORDER = [
	'id',
	'title',
	'status',
	'assigned',
	'options',
];

const getStoredViewPrefs = () => {
	try {
		const stored = window.localStorage.getItem( VIEW_PREFS_STORAGE_KEY );
		const prefs = stored ? JSON.parse( stored ) : null;

		if ( prefs && Array.isArray( prefs.fields ) ) {
			prefs.fields = CANONICAL_FIELD_ORDER.filter( ( fieldId ) =>
				prefs.fields.includes( fieldId )
			);
		}

		return prefs;
	} catch {
		return null;
	}
};

const storeViewPrefs = ( view ) => {
	try {
		const prefs = {};
		PERSISTED_VIEW_KEYS.forEach( ( key ) => {
			prefs[ key ] = view[ key ];
		} );
		window.localStorage.setItem(
			VIEW_PREFS_STORAGE_KEY,
			JSON.stringify( prefs )
		);
	} catch {
		// hanlde any error.
	}
};

const OptionList = ( { setOptionId, setIsListing, setOfferType } ) => {
	const [ optionList, setOptionList ] = useState( [] );
	const [ optionListBlocks, setOptionListBlocks ] = useState( {} );
	const [ totalNav, setTotalNav ] = useState( 0 );
	const [ currentNav, setCurrent ] = useState( 1 );

	const setToastMessages = useToastStore(
		( state ) => state.setToastMessages
	);

	const [ isLoading, setIsLoading ] = useState( true );

	const [ view, setView ] = useState( () => ( {
		type: 'table',
		search: '',
		sort: {
			direction: 'desc',
			field: 'id',
		},
		perPage: 10,
		page: totalNav > 0 ? currentNav : 1,
		fields: CANONICAL_FIELD_ORDER,
		...getStoredViewPrefs(),
	} ) );

	const fetchData = useCallback(
		async ( datas ) => {
			const { isLoad, toasts } = datas || {};
			if ( isLoad ) {
				setIsLoading( true );
			}
			try {
				const obj = await apiFetch( {
					method: 'POST',
					path: '/fbnd/option_list',
					data: {
						wpnonce: fbndBackendData.nonce,
						search: view.search,
						page: view.page,
						per_page: view.perPage,
						order: view.sort.direction === 'asc' ? 'ASC' : 'DESC',
					},
				} );

				if ( obj.success ) {
					setOptionList( obj.posts );
					setOptionListBlocks( obj.all_blocks );
					setTotalNav( parseInt( obj.page ) );
					setIsLoading( false );
					if ( toasts ) {
						setToastMessages( toasts );
					}
				}
			} catch ( error ) {
				setToastMessages( {
					status: 'error',
					messages: [ error ],
					state: true,
				} );
				setIsLoading( false );
			}
		},
		[ view ]
	);
	const debounceRef = useRef( null );
	const isSearchChangeRef = useRef( false );

	useEffect( () => {
		if ( isSearchChangeRef.current ) {
			isSearchChangeRef.current = false;
			setIsLoading( true );
			if ( debounceRef.current ) {
				clearTimeout( debounceRef.current );
			}
			debounceRef.current = setTimeout( () => {
				fetchData();
			}, 400 );
			return;
		}
		fetchData();
	}, [ fetchData ] );

	const handleViewChange = ( value ) => {
		if ( value.search !== view.search ) {
			isSearchChangeRef.current = true;
			setCurrent( 1 );
		}

		let nextFields = value.fields;
		if ( Array.isArray( nextFields ) ) {
			nextFields = CANONICAL_FIELD_ORDER.filter( ( fieldId ) =>
				nextFields.includes( fieldId )
			);
		}

		const nextView = {
			...value,
			fields: nextFields,
			layout: { ...value.layout, enableMoving: false },
		};
		storeViewPrefs( nextView );
		setView( nextView );
	};

	const exportAddon = useCallback(
		( ids ) => {
			const exportData = [];
			ids.forEach( ( id ) => {
				const exportBlock = {
					id,
					title:
						optionList.find( ( item ) => item.id === id )?.title ||
						'Untitled',

					blocks: optionListBlocks[ id ]
						? updateOptionBlockIds( optionListBlocks[ id ], true )
						: [],
				};
				exportData.push( exportBlock );
			} );

			const blob = new Blob( [ JSON.stringify( exportData, null, 2 ) ], {
				type: 'application/json',
			} );
			const url = URL.createObjectURL( blob );
			const a = document.createElement( 'a' );
			a.href = url;
			const today = new Date().toISOString().split( 'T' )[ 0 ];
			a.download = `FastBundle-Lists-${ today }.json`;
			a.click();
			URL.revokeObjectURL( url );
		},
		[ optionList, optionListBlocks ]
	);

	const duplicateOption = useCallback(
		async ( id ) => {
			await apiFetch( {
				method: 'POST',
				path: '/fbnd/list_duplicate',
				data: {
					wpnonce: fbndBackendData.nonce,
					id,
					content: updateOptionBlockIds(
						optionListBlocks[ id ] || [],
						true
					),
				},
			} )
				.then( ( obj ) => {
					if ( obj.success ) {
						fetchData( {
							page: 1,
							toasts: {
								status: 'success',
								messages: [ 'Option Duplicated' ],
								state: true,
							},
						} );
						setCurrent( 1 );
					}
				} )
				.catch( () => {
					setToastMessages( {
						status: 'error',
						messages: [
							__(
								'You are not allowed to do this',
								'fast-bundle'
							),
						],
						state: true,
					} );
				} );
		},
		[ fetchData, optionListBlocks ]
	);

	const deleteOption = useCallback(
		async ( deleteBulkIds ) => {
			await apiFetch( {
				method: 'POST',
				path: '/fbnd/list_delete',
				data: {
					wpnonce: fbndBackendData.nonce,
					ids: deleteBulkIds,
				},
			} )
				.then( ( obj ) => {
					if ( obj.success ) {
						fetchData( {
							toasts: {
								status: 'success',
								messages: [ 'Option Deleted' ],
								state: true,
							},
						} );
					}
				} )
				.catch( () => {
					setToastMessages( {
						status: 'error',
						messages: [
							__(
								'You are not allowed to do this',
								'fast-bundle'
							),
						],
						state: true,
					} );
				} );
		},
		[ fetchData ]
	);

	const updateOption = useCallback(
		async ( action, updateBulkIds ) => {
			let idArray = [];
			if ( typeof updateBulkIds === 'string' ) {
				idArray = updateBulkIds
					.split( ',' )
					.map( ( id ) => Number( id.trim() ) );
			} else if ( typeof updateBulkIds === 'number' ) {
				idArray = [ updateBulkIds ];
			} else if ( Array.isArray( updateBulkIds ) ) {
				idArray = updateBulkIds.map( Number );
			}

			let clonedOptionList = [ ...optionList ];
			clonedOptionList = clonedOptionList.map( ( item ) =>
				idArray.includes( item.id )
					? { ...item, status: action === 'active' ? true : false }
					: item
			);

			setOptionList( clonedOptionList );

			await apiFetch( {
				method: 'POST',
				path: '/fbnd/list_update',
				data: {
					wpnonce: fbndBackendData.nonce,
					status: action,
					ids: updateBulkIds,
				},
			} )
				.then( ( obj ) => {
					if ( obj.success ) {
						setToastMessages( {
							status: 'success',
							messages: [
								__( 'Option Status Updated', 'fast-bundle' ),
							],
							state: true,
						} );
					}
				} )
				.catch( () => {
					setToastMessages( {
						status: 'error',
						messages: [
							__(
								'You are not allowed to do this',
								'fast-bundle'
							),
						],
						state: true,
					} );
				} );
		},
		[ optionList ]
	);

	const fields = useMemo(
		() => [
			{
				filterBy: false,
				enableSorting: false,
				enableHiding: false,
				label: __( 'ID', 'fast-bundle' ),
				id: 'id',
				type: 'integer',
				render: ( { item } ) => {
					return (
						<Button
							__next40pxDefaultSize
							variant="link"
							onClick={ () => {
								const url = new URL( window.location.href );
								const newHash = `#${ getOfferHashPrefix( item.type ) }/${ item.id }`;
								const newUrl = `${ url.pathname }${ url.search }${ newHash }`;
								window.history.pushState( {}, '', newUrl );
								setOptionId( item.id );
								setOfferType?.( item.type );
								setIsListing( false );
							} }
						>
							#{ item.id }
						</Button>
					);
				},
			},
			{
				label: __( 'Title', 'fast-bundle' ),
				id: 'title',
				type: 'text',
				filterBy: false,
				enableSorting: false,
				enableHiding: false,
				render: ( { item } ) => {
					const offerLabel = getOfferLabel( item.type );
					return (
						<HStack spacing={ 2 } justify="start" alignment="center">
							<Button
								variant="link"
								title={ item.title }
								onClick={ () => {
									const url = new URL( window.location.href );
									const newHash = `#${ getOfferHashPrefix( item.type ) }/${ item.id }`;
									const newUrl = `${ url.pathname }${ url.search }${ newHash }`;
									window.history.pushState( {}, '', newUrl );
									setOptionId( item.id );
									setOfferType?.( item.type );
									setIsListing( false );
								} }
								style={ {
									overflow: 'hidden',
									textOverflow: 'ellipsis',
									whiteSpace: 'nowrap',
									display: 'block',
									width: 'fit-content',
								} }
							>
								<span
									dangerouslySetInnerHTML={ {
										__html: item.title,
									} }
								/>
							</Button>
							{ offerLabel && (
								<span
									style={ {
										fontSize: 11,
										fontWeight: 600,
										padding: '2px 6px',
										borderRadius: 3,
										background: 'var(--fbnd-color-medium, #e8f1d0)',
										color: 'var(--fbnd-color-secondary, #46571d)',
										flexShrink: 0,
									} }
								>
									{ offerLabel }
								</span>
							) }
						</HStack>
					);
				},
			},
			{
				label: __( 'Status', 'fast-bundle' ),
				id: 'status',
				type: 'boolean',
				filterBy: false,
				enableSorting: false,
				enableHiding: false,
				render: ( { item } ) => {
					return (
						<ToggleControl
							checked={ !! item.status }
							onChange={ () =>
								updateOption(
									item.status ? 'deactive' : 'active',
									item.id
								)
							}
						/>
					);
				},
			},
			{
				label: __( 'Assigned Product', 'fast-bundle' ),
				id: 'assigned',
				type: 'text',
				filterBy: false,
				enableSorting: false,
				enableHiding: false,
				render: ( { item } ) => {
					return <AssignedShow option={ item } />;
				},
			},
			{
				label: __( 'Options Applied', 'fast-bundle' ),
				id: 'options',
				type: 'integer',
				filterBy: false,
				enableSorting: false,
				enableHiding: false,
				render: ( { item } ) => {
					if ( item.type === 'fixed_bundle' ) {
						return `${ item.options } Products`;
					}
					if ( item.type === 'buy_x_get_y' ) {
						return `${ item.options } Items`;
					}
					return `${ item.options } Options`;
				},
			},
		],
		[ setOptionId, setIsListing, setOfferType, updateOption ]
	);

	const processedData = useMemo( () => {
		return ( optionList || [] ).map( ( item ) => ( {
			...item,
			id: Number( item.id ),
			title:
				item.title && String( item.title ).trim().length
					? item.title
					: __( 'Untitled', 'fast-bundle' ),
			status: !! item.status,
			options: Number( item.options ) || 0,
		} ) );
	}, [ optionList ] );

	const ActionLabel = ( { icon, label } ) => {
		const iconRef = useRef( null );

		// useEffect( () => {
		// 	const button = iconRef.current?.closest( 'button' );
		// 	if ( ! button ) {
		// 		return;
		// 	}

		// 	button.setAttribute( 'aria-label', label );
		// 	button.setAttribute( 'title', label );
		// }, [ label ] );

		return (
			<HStack justify="start" className="fbnd-dataview-action">
				<span ref={ iconRef }>
					<Icon icon={ icon } />
				</span>
				<Text color="inherit" className="fbnd-dataview-action__text">
					{ label }
				</Text>
			</HStack>
		);
	};

	const dataViewActions = useMemo( () => {
		return [
			{
				id: 'active',
				label: () => (
					<ActionLabel
						icon={ check }
						label={ __( 'Active', 'fast-bundle' ) }
					/>
				),
				supportsBulk: true,
				callback: async ( items ) => {
					const ids = ( items || [] ).map( ( i ) => i.id );
					if ( ! ids.length ) {
						return;
					}
					await updateOption( 'active', ids.join( ',' ) );
				},
			},
			{
				id: 'deactive',
				label: () => (
					<ActionLabel
						icon={ closeSmall }
						label={ __( 'Deactivate', 'fast-bundle' ) }
					/>
				),
				supportsBulk: true,
				callback: async ( items ) => {
					const ids = ( items || [] ).map( ( i ) => i.id );
					if ( ! ids.length ) {
						return;
					}
					await updateOption( 'deactive', ids.join( ',' ) );
				},
			},
			{
				id: 'edit',
				label: () => (
					<ActionLabel
						icon={ pencil }
						label={ __( 'Edit', 'fast-bundle' ) }
					/>
				),
				isPrimary: true,
				callback: ( items ) => {
					const url = new URL( window.location.href );
					const newHash = `#${ getOfferHashPrefix( items[ 0 ].type ) }/${ items[ 0 ].id }`;
					const newUrl = `${ url.pathname }${ url.search }${ newHash }`;
					window.history.pushState( {}, '', newUrl );
					setOptionId( items[ 0 ].id );
					setOfferType?.( items[ 0 ].type );
					setIsListing( false );
				},
			},
			{
				id: 'export',
				label: () => (
					<ActionLabel
						icon={ upload }
						label={ __( 'Export', 'fast-bundle' ) }
					/>
				),
				isPrimary: true,
				supportsBulk: true,
				modalHeader: __( 'Confirm Export', 'fast-bundle' ),
				modalSize: 'small',
				RenderModal: ( { items, closeModal } ) => {
					const itemIds = ( items || [] ).map( ( i ) => i?.id );
					const isBulk = itemIds.length > 1;

					const onSubmit = ( e ) => {
						e.preventDefault();
						if ( ! itemIds.length ) {
							return;
						}
						exportAddon( itemIds );
						closeModal();
					};
					return (
						<form onSubmit={ onSubmit }>
							<VStack spacing={ 6 }>
								<Text>
									{ isBulk
										? __(
												'Are you sure you want to export these options?',
												'fast-bundle'
										  )
										: __(
												'Are you sure you want to export this option?',
												'fast-bundle'
										  ) }
								</Text>

								<HStack justify="end">
									<Button
										variant="secondary"
										onClick={ closeModal }
									>
										{ __( 'No', 'fast-bundle' ) }
									</Button>

									<Button type="submit" variant="primary">
										{ __(
											'Yes, Export',
											'fast-bundle'
										) }
									</Button>
								</HStack>
							</VStack>
						</form>
					);
				},
			},
			{
				id: 'duplicate',
				label: () => (
					<ActionLabel
						icon={ copy }
						label={ __( 'Duplicate', 'fast-bundle' ) }
					/>
				),
				isPrimary: true,
				modalHeader: __( 'Confirm Duplication', 'fast-bundle' ),
				modalSize: 'small',
				RenderModal: ( { items, closeModal } ) => {
					const onSubmit = ( e ) => {
						e.preventDefault();
						if ( ! items?.length ) {
							return;
						}
						duplicateOption( items[ 0 ].id );
						closeModal();
					};
					return (
						<form onSubmit={ onSubmit }>
							<VStack spacing={ 6 }>
								<Text>
									{ __(
										'Are you sure you want to duplicate this option?',
										'fast-bundle'
									) }
								</Text>

								<HStack justify="end">
									<Button
										variant="secondary"
										size="compact"
										onClick={ closeModal }
									>
										{ __( 'No', 'fast-bundle' ) }
									</Button>

									<Button
										type="submit"
										variant="primary"
										size="compact"
									>
										{ __(
											'Yes, Duplicate',
											'fast-bundle'
										) }
									</Button>
								</HStack>
							</VStack>
						</form>
					);
				},
			},
			{
				id: 'delete',
				label: () => (
					<ActionLabel
						icon={ trash }
						label={ __( 'Delete', 'fast-bundle' ) }
					/>
				),
				supportsBulk: true,
				isPrimary: true,
				modalHeader: __( 'Confirm Deletion', 'fast-bundle' ),
				modalSize: 'small',
				RenderModal: ( { items, closeModal } ) => {
					const itemIds = ( items || [] ).map( ( i ) => i?.id );
					const isBulk = itemIds.length > 1;

					const onSubmit = async ( e ) => {
						e.preventDefault();
						if ( ! itemIds.length ) {
							return;
						}
						await deleteOption( itemIds.join( ',' ) );
						closeModal();
					};
					return (
						<form onSubmit={ onSubmit }>
							<VStack spacing={ 6 }>
								<Text>
									{ isBulk
										? __(
												'Are you sure you want to delete these options? This action cannot be undone.',
												'fast-bundle'
										  )
										: __(
												'Are you sure you want to delete this option? This action cannot be undone.',
												'fast-bundle'
										  ) }
								</Text>

								<HStack justify="end">
									<Button
										variant="secondary"
										size="compact"
										onClick={ closeModal }
									>
										{ __( 'No', 'fast-bundle' ) }
									</Button>

									<Button
										type="submit"
										variant="primary"
										size="compact"
										isDestructive
									>
										{ __(
											'Yes, Delete',
											'fast-bundle'
										) }
									</Button>
								</HStack>
							</VStack>
						</form>
					);
				},
			},
		];
	}, [
		updateOption,
		exportAddon,
		duplicateOption,
		deleteOption,
		setOptionId,
		setIsListing,
		setOfferType,
	] );

	const paginationInfo = {
		totalItems: processedData.length,
		totalPages: totalNav,
	};

	const EmptyState = () => {
		return (
			<>
				{ ! isLoading && ! processedData.length && (
					<HStack
						direction={ 'column' }
						justify="center"
						align={ 'center' }
						spacing={ 5 }
						style={ { padding: '40px' } }
					>
						<Heading level={ 3 } weight={ 600 } size={ 25 }>
							{ __(
								'Create Your First Product Add-on',
								'fast-bundle'
							) }
						</Heading>
						<Text
							wrap
							color="#949494"
							style={ {
								maxWidth: '360px',
								textAlign: 'center',
							} }
						>
							{ __(
								'Add customizable options like checkboxes, text fields, file uploads, and more to enhance your products.',
								'fast-bundle'
							) }
						</Text>
						<HStack justify="center">
							
							{ Object.keys( OFFER_TYPES ).map( ( type ) => (
								<CreateOfferButton
									key={ type }
									type={ type }
									buttonVariant="secondary"
									buttonSize=""
								/>
							) ) }
						</HStack>
					</HStack>
				) }
			</>
		);
	};

	return (
		<div className="fbnd-container" style={ { marginTop: 40 } }>
			<Card className="fbnd-dataviews">
				<CardBody>
					<DataViews
						config={ {
							perPageSizes: [ 10, 25, 50, 100 ],
						} }
						header={
							<HStack alignment={ 'center' }>
								{ Object.keys( OFFER_TYPES ).map( ( type ) => (
									<CreateOfferButton
										key={ type }
										type={ type }
										buttonVariant="secondary"
										buttonSize=""
									/>
								) ) }
							</HStack>
						}
						view={ view }
						onChangeView={ ( viewItem ) => {
							handleViewChange( viewItem );
						} }
						fields={ fields }
						data={ processedData }
						actions={ dataViewActions }
						isLoading={ isLoading }
						paginationInfo={ paginationInfo }
						defaultLayouts={ {
							table: {
								spacing: 'normal',
								showHeader: true,
								enableMoving: false,
							},
						} }
						empty={ <EmptyState /> }
					/>
				</CardBody>
			</Card>
		</div>
	);
};

export default OptionList;
