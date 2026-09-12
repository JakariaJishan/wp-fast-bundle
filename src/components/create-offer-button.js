import { OFFER_TYPES } from '@/utils/offer-types';
import { Button } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { plus } from '@wordpress/icons';

/**
 * "Create {offer}" button for any registered offer type (Fixed Bundle, Buy
 * X Get Y, ...) — navigates to that offer type's own hash prefix (e.g.
 * `bundle/new`). One component for every offer type, so a new offer type
 * needs only a new `OFFER_TYPES` entry, not a new button component. There is
 * no equivalent "Create Option" trigger for the generic Option Set anymore —
 * only these registered offer types can be created.
 *
 * @param {Object} props
 * @param {string} props.type          A key in `OFFER_TYPES`, e.g. 'fixed_bundle'.
 * @param {string} [props.buttonVariant]
 * @param {string} [props.buttonSize]
 * @param {string} [props.size]
 */
const CreateOfferButton = ( {
	type,
	buttonVariant = 'secondary',
	buttonSize = 'large',
	size = 'default',
} ) => {
	const offer = OFFER_TYPES[ type ];

	const goToNew = useCallback( () => {
		window.location.href = `${ fbndBackendData.db_url }${ offer?.prefix }/new`;
	}, [ offer?.prefix ] );

	if ( ! offer ) {
		return null;
	}

	return (
		<Button
			{ ...( buttonSize === 'large' && { __next40pxDefaultSize: true } ) }
			variant={ buttonVariant }
			size={ size }
			icon={ plus }
			onClick={ goToNew }
			style={ { flexShrink: 0 } }
		>
			{ offer.createLabel }
		</Button>
	);
};

export default CreateOfferButton;
