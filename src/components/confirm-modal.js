import { Button, __experimentalHStack as HStack } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { close } from '@wordpress/icons';

const ANIMATION_MS = 150;

const ConfirmModal = ( {
	title,
	children,
	confirmLabel = 'Confirm',
	cancelLabel = 'Cancel',
	onConfirm,
	onCancel,
	isDestructive = true,
} ) => {
	const [ isClosing, setIsClosing ] = useState( false );

	const close_ = ( action ) => {
		setIsClosing( true );
		setTimeout( action, ANIMATION_MS );
	};

	return (
		<div
			style={ {
				position: 'fixed',
				inset: 0,
				zIndex: 100000,
				background: 'rgba(0, 0, 0, 0.4)',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				animation: `fbnd-confirm-modal-backdrop-${
					isClosing ? 'out' : 'in'
				} ${ ANIMATION_MS }ms ease forwards`,
			} }
			onClick={ () => close_( onCancel ) }
		>
			<style>
				{ `
				@keyframes fbnd-confirm-modal-in {
					0% { opacity: 0; transform: scale(.9); }
					100% { opacity: 1; transform: scale(1); }
				}
				@keyframes fbnd-confirm-modal-out {
					0% { opacity: 1; transform: scale(1); }
					100% { opacity: 0; transform: scale(.9); }
				}
				@keyframes fbnd-confirm-modal-backdrop-in {
					0% { opacity: 0; }
					100% { opacity: 1; }
				}
				@keyframes fbnd-confirm-modal-backdrop-out {
					0% { opacity: 1; }
					100% { opacity: 0; }
				}
				` }
			</style>
			<div
				style={ {
					background: '#fff',
					borderRadius: 8,
					minWidth: 400,
					boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
					animation: `fbnd-confirm-modal-${
						isClosing ? 'out' : 'in'
					} ${ ANIMATION_MS }ms ease forwards`,
				} }
				onClick={ ( e ) => e.stopPropagation() }
				role="dialog"
				aria-modal="true"
			>
				<HStack
					justify="space-between"
					style={ {
						padding: '16px 24px',
						width: 'auto',
					} }
				>
					<h2
						style={ {
							margin: 0,
							fontSize: 20,
							fontWeight: 600,
							lineHeight: '26px',
						} }
					>
						{ title }
					</h2>
					<Button
						icon={ close }
						size="compact"
						label={ __( 'Close', 'fast-bundle' ) }
						onClick={ () => close_( onCancel ) }
						style={ {
							padding: 4,
							minWidth: 'auto',
							height: '32px',
						} }
					/>
				</HStack>
				<div style={ { padding: '0 24px 24px 24px' } }>
					<div style={ { marginBottom: 16 } }>{ children }</div>
					<HStack justify="flex-end">
						<Button
							variant="secondary"
							size="compact"
							onClick={ () => close_( onCancel ) }
							style={ {
								height: '32px',
							} }
						>
							{ cancelLabel }
						</Button>
						<Button
							variant="primary"
							isDestructive={ isDestructive }
							size="compact"
							onClick={ () => close_( onConfirm ) }
							style={ {
								height: '32px',
							} }
						>
							{ confirmLabel }
						</Button>
					</HStack>
				</div>
			</div>
		</div>
	);
};

export default ConfirmModal;
