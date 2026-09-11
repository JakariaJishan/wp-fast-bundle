import { useTemplateImport } from '@/components/use-template-import';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { plus } from '@wordpress/icons';

const CreateOptionDropdown = ( {
	buttonLabel = __( 'Create Option', 'fast-bundle' ),
	buttonVariant = 'primary',
	buttonSize = 'large',
	size = 'default',
} ) => {
	const { goToNew } = useTemplateImport();

	return (
		<Button
			{ ...( buttonSize === 'large' && {
				__next40pxDefaultSize: true,
			} ) }
			variant={ buttonVariant }
			size={ size }
			icon={ plus }
			onClick={ goToNew }
			style={ { flexShrink: 0 } }
		>
			{ buttonLabel }
		</Button>
	);
};

export default CreateOptionDropdown;
