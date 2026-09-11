import useToastStore from '@/store/toast/useToastStore';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { key } from '@wordpress/icons';
import {
	Card,
	Button,
	CardBody,
	TextControl,
	ExternalLink,
	SelectControl,
	FlexItem,
	__experimentalText as Text,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalHeading as Heading,
} from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';

export const License = () => {
	const isLarge = useViewportMatch( 'large' );

	const [ licenseKey, setLicenseKey ] = useState( '' );
	const [ licenseData, setLicenseData ] = useState( {
		success: false,
		license: 'invalid',
	} );
	const [ loading, setLoading ] = useState( true );

	const getLicenseData = async () => {
		try {
			const endpoint = `${ fbndBackendData.ajax }`;
			const params = new URLSearchParams( {
				action: 'edd_fbnd_get_license_data',
				security: fbndBackendData.nonce,
			} );

			const response = await fetch( endpoint, {
				method: 'POST',
				body: params,
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
			} );

			if ( ! response.ok ) {
				throw new Error( `HTTP error! Status: ${ response.status }` );
			}

			const result = await response.json();

			if ( result.success ) {
				return result.data;
			}
		} catch ( error ) {
			return null;
		}
	};

	useEffect( () => {
		const fetchLicenseData = async () => {
			setLoading( true );
			const data = await getLicenseData();
			if ( data?.license_data ) {
				setLicenseData( data?.license_data );
			}
			setLoading( false );
		};

		fetchLicenseData();
	}, [] );

	useEffect( () => {
		if ( 'valid' === licenseData.license ) {
			fbndBackendData.isActive = true;
		} else {
			fbndBackendData.isActive = false;
		}
	}, [ licenseData ] );

	return (
		<div className="fbnd-container" style={ { marginTop: 40 } }>
			<div
				style={ {
					gap: 40,
					display: 'grid',
					gridTemplateColumns: isLarge ? '1.6fr 1fr' : '1fr',
				} }
			>
				{ loading ? (
					<Card size="small">
						<CardBody>
							<VStack spacing={ 5 }>
								<CustomSkeleton width="250px" height="30px" />
								<CustomSkeleton
									width="100%"
									height="30px"
									style={ { marginTop: '10px' } }
								/>
								<CustomSkeleton width="100%" height="30px" />
								<CustomSkeleton width="100%" height="30px" />
								<CustomSkeleton width="100%" height="30px" />
							</VStack>
						</CardBody>
					</Card>
				) : (
					<Activation
						licenseKey={ licenseKey }
						setLicenseKey={ setLicenseKey }
						licenseData={ licenseData }
						setLicenseData={ setLicenseData }
					/>
				) }

				<FAQ />
			</div>
		</div>
	);
};

const Activation = ( {
	licenseKey,
	setLicenseKey,
	licenseData,
	setLicenseData,
} ) => {
	const [ isSaving, setIsSaving ] = useState( false );
	const setToastMessages = useToastStore(
		( state ) => state.setToastMessages
	);
	const handleActivate = async () => {
		if ( ! licenseKey?.trim() ) {
			setToastMessages( {
				status: 'error',
				messages: [
					__( 'Please enter a license key.', 'fast-bundle' ),
				],
				state: true,
			} );
			return;
		}

		try {
			setIsSaving( true );
			const res = await activateLicense( licenseKey );
			setToastMessages( {
				status: res?.status ? 'success' : 'error',
				messages: [
					res?.data ||
						( res?.status
							? __(
									'License activated successfully',
									'fast-bundle'
							  )
							: __( 'Some issues occured', 'fast-bundle' ) ),
				],
				state: true,
			} );
			setLicenseKey( '' );
			setIsSaving( false );
			if ( res?.status ) {
				setLicenseData( res?.license_data );
				window.location.reload();
			}
		} catch ( error ) {
			setIsSaving( false );
			setToastMessages( {
				status: 'error',
				messages: [
					error.message ||
						__( 'Some issues occured', 'fast-bundle' ),
				],
				state: true,
			} );
		}
	};

	const activateLicense = async ( key ) => {
		const endpoint = `${ fbndBackendData.ajax }`;
		const params = new URLSearchParams( {
			action: 'edd_fbnd_activate_license',
			security: fbndBackendData.nonce,
			license_key: key,
		} );

		const response = await fetch( endpoint, {
			method: 'POST',
			body: params,
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
		} );

		if ( ! response.ok ) {
			throw new Error( `HTTP error! Status: ${ response.status }` );
		}

		const result = await response.json();
		return result;
	};

	return (
		<>
			<Card>
				<CardBody>
					{ licenseData?.license !== 'valid' ? (
						<VStack spacing={ 5 }>
							<Heading level={ 3 }>
								{ __(
									'Ready to Use Product Addons Pro?',
									'fast-bundle'
								) }
							</Heading>
							<TextControl
								type="password"
								hideLabelFromVision
								placeholder={ __(
									'Enter Your License Key Here…',
									'fast-bundle'
								) }
								value={ licenseKey || '' }
								onChange={ ( v ) => setLicenseKey( v ) }
							/>
							<Text size={ 16 }>
								{ __(
									'If you’re unable to activate your product license, please contact the',
									'fast-bundle'
								) }{ ' ' }
								<ExternalLink
									href="#"
									target="_blank"
									rel="noopener noreferrer"
								>
									{ __( 'support team', 'fast-bundle' ) }
								</ExternalLink>
							</Text>

							<FlexItem>
								<Button
									__next40pxDefaultSize
									icon={ key }
									variant="primary"
									isBusy={ isSaving }
									onClick={ () => handleActivate() }
								>
									{ isSaving
										? __(
												'Activating License…',
												'fast-bundle'
										  )
										: __(
												'Activate License',
												'fast-bundle'
										  ) }
								</Button>
							</FlexItem>
						</VStack>
					) : (
						<VStack spacing={ 8 }>
							<ActivatedMessage
								title={ __(
									'Congratulations!',
									'fast-bundle'
								) }
								message={ __(
									"You've unlocked Product Addons Pro - all you have to do is build campaigns and deploy. Product Addons will take care of the rest!",
									'fast-bundle'
								) }
							/>
							<LicenseStatus
								licenseData={ licenseData }
								setLicenseData={ setLicenseData }
								setToastMessages={ setToastMessages }
							/>
						</VStack>
					) }
				</CardBody>
			</Card>
		</>
	);
};

