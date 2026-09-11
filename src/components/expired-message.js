import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const ExpiredMessage = ( { styles = {} } ) => {
	if ( ! fbndBackendData.isExpired ) {
		return null;
	}

	const url = '#';

	return (
		<div className="error" style={ { margin: '0', ...styles } }>
			<span>
				{ __( 'Your', 'fast-bundle' ) }{ ' ' }
				<strong>{ __( 'Fast Bundle', 'fast-bundle' ) }</strong>{ ' ' }
				{ __(
					'license has expired. Renew your license to keep access.',
					'fast-bundle'
				) }
			</span>

			<Button
				size="compact"
				isDestructive
				variant="secondary"
				href={ url }
				target="_blank"
				style={ { marginLeft: '10px', textDecoration: 'none' } }
			>
				{ __( 'Renew Now', 'fast-bundle' ) }
			</Button>
		</div>
	);
};

export default ExpiredMessage;
