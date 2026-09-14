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
import BuyXGetYPreview from './preview';
import RewardDiscount from './reward-discount';

const OPTION_TYPE = 'buy_x_get_y';
const HASH_PREFIX = OFFER_TYPES[ OPTION_TYPE ].prefix;

const DEFAULT_REWARD_DISCOUNT = { type: 'free', value: 0 };
const DEFAULT_DISPLAY = {
	description: '',
	buttonText: '',
	variantSelectorType: 'dropdown',
};

/**
 * Buy X Get Y admin builder: buy a fixed set of trigger products, get a
 * fixed set of reward products free/discounted, added to cart together.
 * Structurally a sibling of `FixedBundleEditor` — same shared
 * `OfferEditorShell` chrome, same assign/save/load pattern — differing only
 * in its own data shape (two item lists instead of one, plus a reward
 * discount instead of a bundle-wide one).
 *
 * @param {Object}   props
 * @param {string}   props.optionId     Deal post id, or 'new'.
 * @param {Function} props.setOptionId  Updates the id (after creating a new post).
 * @param {Function} props.setIsListing Returns to the option-lists screen.
 */
const BuyXGetYEditor = ( { optionId, setOptionId, setIsListing } ) => {
	const setToastMessages = useToastStore(
		( state ) => state.setToastMessages
	);

	const [ isLoading, setIsLoading ] = useState( true );
	const [ isSaving, setIsSaving ] = useState( false );
	const [ title, setTitle ] = useState( '' );
	const [ status, setStatus ] = useState( 'draft' );
	const [ triggers, setTriggers ] = useState( [] );
	const [ rewards, setRewards ] = useState( [] );
	const [ rewardDiscount, setRewardDiscount ] = useState(
		DEFAULT_REWARD_DISCOUNT
	);
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
			setTitle( __( 'New Buy X Get Y Deal', 'fast-bundle' ) );
			setStatus( 'draft' );
			setTriggers( [] );
			setRewards( [] );
			setRewardDiscount( DEFAULT_REWARD_DISCOUNT );
			setDisplay( DEFAULT_DISPLAY );
			// See FixedBundleEditor for why this default matters: an unset
			// `aType` would otherwise silently save as "specific product,
			// none selected" and the deal would show up nowhere.
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
				setTriggers(
					Array.isArray( content.triggers ) ? content.triggers : []
				);
				setRewards(
					Array.isArray( content.rewards ) ? content.rewards : []
				);
				setRewardDiscount( {
					...DEFAULT_REWARD_DISCOUNT,
					...( content.rewardDiscount || {} ),
				} );
				setDisplay( { ...DEFAULT_DISPLAY, ...( content.display || {} ) } );
			} )
			.catch( () => {
				setToastMessages( {
					status: 'error',
					messages: [ __( 'Failed to load this deal.', 'fast-bundle' ) ],
					state: true,
				} );
			} )
			.finally( () => setIsLoading( false ) );

		fetchAssignedProducts( optionId ).then( ( obj ) => {
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

	useEffect( () => {
		if ( isFirstRender.current ) {
			isFirstRender.current = false;
			return;
		}
		setHasUnsavedChanges( true );
	}, [ title, status, triggers, rewards, rewardDiscount, display ] );

	const save = ( nextStatus = status ) => {
		if ( ! title.trim() ) {
			setIsTitleAlertOpen( true );
			return;
		}

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
				content: { triggers, rewards, rewardDiscount, display },
				wpnonce: fbndBackendData.nonce,
			},
		} )
			.then( ( response ) => {
				setHasUnsavedChanges( false );

				if ( response.id ) {
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
			titlePlaceholder={ __( 'Enter Deal Name', 'fast-bundle' ) }
			status={ status }
			onStatusChange={ setStatus }
			hasUnsavedChanges={ hasUnsavedChanges }
			isSaving={ isSaving }
			onSave={ save }
			onExit={ exit }
			isTitleAlertOpen={ isTitleAlertOpen }
			onCloseTitleAlert={ () => setIsTitleAlertOpen( false ) }
			titleRequiredMessage={ __(
				'Please enter a name for this deal before saving.',
				'fast-bundle'
			) }
			preview={
				<BuyXGetYPreview
					title={ title }
					triggers={ triggers }
					rewards={ rewards }
					rewardDiscount={ rewardDiscount }
					display={ display }
				/>
			}
		>
			<Card className="fbnd-card-panel">
				<CardBody>
					<VStack spacing={ 3 }>
						<Heading level={ 4 }>
							{ __( 'Buy (trigger products)', 'fast-bundle' ) }
						</Heading>
						<ProductPicker
							items={ triggers }
							onChange={ setTriggers }
							label={ __(
								'Add products the customer needs to buy',
								'fast-bundle'
							) }
							emptyText={ __(
								'No trigger products yet. Search above to add the first one.',
								'fast-bundle'
							) }
						/>
					</VStack>
				</CardBody>
			</Card>

			<Card className="fbnd-card-panel">
				<CardBody>
					<VStack spacing={ 3 }>
						<Heading level={ 4 }>
							{ __( 'Get (reward products)', 'fast-bundle' ) }
						</Heading>
						<ProductPicker
							items={ rewards }
							onChange={ setRewards }
							label={ __(
								'Add products the customer gets free/discounted',
								'fast-bundle'
							) }
							emptyText={ __(
								'No reward products yet. Search above to add the first one.',
								'fast-bundle'
							) }
						/>
						<RewardDiscount
							rewards={ rewards }
							discount={ rewardDiscount }
							onChange={ setRewardDiscount }
						/>
					</VStack>
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
							placeholder={ __( 'Add Deal to Cart', 'fast-bundle' ) }
							value={ display.buttonText }
							onChange={ ( buttonText ) =>
								setDisplay( { ...display, buttonText } )
							}
						/>
						{ [ ...triggers, ...rewards ].some(
							( item ) => item.is_variable
						) && (
							<RadioControl
								label={ __( 'Variant selector', 'fast-bundle' ) }
								help={ __(
									'How shoppers pick a variation for a variable product in this deal.',
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

			<Card className="fbnd-card-panel">
				<CardBody>
					<VStack spacing={ 3 }>
						<Heading level={ 4 }>{ __( 'Assign', 'fast-bundle' ) }</Heading>
						<AssignPanel />
					</VStack>
				</CardBody>
			</Card>
		</OfferEditorShell>
	);
};

export default BuyXGetYEditor;
