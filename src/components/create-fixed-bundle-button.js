import { Button } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { plus } from '@wordpress/icons';

/**
 * Mirrors `CreateOptionDropdown`, navigating to the Fixed Bundle builder
 * (`#bundle/new`) instead of the generic Option Set builder (`#lists/new`).
 */
const CreateFixedBundleButton = ( {
	buttonLabel = __( 'Create Fixed Bundle', 'fast-bundle' ),
	buttonVariant = 'secondary',
	buttonSize = 'large',
	size = 'default',
} ) => {
	const goToNewBundle = useCallback( () => {
		window.location.href = fbndBackendData.db_url + 'bundle/new';
	}, [] );

	return (
		<Button
			{ ...( buttonSize === 'large' && { __next40pxDefaultSize: true } ) }
			variant={ buttonVariant }
			size={ size }
			icon={ plus }
			onClick={ goToNewBundle }
			style={ { flexShrink: 0 } }
		>
			{ buttonLabel }
		</Button>
	);
};

export default CreateFixedBundleButton;
