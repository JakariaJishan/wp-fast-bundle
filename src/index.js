import { createRoot, useEffect, useRef, useState } from '@wordpress/element';
import Header from './components/header';
import Analytics from './pages/analytics';
import Editor from './pages/editor';
import BuyXGetYEditor from './pages/editor/buy-x-get-y';
import FixedBundleEditor from './pages/editor/fixed-bundle';
import { License } from './pages/license';
import OptionList from './pages/option-lists';
import { OurProduct } from './pages/our-products';
import Overview from './pages/overview';
import Settings from './pages/settings';
import useNavStore, { handlePageHash } from './store/nav/useNavStore';
import Toast from './utils/toast';
import { OFFER_TYPES } from './utils/offer-types';

import './scss/fastbundle-backend.scss';

const useFreshInstallMenuClass = ( isFreshInstall ) => {
	useEffect( () => {
		document
			.getElementById( 'toplevel_page_fbnd-dashboard' )
			?.classList.toggle( 'fbnd-fresh-install', isFreshInstall );
	}, [ isFreshInstall ] );
};

/**
 * Which builder component handles each registered offer type's hash prefix.
 * Adding a new offer type to `OFFER_TYPES` and its builder component here is
 * the only wiring a new offer needs — everything else in `Dashboard` is
 * generic.
 */
const OFFER_EDITORS = {
	[ OFFER_TYPES.fixed_bundle.prefix ]: FixedBundleEditor,
	[ OFFER_TYPES.buy_x_get_y.prefix ]: BuyXGetYEditor,
};

/**
 * Which hash family (`#lists/{id}`, or one of the registered offer prefixes)
 * the current URL is in, if any.
 *
 * @param {string} hash `window.location.hash`.
 * @return {string} The matching prefix ('lists' or an offer prefix), or ''
 *                   when the hash doesn't have an id segment.
 */
const getHashPrefix = ( hash ) => {
	if ( hash.includes( '#lists/' ) ) {
		return 'lists';
	}
	const prefix = Object.keys( OFFER_EDITORS ).find( ( p ) =>
		hash.includes( `#${ p }/` )
	);
	return prefix || '';
};

const Dashboard = () => {
	const pageHash = window.location.hash;
	const initialPrefix = getHashPrefix( pageHash );
	const [ isListing, setIsListing ] = useState( ! initialPrefix );
	const [ offerPrefix, setOfferPrefix ] = useState(
		OFFER_EDITORS[ initialPrefix ] ? initialPrefix : ''
	);
	const pageOptionid = initialPrefix ? pageHash?.split( '/' )[ 1 ] : '';
	const [ optionId, setOptionId ] = useState( pageOptionid );

	useEffect( () => {
		const hash = window.location.hash;
		const splited = hash?.split( '/' );
		if ( hash && splited.length > 1 ) {
			const prefix = getHashPrefix( hash );
			setOptionId( splited[ 1 ] );
			setOfferPrefix( OFFER_EDITORS[ prefix ] ? prefix : '' );
			setIsListing( false );
		}
	}, [] );

	const stateRef = useRef( { isListing, optionId, offerPrefix } );
	useEffect( () => {
		stateRef.current = { isListing, optionId, offerPrefix };
	}, [ isListing, optionId, offerPrefix ] );

	useEffect( () => {
		const abortControl = new AbortController();

		const checkUrlChange = () => {
			const hash = window.location.hash;
			const splited = hash?.split( '/' );
			const newOptionId = hash && splited.length > 1 ? splited[ 1 ] : '';

			if ( stateRef.current.isListing ) {
				if ( newOptionId ) {
					const prefix = getHashPrefix( hash );
					setOptionId( newOptionId );
					setOfferPrefix( OFFER_EDITORS[ prefix ] ? prefix : '' );
					setIsListing( false );
				}
			} else if ( ! stateRef.current.isListing && ! newOptionId ) {
				setIsListing( true );
			}
		};

		window.addEventListener( 'fbndlocationchange', checkUrlChange, {
			signal: abortControl.signal,
		} );
		checkUrlChange();

		return () => {
			abortControl.abort();
		};
	}, [] );

	const OfferEditor = OFFER_EDITORS[ offerPrefix ];

	return (
		<>
			{ isListing && <Header /> }

			<div>
				<style id="fbnd-global-css"></style>
				{ isListing ? (
					<OptionList
						setIsListing={ setIsListing }
						setOptionId={ setOptionId }
						setOfferType={ ( type ) =>
							setOfferPrefix( OFFER_TYPES[ type ]?.prefix || '' )
						}
					/>
				) : OfferEditor ? (
					<OfferEditor
						optionId={ optionId }
						setOptionId={ setOptionId }
						setIsListing={ setIsListing }
					/>
				) : (
					<Editor
						setIsListing={ setIsListing }
						setOptionId={ setOptionId }
						optionId={ optionId }
					/>
				) }
			</div>
		</>
	);
};