const FAQ = () => {
	const faqItems = [
		{
			question: __(
				'Do I need the free version of the plugin on my site?',
				'fast-bundle'
			),
			answer: __(
				'Yes. You can use the free version of the plugin, which includes the free features of Product Addons. However, please note that to use the pro features, you need the free version of the plugin installed on your WordPress site.',
				'fast-bundle'
			),
		},
		{
			question: __(
				'Where do I get my product license?',
				'fast-bundle'
			),
			answer: __(
				'You can copy the product license from the client dashboard. Once you copy it, paste the license key into the Product Addons License validation page.',
				'fast-bundle'
			),
		},
		{
			question: __(
				'How do I get help to use Product Addons Pro?',
				'fast-bundle'
			),
			hasMarkup: true,
			answer: __(
				"Please go to the support link: <a href='#' target='_blank'>#</a>",
				'fast-bundle'
			),
		},
	];

	return (
		<Card>
			<CardBody>
				<VStack spacing={ 5 }>
					{ faqItems.map( ( item, index ) => (
						<VStack key={ index }>
							<Heading level={ 3 }>{ item.question }</Heading>
							{ item.hasMarkup ? (
								<Text
									size={ 14 }
									dangerouslySetInnerHTML={ {
										__html: item.answer,
									} }
								/>
							) : (
								<Text size={ 14 }>{ item.answer }</Text>
							) }
						</VStack>
					) ) }
					<Text size={ 14 }>
						{ __(
							'Product Addons is a product of fastbundle. The contact support team is ready to help you with any queries, including how to use the pro version of Product Addons.',
							'fast-bundle'
						) }
					</Text>
				</VStack>
			</CardBody>
		</Card>
	);
};

