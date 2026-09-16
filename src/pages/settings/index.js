import useToastStore from '@/store/toast/useToastStore';
import apiFetch from '@wordpress/api-fetch';
import {
	Button,
	Card,
	CardBody,
	__experimentalHeading as Heading,
	__experimentalHStack as HStack,
	__experimentalInputControl as InputControl,
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
													'Fixed Bundle Settings',
													'fast-bundle'
												) }
											</Heading>
											<Text size={ 14 }>
												{ __(
													'Control the storefront text shown on Fixed Bundle offers.',
													'fast-bundle'
												) }
											</Text>
										</VStack>
										<VStack spacing={ 5 }>
											<VStack spacing={ 2 }>
												<ToggleControl
													checked={
														settings.enableSavingsText ??
														true
													}
													label={ __(
														"Show 'You Save' Text",
														'fast-bundle'
													) }
													onChange={ ( value ) =>
														handleChange(
															'enableSavingsText',
															value
														)
													}
												/>

												{ ( settings.enableSavingsText ??
													true ) && (
													<InputControl
														__next40pxDefaultSize
														value={
															settings.savingsText ??
															'You save %s'
														}
														onChange={ ( value ) =>
															handleChange(
																'savingsText',
																value
															)
														}
														onKeyDown={ () => {} }
														onValidate={ () => {} }
														placeholder="Placeholder"
														help={ __(
															"Shown on both Fixed Bundle and Buy X Get Y offers. Use %s where the savings amount should appear.",
															'fast-bundle'
														) }
													/>
												) }
											</VStack>

											<InputControl
												__next40pxDefaultSize
												label={ __(
													'Free Shipping Badge Text',
													'fast-bundle'
												) }
												value={
													settings.freeShippingBadgeText ??
													'Free Shipping'
												}
												onChange={ ( value ) =>
													handleChange(
														'freeShippingBadgeText',
														value
													)
												}
												onKeyDown={ () => {} }
												onValidate={ () => {} }
												placeholder="Placeholder"
												help={ __(
													"Shown when a bundle's discount type is Free Shipping.",
													'fast-bundle'
												) }
											/>

											<InputControl
												__next40pxDefaultSize
												label={ __(
													'Add to Cart Button Text',
													'fast-bundle'
												) }
												value={
													settings.fixedBundleButtonText ??
													'Add Bundle to Cart'
												}
												onChange={ ( value ) =>
													handleChange(
														'fixedBundleButtonText',
														value
													)
												}
												onKeyDown={ () => {} }
												onValidate={ () => {} }
												placeholder="Placeholder"
												help={ __(
													"Default button text for Fixed Bundles that don't set their own.",
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
														'fixed_bundle' ||
													loading
												}
												isBusy={
													savingSection ===
													'fixed_bundle'
												}
												onClick={ () => {
													if (
														savingSection ===
															null &&
														! loading
													) {
														handleSave(
															'fixed_bundle'
														);
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
													'Buy X Get Y Settings',
													'fast-bundle'
												) }
											</Heading>
											<Text size={ 14 }>
												{ __(
													'Control the storefront text shown on Buy X Get Y offers.',
													'fast-bundle'
												) }
											</Text>
										</VStack>
										<VStack spacing={ 5 }>
											<InputControl
												__next40pxDefaultSize
												label={ __(
													'Buy Group Label',
													'fast-bundle'
												) }
												value={
													settings.buyGroupLabelText ??
													'Buy'
												}
												onChange={ ( value ) =>
													handleChange(
														'buyGroupLabelText',
														value
													)
												}
												onKeyDown={ () => {} }
												onValidate={ () => {} }
												placeholder="Placeholder"
												help={ __(
													'Label shown above the qualifying (trigger) products.',
													'fast-bundle'
												) }
											/>

											<InputControl
												__next40pxDefaultSize
												label={ __(
													'Get Group Label',
													'fast-bundle'
												) }
												value={
													settings.getGroupLabelText ??
													'Get'
												}
												onChange={ ( value ) =>
													handleChange(
														'getGroupLabelText',
														value
													)
												}
												onKeyDown={ () => {} }
												onValidate={ () => {} }
												placeholder="Placeholder"
												help={ __(
													'Label shown above the reward products.',
													'fast-bundle'
												) }
											/>

											<InputControl
												__next40pxDefaultSize
												label={ __(
													'Free Reward Text',
													'fast-bundle'
												) }
												value={
													settings.freeRewardText ??
													'FREE'
												}
												onChange={ ( value ) =>
													handleChange(
														'freeRewardText',
														value
													)
												}
												onKeyDown={ () => {} }
												onValidate={ () => {} }
												placeholder="Placeholder"
												help={ __(
													'Shown instead of a price for fully discounted reward products.',
													'fast-bundle'
												) }
											/>

											<InputControl
												__next40pxDefaultSize
												label={ __(
													'Add to Cart Button Text',
													'fast-bundle'
												) }
												value={
													settings.buyXGetYButtonText ??
													'Add Deal to Cart'
												}
												onChange={ ( value ) =>
													handleChange(
														'buyXGetYButtonText',
														value
													)
												}
												onKeyDown={ () => {} }
												onValidate={ () => {} }
												placeholder="Placeholder"
												help={ __(
													"Default button text for Buy X Get Y offers that don't set their own.",
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
														'buy_x_get_y' ||
													loading
												}
												isBusy={
													savingSection ===
													'buy_x_get_y'
												}
												onClick={ () => {
													if (
														savingSection ===
															null &&
														! loading
													) {
														handleSave(
															'buy_x_get_y'
														);
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
