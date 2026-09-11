import useToastStore from '@/store/toast/useToastStore';
import {
	Snackbar,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useEffect } from 'react';

const Toast = ( { delay = 2000 } ) => {
	const toast = useToastStore( ( state ) => state.toast );
	const hideToast = useToastStore( ( state ) => state.hideToast );
	const dismissMessage = useToastStore( ( state ) => state.dismissMessage );

	const isVisible = toast.state && toast.status && toast.messages.length > 0;

	useEffect( () => {
		if ( ! isVisible ) {
			return undefined;
		}

		const timer = setTimeout( hideToast, delay );
		return () => clearTimeout( timer );
	}, [ toast, isVisible, delay, hideToast ] );

	if ( ! isVisible ) {
		return null;
	}

	return (
		<VStack
			spacing={ 2 }
			style={ {
				position: 'fixed',
				bottom: 30,
				left: '50%',
				transform: 'translateX(-50%)',
				alignItems: 'center',
				zIndex: 999999,
			} }
		>
			{ toast.messages.map( ( message, index ) => (
				<div
					key={ index }
					style={ {
						animation: 'slideUp 0.3s ease-out forwards',
					} }
				>
					<Snackbar
						explicitDismiss
						onRemove={ () => dismissMessage( index ) }
					>
						{ message }
					</Snackbar>
				</div>
			) ) }
		</VStack>
	);
};

export default Toast;
