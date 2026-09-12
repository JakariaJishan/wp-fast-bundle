/**
 * Navigation store.
 *
 * Kept separate from the editor store: nothing about the current page depends
 * on block state, so they should not share a subscription.
 *
 *     const currentNav = useNavStore( ( state ) => state.currentNav );
 */

import createStore from '../createStore';

/**
 * Reads the dashboard page out of a URL.
 *
 * @param {string} url The URL to read.
 * @return {string} The page hash, defaulting to 'dashboard'.
 */
export const handlePageHash = ( url ) => {
	let hash = 'dashboard';
	if ( url && window.location.href?.includes( 'page=fbnd-dashboard#' ) ) {
		const pageUrl = url.split( 'page=fbnd-dashboard#' );
		if ( pageUrl[ 1 ] ) {
			hash = pageUrl[ 1 ];
		}
	}
	return hash;
};

/**
 * Patches history so in-app navigation emits a single event we can listen to.
 * Runs once at import, as it did at module scope in the old context file.
 * @param history
 */
( function ( history ) {
	const { pushState, replaceState } = history;

	const fireEvent = ( type ) => window.dispatchEvent( new Event( type ) );

	history.pushState = function ( ...args ) {
		const result = pushState.apply( this, args );
		fireEvent( 'pushstate' );
		fireEvent( 'fbndlocationchange' );
		return result;
	};

	history.replaceState = function ( ...args ) {
		const result = replaceState.apply( this, args );
		fireEvent( 'replacestate' );
		fireEvent( 'fbndlocationchange' );
		return result;
	};

	window.addEventListener( 'popstate', () =>
		fireEvent( 'fbndlocationchange' )
	);
} )( window.history );

/**
 * Syncs the URL hash and highlights the matching admin menu item.
 *
 * @param {string} currentNav The active page.
 */
const syncLocation = ( currentNav ) => {
	if ( currentNav === 'lists' ) {
		if ( ! window.location.hash?.includes( `#${ currentNav }` ) ) {
			window.location.hash = currentNav;
		}
	} else if ( window.location.hash !== `#${ currentNav }` ) {
		window.location.hash = currentNav;
	}

	document
		.querySelectorAll( '#toplevel_page_fbnd-dashboard ul li' )
		.forEach( ( li ) => li.classList.remove( 'current' ) );

	const targetMenuItem = document.querySelector(
		`#toplevel_page_fbnd-dashboard ul li a[href$="#${ currentNav }"]`
	);
	if ( targetMenuItem ) {
		targetMenuItem.closest( 'li' ).classList.add( 'current' );
	}
};

const useNavStore = createStore( ( set ) => ( {
	currentNav: handlePageHash( window.location?.href ),
	isFreshInstall: !! fbndBackendData?.isFreshInstall,

	handlePageHash,

	/**
	 * Navigates to a page and syncs the URL and menu highlight.
	 *
	 * @param {string} currentNav The page to show.
	 */
	setCurrentNav: ( currentNav ) =>
		set( ( state ) => {
			if ( state.currentNav === currentNav ) {
				return state;
			}
			syncLocation( currentNav );
			return { currentNav };
		} ),

	clearFreshInstall: () => {
		fbndBackendData.isFreshInstall = false;
		set( { isFreshInstall: false } );
	},
} ) );

// Keep the store in step with browser navigation. One listener for the app,
// rather than one per mounted component.
window.addEventListener( 'fbndlocationchange', () => {
	// Any '#prefix/{id}' hash (the lists route, or an offer type's own
	// builder route) highlights the same top-level menu item as its bare
	// '#prefix' form — strip the id segment for menu-highlighting purposes.
	const hash = window.location.hash.replace( /^(#[^/]+)\/.*/, '$1' );
	useNavStore.getState().setCurrentNav( hash.replace( '#', '' ) );
} );

// Apply the highlight for the page we loaded on.
syncLocation( useNavStore.getState().currentNav );

export default useNavStore;
