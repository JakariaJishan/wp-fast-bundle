/* eslint-disable react-hooks/exhaustive-deps */
import useEditorStore from '@/store/editor/useEditorStore';
import useToastStore from '@/store/toast/useToastStore';
import { OFFER_TYPES } from '@/utils/offer-types';
import apiFetch from '@wordpress/api-fetch';
import {
	Card,
	CardBody,
	__experimentalHeading as Heading,
	RadioControl,
	TextareaControl,
	TextControl,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import AssignPanel from '../assign-panel';
import OfferEditorShell from '../offer-editor-shell';
import ProductPicker from '../product-picker';
import DiscountSettings from './discount-settings';
import FixedBundlePreview from './preview';

const OPTION_TYPE = 'fixed_bundle';
const HASH_PREFIX = OFFER_TYPES[ OPTION_TYPE ].prefix;

const DEFAULT_DISCOUNT = { type: 'percentage', value: 10 };
const DEFAULT_DISPLAY = {
	description: '',
	buttonText: '',
	variantSelectorType: 'dropdown',
};

/**
 * Fixed Bundle admin builder: a merchant-curated, fixed set of products sold
 * together at a discount. Self-contained (its own state, not the generic
 * `blocksSlice`/canvas) because a bundle's data — items, discount, display —
 * doesn't fit the block-tree shape the generic Option Set editor uses.
 *
 * Reuses the shared `useEditorStore` settings slice only for the parts that
 * are already generic to any `fbnd_option` post: product/category
 * assignment (`assignedData`, `fetchAssignedProducts`, `setAssignedProducts`).
 * The header/save/exit chrome is the shared `OfferEditorShell`.
 *
 * @param {Object}   props
 * @param {string}   props.optionId     Bundle post id, or 'new'.
 * @param {Function} props.setOptionId  Updates the id (after creating a new post).
 * @param {Function} props.setIsListing Returns to the option-lists screen.
 */
const FixedBundleEditor = ( { optionId, setOptionId, setIsListing } ) => {
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
	const [ isTitleAlertOpen, setIsTitleAlertOpen ] = useState( false );

	const isFirstRender = useRef( true );

	const fetchAssignedProducts = useEditorStore(
		( state ) => state.fetchAssignedProducts
	);
	const setAssignedProducts = useEditorStore(
		( state ) => state.setAssignedProducts
	);

	useEffect( () => {
		useEditorStore.getState().setOptionId( optionId );

		if ( 'new' === optionId ) {
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
		apiFetch( { method: 'POST', path: '/fbnd/get_option', data: { id: optionId } } )
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

		fetchAssignedProducts( optionId ).then( ( obj ) => {
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
	}, [ optionId ] );

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
				id: optionId,
				status: nextStatus,
				title,
				option_type: OPTION_TYPE,
				content: { items, discount, display },
				wpnonce: fbndBackendData.nonce,
			},
		} )
			.then( ( response ) => {
				setHasUnsavedChanges( false );

				if ( response.id ) {
					// The optionId change below re-runs the load effect,
					// which re-populates state from what we just saved —
					// that's not a user edit, so don't let it re-flag
					// unsaved changes.
					isFirstRender.current = true;
					setOptionId( response.id );
					const url = new URL( window.location.href );
					const newHash = `#${ HASH_PREFIX }/${ response.id }`;
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

	return (
		<OfferEditorShell
			isLoading={ isLoading }
			title={ title }
			onTitleChange={ setTitle }
			titlePlaceholder={ __( 'Enter Bundle Name', 'fast-bundle' ) }
			status={ status }
			onStatusChange={ setStatus }
			hasUnsavedChanges={ hasUnsavedChanges }
			isSaving={ isSaving }
			onSave={ save }
			onExit={ exit }
			isTitleAlertOpen={ isTitleAlertOpen }
			onCloseTitleAlert={ () => setIsTitleAlertOpen( false ) }
			titleRequiredMessage={ __(
				'Please enter a name for this bundle before saving.',
				'fast-bundle'
			) }
			preview={
				<FixedBundlePreview
					title={ title }
					items={ items }
					discount={ discount }
					display={ display }
					status={ status }
				/>
			}
		>
			<Card className="fbnd-card-panel">
				<CardBody>
					<ProductPicker
						items={ items }
						onChange={ setItems }
						title={ __( 'Products in this Bundle', 'fast-bundle' ) }
						description={ __(
							'Search and add items to sell together. The bundle price and inventory will automatically recalculate.',
							'fast-bundle'
						) }
						label={ __( 'Add products to this bundle', 'fast-bundle' ) }
					/>
				</CardBody>
			</Card>

			<Card className="fbnd-card-panel">
				<CardBody>
					<AssignPanel />
				</CardBody>
			</Card>
			<Card className="fbnd-card-panel">
				<CardBody>
					<DiscountSettings
						items={ items }
						discount={ discount }
						onChange={ setDiscount }
					/>
				</CardBody>
			</Card>

			<Card className="fbnd-card-panel">
				<CardBody>
					<VStack spacing={ 3 }>
						<Heading level={ 4 }>{ __( 'Display', 'fast-bundle' ) }</Heading>
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
							placeholder={ __( 'Add Bundle to Cart', 'fast-bundle' ) }
							value={ display.buttonText }
							onChange={ ( buttonText ) =>
								setDisplay( { ...display, buttonText } )
							}
						/>
						{ items.some( ( item ) => item.is_variable ) && (
							<RadioControl
								label={ __( 'Variant selector', 'fast-bundle' ) }
								help={ __(
									'How shoppers pick a variation for a variable product in this bundle.',
									'fast-bundle'
								) }
								selected={ display.variantSelectorType }
								options={ [
									{
										label: __( 'Dropdown', 'fast-bundle' ),
										value: 'dropdown',
									},
									{
										label: __( 'Swatches', 'fast-bundle' ),
										value: 'swatches',
									},
								] }
								onChange={ ( variantSelectorType ) =>
									setDisplay( { ...display, variantSelectorType } )
								}
							/>
						) }
					</VStack>
				</CardBody>
			</Card>

			
		</OfferEditorShell>
	);
};

export default FixedBundleEditor;
