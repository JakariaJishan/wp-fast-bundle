import { Button } from '@wordpress/components';
import { trash } from '@wordpress/icons';

function OptionController( { id, onDelete, children, className = '' } ) {
	const handleDelete = ( i ) => {
		if ( onDelete ) {
			onDelete( i );
		}
	};

	return (
		<div
			key={ id }
			className={ `fbnd-drag-wrapper fbnd-relative ${ className }` }
			id={ id }
		>
			<Button
				size="small"
				className="fbnd-block-option-controller"
				isDestructive
				variant="tertiary"
				icon={ trash }
				onClick={ () => handleDelete( id ) }
				style={ {
					position: 'absolute',
					zIndex: 999,
					right: 0,
					bottom: 'calc(100% - 4px)',
				} }
			/>
			{ children }
		</div>
	);
}

export default OptionController;