const ActivatedMessage = ( { title, message } ) => (
	<Card>
		<CardBody>
			<HStack spacing={ 5 }>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					width="48px"
					height="46px"
					viewBox="0 0 48 48"
				>
					<g fill="currentColor">
						<path d="M46.15 26.76a.94.94 0 0 0-.39-1.27 14.7 14.7 0 0 0-16.21 1.62l-1.52-1.52 2.48-2.47a.94.94 0 0 0-1.33-1.33l-2.47 2.48-6.04-6.04a13.1 13.1 0 0 0 1.07-13.98.94.94 0 0 0-1.66.88c2.02 3.8 1.7 8.3-.75 11.76l-3.98-3.98a2.3 2.3 0 0 0-3.79.84L.14 44.9c-.3.86-.1 1.78.54 2.42a2.28 2.28 0 0 0 2.42.54l31.15-11.42a2.3 2.3 0 0 0 .84-3.8l-4.2-4.2a12.83 12.83 0 0 1 13.99-1.3.94.94 0 0 0 1.27-.38ZM14.93 41.52l-8.45-8.45 2.34-6.4 12.5 12.5-6.39 2.35Zm-4.58 1.68L4.8 37.65 5.77 35l7.22 7.22-2.64.97Zm-7.9 2.9A.4.4 0 0 1 2 46a.4.4 0 0 1-.1-.45l2.19-5.96 4.32 4.32-5.96 2.19Zm31.43-11.73a.41.41 0 0 1-.27.3l-5.77 2.12-5.33-5.33a.94.94 0 0 0-1.33 1.32l4.72 4.72-2.64.97L9.53 24.74l.97-2.64 4.72 4.72a.93.93 0 0 0 1.32 0 .94.94 0 0 0 0-1.33l-5.33-5.33 2.11-5.77c.07-.19.23-.25.31-.27h.1c.09 0 .2.02.3.12l19.73 19.73c.14.15.13.31.12.4ZM28.27 7.48c.52 0 .94-.42.94-.94 0-.78.64-1.42 1.43-1.42a3.3 3.3 0 0 0 3.3-3.3.94.94 0 0 0-1.88 0c0 .79-.64 1.43-1.42 1.43a3.3 3.3 0 0 0-3.3 3.3c0 .51.42.93.93.93ZM36.6 16.33c1.87 0 3.4-1.53 3.4-3.4 0-.85.69-1.54 1.53-1.54a.94.94 0 0 0 0-1.87 3.41 3.41 0 0 0-3.4 3.4c0 .85-.7 1.54-1.54 1.54a.94.94 0 0 0 0 1.87ZM42 18.14a3 3 0 1 0 6 0 3 3 0 0 0-6 0ZM45 17a1.13 1.13 0 1 1 0 2.26A1.13 1.13 0 0 1 45 17Z" />
						<path d="M29.54 15.92a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0-4.12a1.13 1.13 0 1 1 0 2.25 1.13 1.13 0 0 1 0-2.25ZM12 6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0-4.13a1.13 1.13 0 1 1 0 2.26 1.13 1.13 0 0 1 0-2.25ZM42.42 32.91a.94.94 0 0 0-1.32 1.33l.88.88a.93.93 0 0 0 1.33 0 .94.94 0 0 0 0-1.32l-.89-.89ZM46.84 37.33a.94.94 0 0 0-1.32 1.33l.88.88a.93.93 0 0 0 1.33 0 .94.94 0 0 0 0-1.33l-.89-.88ZM46.4 32.91l-.88.89a.94.94 0 0 0 1.32 1.32l.89-.88a.94.94 0 0 0-1.33-1.33ZM41.98 37.33l-.88.88a.94.94 0 0 0 1.32 1.33l.89-.88a.94.94 0 0 0-1.33-1.33ZM46.18 2.76c.24 0 .48-.1.66-.28l.89-.88A.94.94 0 1 0 46.4.27l-.88.89a.94.94 0 0 0 .66 1.6ZM41.76 7.18c.24 0 .48-.1.66-.28l.89-.88a.94.94 0 0 0-1.33-1.33l-.88.89a.94.94 0 0 0 .66 1.6ZM46.84 4.7a.94.94 0 0 0-1.32 1.32l.88.88a.93.93 0 0 0 1.33 0 .94.94 0 0 0 0-1.32l-.89-.89ZM41.98 2.48a.93.93 0 0 0 1.33 0 .94.94 0 0 0 0-1.32l-.89-.89A.94.94 0 0 0 41.1 1.6l.88.88ZM18.86 28.2a.94.94 0 0 0-.93.94.94.94 0 0 0 .93.93.94.94 0 0 0 .94-.93.94.94 0 0 0-.94-.94ZM32.54 18.43l-.68.68a.94.94 0 0 0 1.33 1.33l.68-.68a.94.94 0 0 0-1.33-1.33Z" />
					</g>
				</svg>
				<VStack spacing={ 1 } alignment="left">
					<Heading level={ 3 }>{ title }</Heading>
					<Text>{ message }</Text>
				</VStack>
			</HStack>
		</CardBody>
	</Card>
);

const productIcons = (
	<svg
		width="20"
		height="20"
		viewBox="0 0 20 20"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path
			d="M2.86 6.553a.5.5 0 01.823-.482l3.02 2.745c.196.178.506.13.64-.098L9.64 4.779a.417.417 0 01.72 0l2.297 3.939a.417.417 0 00.64.098l3.02-2.745a.5.5 0 01.823.482l-1.99 8.63a.833.833 0 01-.813.646H5.663a.833.833 0 01-.812-.646L2.86 6.553z"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.5"
		></path>
	</svg>
);

