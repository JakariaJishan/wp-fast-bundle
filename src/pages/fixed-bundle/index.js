/* eslint-disable react-hooks/exhaustive-deps */
import useEditorStore from '@/store/editor/useEditorStore';
import useToastStore from '@/store/toast/useToastStore';
import apiFetch from '@wordpress/api-fetch';
import {
	Button,
	Card,
	CardBody,
	__experimentalHeading as Heading,
	__experimentalHStack as HStack,
	Icon,
	Modal,
	Spinner,
	__experimentalText as Text,
	TextareaControl,
	TextControl,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { arrowUpLeft, check } from '@wordpress/icons';

import AssignPanel from './assign-panel';
import DiscountSettings from './discount-settings';
import ProductPicker from './product-picker';

const DEFAULT_DISCOUNT = { type: 'percentage', value: 10 };
const DEFAULT_DISPLAY = { description: '', buttonText: '' };

/**
 * Fixed Bundle admin builder: a merchant-curated, fixed set of products sold
 * together at a discount. Self-contained (its own state, not the generic
 * `blocksSlice`/canvas) because a bundle's data — items, discount, display —
 * doesn't fit the block-tree shape the generic Option Set editor uses.
 *
 * Reuses the shared `useEditorStore` settings slice only for the parts that
 * are already generic to any `fbnd_option` post: product/category
 * assignment (`assignedData`, `fetchAssignedProducts`, `setAssignedProducts`).
 *
 * @param {Object}   props
 * @param {string}   props.bundleId    Bundle post id, or 'new'.
 * @param {Function} props.setBundleId Updates the id (after creating a new post).
 * @param {Function} props.setIsListing Returns to the option-lists screen.
 */
const FixedBundleEditor = ( { bundleId, setBundleId, setIsListing } ) => {
	const setToastMessages = useToastStore(
		( state ) => state.setToastMessages
	);

	const [ isLoading, setIsLoading ] = useState( true );
	const [ isSaving, setIsSaving ] = useState( false );
	const [ title, setTitle ] = useState( '' );
	const [ status, setStatus ] = useState( 'draft' );
	const [ items, setItems ] = useState( [] );
	const [ discount, setDiscount ] = useState( DEFAULT_DISCOUNT );
	const [ display, setDisplay ] = useState( DEFAULT_DISPLAY );
	const [ hasUnsavedChanges, setHasUnsavedChanges ] = useState( false );
	const [ isExitModalOpen, setIsExitModalOpen ] = useState( false );
	const [ isTitleAlertOpen, setIsTitleAlertOpen ] = useState( false );

	const isFirstRender = useRef( true );

	const fetchAssignedProducts = useEditorStore(
		( state ) => state.fetchAssignedProducts
	);
	const setAssignedProducts = useEditorStore(
		( state ) => state.setAssignedProducts
	);

	useEffect( () => {
		useEditorStore.getState().setOptionId( bundleId );

		if ( 'new' === bundleId ) {
			setTitle( __( 'New Fixed Bundle', 'fast-bundle' ) );
			setStatus( 'draft' );
			setItems( [] );
			setDiscount( DEFAULT_DISCOUNT );
			setDisplay( DEFAULT_DISPLAY );
			// Seed a real `aType`, not just the Assign panel's display
			// fallback — otherwise saving without touching that panel falls
			// back (in the shared settings slice) to `specific_product` with
			// an empty product list, silently assigning the bundle to
			// nothing.
			useEditorStore.getState().setAssignedData( {
				aType: 'all_product',
				includes: [],
				excludes: [],
				excludeCategories: [],
			} );
			setIsLoading( false );
			return;
		}

		setIsLoading( true );
		apiFetch( { method: 'POST', path: '/fbnd/get_option', data: { id: bundleId } } )
			.then( ( response ) => {
				const post = response?.post || {};
				const content =
					post.content && typeof post.content === 'object'
						? post.content
						: {};

				setTitle( post.title || '' );
				setStatus( post.status || 'draft' );
				setItems( Array.isArray( content.items ) ? content.items : [] );
				setDiscount( { ...DEFAULT_DISCOUNT, ...( content.discount || {} ) } );
				setDisplay( { ...DEFAULT_DISPLAY, ...( content.display || {} ) } );
			} )
			.catch( () => {
				setToastMessages( {
					status: 'error',
					messages: [ __( 'Failed to load this bundle.', 'fast-bundle' ) ],
					state: true,
				} );
			} )
			.finally( () => setIsLoading( false ) );

		fetchAssignedProducts( bundleId ).then( ( obj ) => {
			// A bundle that was never explicitly assigned comes back with an
			// empty `aType` (the shared slice then auto-saves a
			// `specific_product` placeholder with no products, matching
			// behavior). That placeholder means "not visible anywhere" for a
			// bundle, so default it to "all products" instead — the next
			// Save persists the correction.
			if ( ! obj?.assigned?.aType ) {
				useEditorStore.getState().setAssignedData( {
					aType: 'all_product',
					includes: [],
					excludes: [],
					excludeCategories: [],
				} );
			}
		} );
	}, [ bundleId ] );

	// Skip the dirty flag on the very first render (the load above), only
	// after that does a change reflect a real user edit.
	useEffect( () => {
		if ( isFirstRender.current ) {
			isFirstRender.current = false;
			return;
		}
		setHasUnsavedChanges( true );
	}, [ title, status, items, discount, display ] );

	const save = ( nextStatus = status ) => {
		if ( ! title.trim() ) {
			setIsTitleAlertOpen( true );
			return;
		}

		// Belt-and-suspenders: never let an unset `aType` reach the shared
		// `setAssignedProducts` action below, whose own fallback
		// (`specific_product` with no products) would silently make the
		// bundle assigned to nothing.
		if ( ! useEditorStore.getState().assignedData?.aType ) {
			useEditorStore.getState().setAssignedData( {
				...useEditorStore.getState().assignedData,
				aType: 'all_product',
				includes: useEditorStore.getState().assignedData?.includes || [],
			} );
		}

		setStatus( nextStatus );
		setIsSaving( true );

		apiFetch( {
			method: 'POST',
			path: '/fbnd/set_option',
			data: {
				id: bundleId,
				status: nextStatus,
				title,
				option_type: 'fixed_bundle',
				content: { items, discount, display },
				wpnonce: fbndBackendData.nonce,
			},
		} )
			.then( ( response ) => {
				setHasUnsavedChanges( false );

				if ( response.id ) {
					// The bundleId change below re-runs the load effect, which
					// re-populates state from what we just saved — that's not
					// a user edit, so don't let it re-flag unsaved changes.
					isFirstRender.current = true;
					setBundleId( response.id );
					const url = new URL( window.location.href );
					const newHash = `#bundle/${ response.id }`;
					window.history.pushState(
						{},
						'',
						`${ url.pathname }${ url.search }${ newHash }`
					);
					setAssignedProducts( { id: response.id, type: 'newforce' } );
				} else {
					setAssignedProducts();
				}

				if ( response.message ) {
					setToastMessages( {
						status: 'success',
						messages: [ response.message ],
						state: response.success,
					} );
				}
			} )
			.catch( () => {
				setToastMessages( {
					status: 'error',
					messages: [
						__( 'You are not allowed to do this', 'fast-bundle' ),
					],
					state: true,
				} );
			} )
			.finally( () => setIsSaving( false ) );
	};

	const exit = () => {
		setIsListing( true );
		useEditorStore.getState().resetStore();
		const url = new URL( window.location.href );
		window.history.pushState( {}, '', `${ url.pathname }${ url.search }#lists` );
	};

	const handleExit = () => {
		if ( hasUnsavedChanges ) {
			setIsExitModalOpen( true );
		} else {
			exit();
		}
	};

	if ( isLoading ) {
		return (
			<HStack justify="center" style={ { padding: '80px 0' } }>
				<Spinner />
			</HStack>
		);
	}

	return (
		<div>
			{ isExitModalOpen && (
				<Modal
					title={ __( 'Confirm', 'fast-bundle' ) }
					onRequestClose={ () => setIsExitModalOpen( false ) }
					size="medium"
				>
					<VStack spacing={ 6 }>
						<Text size={ 16 }>
							{ __(
								'You have unsaved changes. Save before leaving, or discard them.',
								'fast-bundle'
							) }
						</Text>
						<HStack justify="end">
							<Button
								variant="secondary"
								isDestructive
								onClick={ exit }
							>
								{ __( 'Discard & Exit', 'fast-bundle' ) }
							</Button>
							<Button
								variant="primary"
								onClick={ () => {
									save( status );
									exit();
								} }
							>
								{ __( 'Save & Exit', 'fast-bundle' ) }
							</Button>
						</HStack>
					</VStack>
				</Modal>
			) }

			{ isTitleAlertOpen && (
				<Modal
					title={ __( 'Title Required', 'fast-bundle' ) }
					onRequestClose={ () => setIsTitleAlertOpen( false ) }
					size="small"
				>
					<VStack spacing={ 6 }>
						<Text size={ 16 }>
							{ __(
								'Please enter a name for this bundle before saving.',
								'fast-bundle'
							) }
						</Text>
						<HStack justify="end">
							<Button
								variant="primary"
								onClick={ () => setIsTitleAlertOpen( false ) }
							>
								{ __( 'OK', 'fast-bundle' ) }
							</Button>
						</HStack>
					</VStack>
				</Modal>
			) }

			<Card
				isRounded={ false }
				size="small"
				style={ { top: 0, zIndex: 999, position: 'sticky' } }
			>
				<CardBody style={ { padding: 0 } }>
					<HStack spacing={ 6 } alignment="top">
						<HStack
							spacing={ 3 }
							expanded
							style={ { alignItems: 'center' } }
						>
							<Button
								icon={ arrowUpLeft }
								iconSize={ 24 }
								onClick={ handleExit }
								label={ __(
									'Back to Option Set List',
									'fast-bundle'
								) }
								variant="link"
								style={ {
									padding: '0 16px',
									borderRight: '1px solid #0000001a',
									width: 64,
									height: 64,
								} }
							/>
							<HStack
								spacing={ 3 }
								wrap
								style={ {
									flex: 1,
									alignItems: 'center',
									padding: '10px 6px',
								} }
							>
								<TextControl
									__nextHasNoMarginBottom
									placeholder={ __(
										'Enter Bundle Name',
										'fast-bundle'
									) }
									value={ title }
									onChange={ setTitle }
									style={ { minWidth: 250, maxWidth: 320 } }
								/>
								<HStack
									spacing={ 3 }
									expanded={ false }
									justify="end"
									style={ { marginInlineStart: 'auto' } }
									wrap
								>
									<ToggleGroupControl
										__nextHasNoMarginBottom
										hideLabelFromVision
										isBlock
										value={ status }
										onChange={ setStatus }
										style={ { height: 32 } }
									>
										<ToggleGroupControlOption
											label={ __( 'Draft', 'fast-bundle' ) }
											value="draft"
										/>
										<ToggleGroupControlOption
											label={ __(
												'Publish',
												'fast-bundle'
											) }
											value="publish"
										/>
									</ToggleGroupControl>
									<Button
										__next40pxDefaultSize
										variant="primary"
										onClick={ () => save( status ) }
										isBusy={ isSaving }
										style={ { minWidth: 85, justifyContent: 'center' } }
									>
										{ hasUnsavedChanges ? (
											__( 'Save', 'fast-bundle' )
										) : (
											<>
												<Icon icon={ check } />
												{ __( 'Saved', 'fast-bundle' ) }
											</>
										) }
									</Button>
								</HStack>
							</HStack>
						</HStack>
					</HStack>
				</CardBody>
			</Card>

			<VStack
				spacing={ 4 }
				style={ { maxWidth: 720, margin: '24px auto', padding: '0 24px' } }
			>
				<Card className="fbnd-card-panel">
					<CardBody>
						<VStack spacing={ 3 }>
							<Heading level={ 4 }>
								{ __( 'Products in this bundle', 'fast-bundle' ) }
							</Heading>
							<ProductPicker items={ items } onChange={ setItems } />
						</VStack>
					</CardBody>
				</Card>

				<Card className="fbnd-card-panel">
					<CardBody>
						<VStack spacing={ 3 }>
							<Heading level={ 4 }>
								{ __( 'Pricing', 'fast-bundle' ) }
							</Heading>
							<DiscountSettings
								items={ items }
								discount={ discount }
								onChange={ setDiscount }
							/>
						</VStack>
					</CardBody>
				</Card>

				<Card className="fbnd-card-panel">
					<CardBody>
						<VStack spacing={ 3 }>
							<Heading level={ 4 }>
								{ __( 'Display', 'fast-bundle' ) }
							</Heading>
							<TextareaControl
								__nextHasNoMarginBottom
								label={ __( 'Description', 'fast-bundle' ) }
								value={ display.description }
								onChange={ ( description ) =>
									setDisplay( { ...display, description } )
								}
							/>
							<TextControl
								__nextHasNoMarginBottom
								label={ __( 'Button text', 'fast-bundle' ) }
								placeholder={ __(
									'Add Bundle to Cart',
									'fast-bundle'
								) }
								value={ display.buttonText }
								onChange={ ( buttonText ) =>
									setDisplay( { ...display, buttonText } )
								}
							/>
						</VStack>
					</CardBody>
				</Card>

				<Card className="fbnd-card-panel">
					<CardBody>
						<VStack spacing={ 3 }>
							<Heading level={ 4 }>
								{ __( 'Assign', 'fast-bundle' ) }
							</Heading>
							<AssignPanel />
						</VStack>
					</CardBody>
				</Card>
			</VStack>
		</div>
	);
};

export default FixedBundleEditor;
