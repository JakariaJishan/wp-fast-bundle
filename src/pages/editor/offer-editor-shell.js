import {
	Button,
	Card,
	CardBody,
	__experimentalHStack as HStack,
	Icon,
	Modal,
	Spinner,
	__experimentalText as Text,
	TextControl,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { arrowUpLeft, check } from '@wordpress/icons';

/**
 * Shared chrome for every non-generic offer builder (Fixed Bundle, Buy X Get
 * Y, and whatever comes next): the sticky header (back button, title field,
 * draft/publish toggle, save button), the unsaved-changes exit guard, and
 * the "title required" guard. Mirrors the generic block-canvas Editor's own
 * header (`src/pages/editor/index.js`) so both builder families look and
 * behave the same, without each offer type re-implementing it.
 *
 * An offer editor owns its own data (items, discount, etc.) and just renders
 * that as `children` inside this shell.
 *
 * @param {Object}   props
 * @param {boolean}  props.isLoading            Shows a spinner instead of the shell.
 * @param {string}   props.title                Current title value.
 * @param {Function} props.onTitleChange        `(value) => void`.
 * @param {string}   props.titlePlaceholder     Placeholder for the title field.
 * @param {string}   props.status               'draft' | 'publish'.
 * @param {Function} props.onStatusChange       `(value) => void`.
 * @param {boolean}  props.hasUnsavedChanges    Whether the Save button shows "Save" vs "Saved".
 * @param {boolean}  props.isSaving             Busy state for the Save button.
 * @param {Function} props.onSave               `(status) => void`, called with the current status.
 * @param {Function} props.onExit               Called once it's safe to leave (after confirming, if needed).
 * @param {boolean}  props.isTitleAlertOpen     Whether the "title required" modal is open.
 * @param {Function} props.onCloseTitleAlert    Closes that modal.
 * @param {string}   props.titleRequiredMessage Message shown in that modal.
 * @param {React.ReactNode} props.children      The builder's own body content.
 */
const OfferEditorShell = ( {
	isLoading,
	title,
	onTitleChange,
	titlePlaceholder,
	status,
	onStatusChange,
	hasUnsavedChanges,
	isSaving,
	onSave,
	onExit,
	isTitleAlertOpen,
	onCloseTitleAlert,
	titleRequiredMessage,
	children,
} ) => {
	const [ isExitModalOpen, setIsExitModalOpen ] = useState( false );

	const handleExit = () => {
		if ( hasUnsavedChanges ) {
			setIsExitModalOpen( true );
		} else {
			onExit();
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
		<div>
			{ isExitModalOpen && (
				<Modal
					title={ __( 'Confirm', 'fast-bundle' ) }
					onRequestClose={ () => setIsExitModalOpen( false ) }
					size="medium"
				>
					<VStack spacing={ 6 }>
						<Text size={ 16 }>
							{ __(
								'You have unsaved changes. Save before leaving, or discard them.',
								'fast-bundle'
							) }
						</Text>
						<HStack justify="end">
							<Button variant="secondary" isDestructive onClick={ onExit }>
								{ __( 'Discard & Exit', 'fast-bundle' ) }
							</Button>
							<Button
								variant="primary"
								onClick={ () => {
									onSave( status );
									onExit();
								} }
							>
								{ __( 'Save & Exit', 'fast-bundle' ) }
							</Button>
						</HStack>
					</VStack>
				</Modal>
			) }

			{ isTitleAlertOpen && (
				<Modal
					title={ __( 'Title Required', 'fast-bundle' ) }
					onRequestClose={ onCloseTitleAlert }
					size="small"
				>
					<VStack spacing={ 6 }>
						<Text size={ 16 }>{ titleRequiredMessage }</Text>
						<HStack justify="end">
							<Button variant="primary" onClick={ onCloseTitleAlert }>
								{ __( 'OK', 'fast-bundle' ) }
							</Button>
						</HStack>
					</VStack>
				</Modal>
			) }

			<Card
				isRounded={ false }
				size="small"
				style={ { top: 0, zIndex: 999, position: 'sticky' } }
			>
				<CardBody style={ { padding: 0 } }>
					<HStack spacing={ 6 } alignment="top">
						<HStack spacing={ 3 } expanded style={ { alignItems: 'center' } }>
							<Button
								icon={ arrowUpLeft }
								iconSize={ 24 }
								onClick={ handleExit }
								label={ __( 'Back to Option Set List', 'fast-bundle' ) }
								variant="link"
								style={ {
									padding: '0 16px',
									borderRight: '1px solid #0000001a',
									width: 64,
									height: 64,
								} }
							/>
							<HStack
								spacing={ 3 }
								wrap
								style={ {
									flex: 1,
									alignItems: 'center',
									padding: '10px 6px',
								} }
							>
								<TextControl
									__nextHasNoMarginBottom
									placeholder={ titlePlaceholder }
									value={ title }
									onChange={ onTitleChange }
									style={ { minWidth: 250, maxWidth: 320 } }
								/>
								<HStack
									spacing={ 3 }
									expanded={ false }
									justify="end"
									style={ { marginInlineStart: 'auto' } }
									wrap
								>
									<ToggleGroupControl
										__nextHasNoMarginBottom
										hideLabelFromVision
										isBlock
										value={ status }
										onChange={ onStatusChange }
										style={ { height: 32 } }
									>
										<ToggleGroupControlOption
											label={ __( 'Draft', 'fast-bundle' ) }
											value="draft"
										/>
										<ToggleGroupControlOption
											label={ __( 'Publish', 'fast-bundle' ) }
											value="publish"
										/>
									</ToggleGroupControl>
									<Button
										__next40pxDefaultSize
										variant="primary"
										onClick={ () => onSave( status ) }
										isBusy={ isSaving }
										style={ { minWidth: 85, justifyContent: 'center' } }
									>
										{ hasUnsavedChanges ? (
											__( 'Save', 'fast-bundle' )
										) : (
											<>
												<Icon icon={ check } />
												{ __( 'Saved', 'fast-bundle' ) }
											</>
										) }
									</Button>
								</HStack>
							</HStack>
						</HStack>
					</HStack>
				</CardBody>
			</Card>

			<VStack
				spacing={ 4 }
				style={ { maxWidth: 720, margin: '24px auto', padding: '0 24px' } }
			>
				{ children }
			</VStack>
		</div>
	);
};

export default OfferEditorShell;
