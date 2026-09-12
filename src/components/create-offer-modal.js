import { OFFER_TYPES } from '@/utils/offer-types';
import {
	Button,
	Card,
	CardBody,
	__experimentalHeading as Heading,
	Modal,
	__experimentalText as Text,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { plus } from '@wordpress/icons';

/**
 * Single "Create New Bundle" entry point for every registered offer type.
 * Clicking it opens a "Select bundle type" picker (one card per
 * `OFFER_TYPES` entry); choosing one navigates to that offer's own builder
 * (`#<prefix>/new`). Adding a new offer type to the registry is all a new
 * type needs to show up here — no new button, no new call site.
 *
 * @param {Object} props
 * @param {string} [props.buttonLabel]
 * @param {string} [props.buttonVariant]
 * @param {string} [props.buttonSize]
 * @param {string} [props.size]
 */
const CreateOfferModal = ( {
	buttonLabel = __( 'Create New Bundle', 'fast-bundle' ),
	buttonVariant = 'primary',
	buttonSize = 'large',
	size = 'default',
} ) => {
	const [ isOpen, setIsOpen ] = useState( false );

	const selectType = ( prefix ) => {
		window.location.href = `${ fbndBackendData.db_url }${ prefix }/new`;
	};

	return (
		<>
			<Button
				{ ...( buttonSize === 'large' && { __next40pxDefaultSize: true } ) }
				variant={ buttonVariant }
				size={ size }
				icon={ plus }
				onClick={ () => setIsOpen( true ) }
				style={ { flexShrink: 0 } }
			>
				{ buttonLabel }
			</Button>

			{ isOpen && (
				<Modal
					title={ __( 'Select bundle type', 'fast-bundle' ) }
					onRequestClose={ () => setIsOpen( false ) }
					size="large"
				>
					<div
						style={ {
							display: 'grid',
							gridTemplateColumns:
								'repeat(auto-fill, minmax(220px, 1fr))',
							gap: 16,
						} }
					>
						{ Object.entries( OFFER_TYPES ).map( ( [ type, offer ] ) => (
							<Card key={ type } className="fbnd-card-panel">
								<CardBody>
									<VStack spacing={ 3 }>
										{ offer.icon && (
											<img
												src={ `${ fbndBackendData.url }assets/img/${ offer.icon }` }
												alt=""
												style={ {
													width: '100%',
													height: 120,
													objectFit: 'contain',
													background: '#f6f7f7',
													borderRadius: 4,
												} }
											/>
										) }
										<Heading level={ 4 }>{ offer.label }</Heading>
										<Text variant="muted">
											{ offer.description }
										</Text>
										<Button
											variant="secondary"
											onClick={ () =>
												selectType( offer.prefix )
											}
											style={ {
												width: '100%',
												justifyContent: 'center',
											} }
										>
											{ __( 'Select', 'fast-bundle' ) }
										</Button>
									</VStack>
								</CardBody>
							</Card>
						) ) }
					</div>
				</Modal>
			) }
		</>
	);
};

export default CreateOfferModal;
