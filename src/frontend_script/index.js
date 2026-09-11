import { initFbndActions } from './init';
import $ from 'jquery';
import fbndFrontendState from './state';

// Public hook for integrations / debugging.
if ( typeof window !== 'undefined' ) {
	window.fbndFrontendState = fbndFrontendState;
}

$( document ).ready( function () {
	setTimeout( () => {
		initLoaders();
		initFbndActions();
	}, 10 );
} );

const initLoaders = () => {
	const $wrapper = $( '.fbnd-addons-wrapper' );

	if ( $wrapper.length ) {
		// Immediate .fbnd-loader inside wrapper
		const $loader = $wrapper.children( '.fbnd-loader' );

		setTimeout( () => {
			$wrapper.removeClass( 'fbnd-loading' );

			setTimeout( () => {
				$loader.fadeOut( 20, function () {
					$( this ).remove();
				} );
			}, 20 ); // small delay for smooth transition
		}, 120 );
	}
};
