import useToastStore from '@/store/toast/useToastStore';
import apiFetch from '@wordpress/api-fetch';
import {
	Button,
	Card,
	CardBody,
	__experimentalHeading as Heading,
	__experimentalHStack as HStack,
	__experimentalInputControl as InputControl,
	__experimentalNumberControl as NumberControl,
	__experimentalText as Text,
	ToggleControl,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';
import { memo, useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import Skeleton from '../../utils/skeleton';
import ExpiredMessage from '@/components/expired-message';

const Settings = () => {
	const isLarge = useViewportMatch( 'large' );
	const [ loading, setLoading ] = useState( false );
	const [ savingSection, setSavingSection ] = useState( null );
	const [ settings, setSettings ] = useState( {} );
	const setToastMessages = useToastStore(
		( state ) => state.setToastMessages
	);

	useEffect( () => {
		setLoading( true );
		apiFetch( {
			path: '/fbnd/get_settings',
			method: 'GET',
		} )
			.then( ( obj ) => {
				if ( obj.success && obj.response ) {
					setSettings( obj.response );
				}
			} )
			.catch( () => {
				// setMessage( __( 'Failed to load settings', 'fast-bundle' ) );
				setToastMessages( {
					status: 'error',
					messages: [
						__( 'Failed to load settings', 'fast-bundle' ),
					],
					state: true,
				} );
			} )
			.finally( () => setLoading( false ) );
	}, [] );

	const handleSave = useCallback(
		( section ) => {
			setSavingSection( section );
			apiFetch( {
				path: '/fbnd/set_settings',
				method: 'POST',
				data: {
					settings: settings,
					wpnonce: fbndBackendData.nonce,
				},
			} )
				.then( () => {
					setToastMessages( {
						status: 'success',
						messages: [
							__(
								'Settings saved successfully!',
								'fast-bundle'
							),
						],
						state: true,
					} );
				} )
				.catch( () => {
					setToastMessages( {
						status: 'error',
						messages: [ __( 'Save failed', 'fast-bundle' ) ],
						state: true,
					} );
				} )
				.finally( () => setSavingSection( null ) );
		},
		[ settings ]
	);

	const handleChange = useCallback( ( key, value ) => {
		setSettings( ( prev ) => ( {
			...prev,
			[ key ]: value,
		} ) );
	}, [] );

	const sanitizeNumber = ( value ) => {
		const num = Number( value );
		return num < 0 ? 0 : num;
	};

	return (
		<>
			<VStack
				spacing={ 8 }
				className="fbnd-container"
				style={ { marginTop: 40 } }
			>
				{ loading ? (
					<HStack spacing={ 8 } align="flex-start">
						<VStack spacing={ 3 }>
							{ [ ...Array( 5 ) ].map( ( _, i ) => (
								<Skeleton height={ 40 } key={ i } />
							) ) }
						</VStack>
						<VStack spacing={ 3 }>
							{ [ ...Array( 5 ) ].map( ( _, i ) => (
								<Skeleton height={ 40 } key={ i } />
							) ) }
						</VStack>
					</HStack>
				) : (
					<>
						<ExpiredMessage />
						<HStack
							spacing={ 8 }
							align="flex-start"
							direction={ isLarge ? 'row' : 'column' }
						>
							<Card style={ { width: '100%' } }>
								<CardBody>
									<VStack spacing={ 5 }>
										<VStack spacing={ 1 }>
											<Heading level={ 3 }>
												{ __(
													'Cleanup Upload Field Files',
													'fast-bundle'
												) }
											</Heading>
											<Text size={ 14 }>
												{ __(
													'Clean up all files uploaded through this field to free storage and remove unused data.',
													'fast-bundle'
												) }
											</Text>
										</VStack>
										<VStack spacing={ 5 }>
											<NumberControl
												__next40pxDefaultSize
												label={ __(
													'Files that are uploaded but not placed in order',
													'fast-bundle'
												) }
												onChange={ ( value ) =>
													handleChange(
														'uploadTempRemove',
														sanitizeNumber( value )
													)
												}
												min={ 0 }
												value={
													settings.uploadTempRemove ??
													''
												}
												help={ __(
													'Removes after a specified number of days.',
													'fast-bundle'
												) }
											/>
											<NumberControl
												__next40pxDefaultSize
												label={ __(
													'Files that are uploaded and placed in order',
													'fast-bundle'
												) }
												value={
													settings.uploadOrderPlacedRemove ??
													''
												}
												onChange={ ( value ) =>
													handleChange(
														'uploadOrderPlacedRemove',
														sanitizeNumber( value )
													)
												}
												min={ 0 }
												help={ __(
													'Removes after a specified number of days.',
													'fast-bundle'
												) }
											/>
											<NumberControl
												__next40pxDefaultSize
												label={ __(
													'Files that are uploaded and completed in order',
													'fast-bundle'
												) }
												value={
													settings.uploadOrderCompletedRemove ??
													''
												}
												onChange={ ( value ) =>
													handleChange(
														'uploadOrderCompletedRemove',
														sanitizeNumber( value )
													)
												}
												min={ 0 }
												help={ __(
													'Removes after a specified number of days.',
													'fast-bundle'
												) }
											/>
										</VStack>
										<HStack>
											<Button
												__next40pxDefaultSize
												variant="primary"
												disabled={
													savingSection ===
														'cleanup' || loading
												}
												isBusy={
													savingSection === 'cleanup'
												}
												onClick={ () => {
													if (
														savingSection ===
															null &&
														! loading
													) {
														handleSave( 'cleanup' );
													}
												} }
											>
												{ __(
													'Save Settings',
													'fast-bundle'
												) }
											</Button>
										</HStack>
									</VStack>
								</CardBody>
							</Card>

							<Card style={ { width: '100%' } }>
								<CardBody>
									<VStack spacing={ 5 }>
										<VStack spacing={ 1 }>
											<Heading level={ 3 }>
												{ __(
													'Other Settings',
													'fast-bundle'
												) }
											</Heading>
											<Text size={ 14 }>
												{ __(
													'Configure the field label along with all related appearance and behavior settings.',
													'fast-bundle'
												) }
											</Text>
										</VStack>
										<VStack spacing={ 5 }>
											<VStack spacing={ 2 }>
												<ToggleControl
													checked={
														settings.enableAddonsPriceText ??
														true
													}
													label={
														'Enable Addons Price Text In Product Page'
													}
													onChange={ ( value ) =>
														handleChange(
															'enableAddonsPriceText',
															value
														)
													}
												/>

												{ ( settings.enableAddonsPriceText ??
													true ) && (
													<InputControl
														__next40pxDefaultSize
														value={
															settings.addonsPriceText ??
															'Addons Price'
														}
														onChange={ ( value ) =>
															handleChange(
																'addonsPriceText',
																value
															)
														}
														onKeyDown={ () => {} }
														onValidate={ () => {} }
														placeholder="Placeholder"
														help={ __(
															'Change your Addon Price text here.',
															'fast-bundle'
														) }
													/>
												) }
											</VStack>

											<VStack spacing={ 2 }>
												<ToggleControl
													checked={
														settings.enableAddonsPriceTotalText ??
														true
													}
													label={
														'Enable Addons Price Total Text In Product Page'
													}
													onChange={ ( value ) =>
														handleChange(
															'enableAddonsPriceTotalText',
															value
														)
													}
												/>

												{ ( settings.enableAddonsPriceTotalText ??
													true ) && (
													<InputControl
														__next40pxDefaultSize
														value={
															settings.totalPriceText ??
															'Total Price'
														}
														onChange={ ( value ) =>
															handleChange(
																'totalPriceText',
																value
															)
														}
														onKeyDown={ () => {} }
														onValidate={ () => {} }
														placeholder="Placeholder"
														help={ __(
															'Change your Total Price text here.',
															'fast-bundle'
														) }
													/>
												) }
											</VStack>
											<VStack spacing={ 2 }>
												<ToggleControl
													checked={
														settings.enableSelectOptionInShop ??
														true
													}
													label={
														'Enable Select Options In Shop Page Products'
													}
													onChange={ ( value ) =>
														handleChange(
															'enableSelectOptionInShop',
															value
														)
													}
												/>

												{ ( settings.enableSelectOptionInShop ??
													true ) && (
													<InputControl
														__next40pxDefaultSize
														value={
															settings.shopAddToCartText ??
															'Select Options'
														}
														onChange={ ( value ) =>
															handleChange(
																'shopAddToCartText',
																value
															)
														}
														onKeyDown={ () => {} }
														onValidate={ () => {} }
														placeholder="Placeholder"
														help={ __(
															'Change your shop page Add to Cart text here.',
															'fast-bundle'
														) }
													/>
												) }
											</VStack>
											<VStack spacing={ 2 }>
												<InputControl
													__next40pxDefaultSize
													label={ __(
														'Character Text',
														'fast-bundle'
													) }
													value={
														settings.characterText ??
														'Character'
													}
													onChange={ ( value ) =>
														handleChange(
															'characterText',
															value
														)
													}
													onKeyDown={ () => {} }
													onValidate={ () => {} }
													placeholder="Placeholder"
													help={ __(
														'Change your character count label text here.',
														'fast-bundle'
													) }
												/>
											</VStack>
											<VStack spacing={ 2 }>
												<InputControl
													__next40pxDefaultSize
													label={ __(
														'Word Text',
														'fast-bundle'
													) }
													value={
														settings.wordText ??
														'Word'
													}
													onChange={ ( value ) =>
														handleChange(
															'wordText',
															value
														)
													}
													onKeyDown={ () => {} }
													onValidate={ () => {} }
													placeholder="Placeholder"
													help={ __(
														'Change your word count label text here.',
														'fast-bundle'
													) }
												/>
											</VStack>
											<VStack spacing={ 5 }>
												<ToggleControl
													checked={
														settings.hideFieldsInCart ??
														false
													}
													label={
														'Hide addon fields in Cart Page'
													}
													onChange={ ( value ) =>
														handleChange(
															'hideFieldsInCart',
															value
														)
													}
												/>
												<ToggleControl
													checked={
														settings.hideFieldsInCheckout ??
														false
													}
													label={
														'Hide addon fields in Checkout Page'
													}
													onChange={ ( value ) =>
														handleChange(
															'hideFieldsInCheckout',
															value
														)
													}
												/>
											</VStack>
										</VStack>
										<HStack>
											<Button
												__next40pxDefaultSize
												variant="primary"
												disabled={
													savingSection === 'other' ||
													loading
												}
												isBusy={
													savingSection === 'other'
												}
												onClick={ () => {
													if (
														savingSection ===
															null &&
														! loading
													) {
														handleSave( 'other' );
													}
												} }
											>
												{ __(
													'Save Settings',
													'fast-bundle'
												) }
											</Button>
										</HStack>
									</VStack>
								</CardBody>
							</Card>
						</HStack>
					</>
				) }
			</VStack>
		</>
	);
};

export default memo( Settings );