// Route configuration object
const routeConfig = {
	dashboard: { component: Overview, showHeader: true },
	analytics: { component: Analytics, showHeader: true },
	our_product: { component: OurProduct, showHeader: true },
	settings: { component: Settings, showHeader: true },
	license: { component: License, showHeader: true },
};

// Route wrapper component
const RouteWrapper = ( { children, showHeader = false } ) => (
	<>
		{ showHeader && <Header /> }
		{ children }
	</>
);

// Custom hook for route rendering
const useRouteRenderer = ( currentNav, isFreshInstall ) => {
	const showLicenseOverGate =
		isFreshInstall &&
		currentNav === 'license' &&
		! fbndBackendData?.isActive;

	if ( showLicenseOverGate ) {
		return routeConfig.license;
	}

	if ( isFreshInstall && ! currentNav.includes( 'lists/' ) ) {
		return { component: Dashboard, showHeader: false };
	}

	// Handle special case for the lists route and every registered offer
	// type's own hash prefix (e.g. 'bundle', 'bxgy').
	const dashboardPrefixes = [
		'lists',
		...Object.values( OFFER_TYPES ).map( ( offer ) => offer.prefix ),
	];
	if ( dashboardPrefixes.some( ( prefix ) => currentNav.includes( prefix ) ) ) {
		return { component: Dashboard, showHeader: false };
	}

	if ( currentNav.includes( 'our_product' ) ) {
		return routeConfig.our_product;
	}
	// Return configured route or null
	return routeConfig[ currentNav ] || null;
};

const App = () => {
	const currentNav = useNavStore( ( state ) => state.currentNav );
	const setCurrentNav = useNavStore( ( state ) => state.setCurrentNav );
	const isFreshInstall = useNavStore( ( state ) => state.isFreshInstall );
	const routeData = useRouteRenderer( currentNav, isFreshInstall );

	useFreshInstallMenuClass( isFreshInstall );

	const _fetchQuery = () => {
		const pageUrl = window.location.href;
		if ( pageUrl.includes( 'page=fbnd-dashboard#' ) ) {
			setCurrentNav( handlePageHash( pageUrl ) );
		}
	};

	const handleClickOutside = ( e ) => {
		if (
			e.target &&
			! e.target.classList?.contains( 'ultp-reserve-button' )
		) {
			if ( e.target.href ) {
				if ( e.target.href.indexOf( 'page=fbnd-dashboard#' ) > 0 ) {
					const slug = e.target.href.split( '#' );
					if ( slug[ 1 ] ) {
						setCurrentNav( slug[ 1 ] );
						window.scrollTo( { top: 0, behavior: 'smooth' } );
					}
				}
			}
		}
	};

	useEffect( () => {
		const abortControl = new AbortController();
		_fetchQuery();
		document.addEventListener( 'mousedown', handleClickOutside, {
			signal: abortControl.signal,
		} );
		return () => abortControl.abort();
	}, [] );

	// Render the route component
	const renderRoute = () => {
		if ( ! routeData ) {
			return null;
		}

		const RouteComponent = routeData.component;
		return (
			<RouteWrapper showHeader={ routeData.showHeader }>
				<RouteComponent />
			</RouteWrapper>
		);
	};

	return (
		<div>
			<style id="fbnd-global-css"></style>
			{ renderRoute() }
			<Toast />
		</div>
	);
};

if (
	document.body.contains( document.getElementById( 'fbnd-dashboard-wrap' ) )
) {
	const container = document.getElementById( 'fbnd-dashboard-wrap' );
	const root = createRoot( container );
	root.render( <App /> );
}
