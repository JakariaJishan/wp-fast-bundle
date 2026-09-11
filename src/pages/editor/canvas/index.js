import useEditorStore from '@/store/editor/useEditorStore';
import { generateBlockId } from '@/utils/utils';
import {
	Button,
	Card,
	CardBody,
	__experimentalHeading as Heading,
	__experimentalHStack as HStack,
	Spinner,
	__experimentalText as Text,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { close, plus } from '@wordpress/icons';

/**
 * The builder's canvas: the list of items making up the option being edited.
 *
 * Starts intentionally generic — a flat list of `{ blockid, type, label }`
 * items — ready for Fast Bundle's own item/block types to replace the
 * placeholder "item" type as they're built.
 *
 * @param {Object}  props
 * @param {boolean} props.isLoading Shows a spinner instead of the list.
 */
const Canvas = ( { isLoading } ) => {
	const blocks = useEditorStore( ( state ) => state.blocks );
	const setBlocks = useEditorStore( ( state ) => state.setBlocks );
	const activeBlockId = useEditorStore( ( state ) => state.activeBlockId );
	const setActiveBlockId = useEditorStore(
		( state ) => state.setActiveBlockId
	);

	const addBlock = () => {
		const newBlock = {
			blockid: generateBlockId(),
			type: 'item',
			label: __( 'New Item', 'fast-bundle' ),
		};
		setBlocks( [ ...blocks, newBlock ] );
		setActiveBlockId( newBlock.blockid );
	};

	const removeBlock = ( blockid ) => {
		setBlocks( blocks.filter( ( block ) => block.blockid !== blockid ) );
		if ( activeBlockId === blockid ) {
			setActiveBlockId( '' );
		}
	};

	if ( isLoading ) {
		return (
			<HStack justify="center" style={ { padding: '80px 0' } }>
				<Spinner />
			</HStack>
		);
	}

	return (
		<div className="fbnd-builder-wrap" style={ { padding: 24 } }>
			<VStack spacing={ 3 } style={ { maxWidth: 720, margin: '0 auto' } }>
				{ blocks.length === 0 && (
					<Card className="fbnd-card-panel">
						<CardBody>
							<VStack
								spacing={ 3 }
								alignment="center"
								style={ { padding: '32px 0' } }
							>
								<Heading level={ 4 }>
									{ __( 'No items yet', 'fast-bundle' ) }
								</Heading>
								<Text variant="muted">
									{ __(
										'Add the first item to this bundle to get started.',
										'fast-bundle'
									) }
								</Text>
							</VStack>
						</CardBody>
					</Card>
				) }

				{ blocks.map( ( block ) => (
					<Card
						key={ block.blockid }
						className="fbnd-card-panel"
						style={ {
							cursor: 'pointer',
							borderColor:
								activeBlockId === block.blockid
									? 'var(--wp-admin-theme-color, #3858e9)'
									: undefined,
						} }
						onClick={ () => setActiveBlockId( block.blockid ) }
					>
						<CardBody>
							<HStack justify="space-between">
								<VStack spacing={ 1 }>
									<Text weight={ 600 }>{ block.label }</Text>
									<Text variant="muted" size={ 12 }>
										{ block.type }
									</Text>
								</VStack>
								<Button
									icon={ close }
									label={ __( 'Remove', 'fast-bundle' ) }
									onClick={ ( e ) => {
										e.stopPropagation();
										removeBlock( block.blockid );
									} }
								/>
							</HStack>
						</CardBody>
					</Card>
				) ) }

				<Button
					variant="secondary"
					icon={ plus }
					onClick={ addBlock }
					style={ { alignSelf: 'flex-start' } }
				>
					{ __( 'Add Item', 'fast-bundle' ) }
				</Button>
			</VStack>
		</div>
	);
};

export default Canvas;
