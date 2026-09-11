import { useActiveBlock, useSetBlockAttr } from '@/store/editor/selectors';
import useEditorStore from '@/store/editor/useEditorStore';
import {
	Button,
	Card,
	CardBody,
	CardHeader,
	__experimentalHeading as Heading,
	TextControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { close } from '@wordpress/icons';

/**
 * The builder's settings drawer: a right-hand panel for the block currently
 * selected on the canvas. Starts with just a label field — extend as Fast
 * Bundle's own item types grow their own settings.
 */
const Drawer = () => {
	const drawer = useEditorStore( ( state ) => state.drawer );
	const setActiveBlockId = useEditorStore(
		( state ) => state.setActiveBlockId
	);
	const activeBlock = useActiveBlock();
	const setBlockAttr = useSetBlockAttr();

	if ( ! drawer.open || ! activeBlock.blockid ) {
		return null;
	}

	return (
		<Card
			className="fbnd-card-panel"
			style={ {
				position: 'fixed',
				top: 60,
				right: 24,
				bottom: 24,
				width: 320,
				overflowY: 'auto',
				zIndex: 100,
			} }
		>
			<CardHeader>
				<Heading level={ 4 }>{ __( 'Item Settings', 'fast-bundle' ) }</Heading>
				<Button
					icon={ close }
					label={ __( 'Close', 'fast-bundle' ) }
					onClick={ () => setActiveBlockId( '' ) }
				/>
			</CardHeader>
			<CardBody>
				<TextControl
					label={ __( 'Label', 'fast-bundle' ) }
					value={ activeBlock.label || '' }
					onChange={ ( value ) => setBlockAttr( 'label', value ) }
				/>
			</CardBody>
		</Card>
	);
};

export default Drawer;