const LicenseStatus = ( { licenseData, setLicenseData, setToastMessages } ) => {
	const isMobile = useViewportMatch( 'mobile', '<' );

	const [ isSaving, setIsSaving ] = useState( false );
	const handleDeactivate = async () => {
		try {
			setIsSaving( true );
			const result = await deactivateLicense();
			setLicenseData( result.license_data ); // Ensure this updates properly
			setToastMessages( {
				status: 'success',
				messages: [ result?.data || 'Some issues occured' ],
				state: true,
			} );
			setIsSaving( false );
			window.location.reload(); // Reload to reflect changes
		} catch ( error ) {
			setToastMessages( {
				status: 'error',
				messages: [ error.message || 'Some issues occured' ],
				state: true,
			} );
			setIsSaving( false );
		}
	};

	const deactivateLicense = async () => {
		const endpoint = `${ fbndBackendData.ajax }`;
		const params = new URLSearchParams( {
			action: 'edd_fbnd_deactivate_license',
			security: fbndBackendData.nonce,
			deactivate: 'yes',
		} );

		const response = await fetch( endpoint, {
			method: 'POST',
			body: params,
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
		} );

		if ( ! response.ok ) {
			throw new Error( `HTTP error! Status: ${ response.status }` );
		}

		const result = await response.json();

		if ( result.status ) {
			return result;
		}
	};

	return (
		<VStack spacing={ 8 } alignment="left">
			<VStack spacing={ 3 }>
				<div
					style={ {
						gap: 20,
						display: 'grid',
						alignItems: 'center',
						gridTemplateColumns: '90px 2fr',
					} }
				>
					<Text weight="600">
						{ __( 'License Type:', 'fast-bundle' ) }
					</Text>
					<Text>{ licenseData.licenseType }</Text>
				</div>
				<div
					style={ {
						gap: 20,
						display: 'grid',
						alignItems: 'center',
						gridTemplateColumns: '90px 2fr',
					} }
				>
					<Text weight="600">
						{ __( 'Expire On:', 'fast-bundle' ) }
					</Text>
					<HStack>
						<Text>{ licenseData.expiresAt }</Text>
						{ ( licenseData?.toExpired ||
							licenseData.license === 'expired' ) && (
							<Button
								__next40pxDefaultSize
								icon={ productIcons }
								iconSize={ 14 }
								variant="secondary"
								href="#"
								target="_blank"
								size="small"
							>
								{ __( 'Renew License', 'fast-bundle' ) }
							</Button>
						) }
					</HStack>
				</div>
			</VStack>
			<HStack spacing={ 3 } wrap={ isMobile }>
				<UpgradeMessage licenseData={ licenseData } />
				<Button
					__next40pxDefaultSize
					variant="primary"
					isBusy={ isSaving }
					onClick={ () => handleDeactivate() }
					style={ { flexShrink: 0 } }
					size="compact"
					isDestructive
				>
					{ isSaving
						? __( 'Deactivating…', 'fast-bundle' )
						: __( 'Deactivate License', 'fast-bundle' ) }
				</Button>
			</HStack>
		</VStack>
	);
};

const UpgradeMessage = ( { licenseData } ) => {
	const [ selectedOption, setSelectedOption ] = useState( '' );

	const upgradeOptions = [
		{
			value: 1,
			label: __( 'Unlimited Sites - Yearly', 'fast-bundle' ),
		},
		{
			value: 2,
			label: __( '1 Site - Lifetime', 'fast-bundle' ),
		},
		{
			value: 3,
			label: __( '25 Sites - Lifetime', 'fast-bundle' ),
		},
	];

	const availableUpgrades = {
		1: [ 1, 2, 3 ],
		2: [ 2, 3 ],
		3: [ 3 ],
	};

	const currentUpgrade = availableUpgrades[ licenseData?.priceId ];

	if ( ! currentUpgrade || currentUpgrade.length === 0 ) {
		return null;
	}

	return (
		<HStack wrap expanded={ false } alignment="bottom">
			<SelectControl
				label={ __( 'Choose a upgrade plan', 'fast-bundle' ) }
				value={ selectedOption }
				options={ upgradeOptions }
				onChange={ ( newPlan ) => setSelectedOption( newPlan ) }
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				size="compact"
			/>
			<Button
				variant="primary"
				size="compact"
				href="#"
				target="_blank"
			>
				{ __( 'Upgrade Now', 'fast-bundle' ) }
			</Button>
		</HStack>
	);
};

const CustomSkeleton = ( {
	width = '100%',
	height = '1rem',
	borderRadius = '4px',
} ) => {
	return (
		<div
			style={ {
				width,
				height,
				borderRadius,
				backgroundColor: 'rgba(0,0,0,0.08)',
			} }
		></div>
	);
};
