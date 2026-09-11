import { createRoot, useEffect, useRef, useState } from '@wordpress/element';
import Header from './components/header';
import Analytics from './pages/analytics';
import Editor from './pages/editor';
import { License } from './pages/license';
import OptionList from './pages/option-lists';
import { OurProduct } from './pages/our-products';
import Overview from './pages/overview';
import Settings from './pages/settings';
import useNavStore, { handlePageHash } from './store/nav/useNavStore';
import Toast from './utils/toast';

import './scss/fastbundle-backend.scss';

const useFreshInstallMenuClass = ( isFreshInstall ) => {
	useEffect( () => {
		document
			.getElementById( 'toplevel_page_fbnd-dashboard' )
			?.classList.toggle( 'fbnd-fresh-install', isFreshInstall );
	}, [ isFreshInstall ] );
};

const Dashboard = () => {
	const pageHash = window.location.hash;
	const [ isListing, setIsListing ] = useState(
		pageHash.includes( '#lists/' ) ? false : true
	);
	const pageOptionid = pageHash.includes( '#lists/' )
		? pageHash?.split( '/' )[ 1 ]
		: '';
	const [ optionId, setOptionId ] = useState( pageOptionid );

	useEffect( () => {
		const hash = window.location.hash;
		const splited = hash?.split( '/' );
		if ( hash && splited.length > 1 ) {
			setOptionId( splited[ 1 ] );
			setIsListing( false );
		}
	}, [] );

	const stateRef = useRef( { isListing, optionId } );
	useEffect( () => {
		stateRef.current = { isListing, optionId };
	}, [ isListing, optionId ] );

	useEffect( () => {
		const abortControl = new AbortController();

		const checkUrlChange = () => {
			const hash = window.location.hash;
			const splited = hash?.split( '/' );
			const newOptionId = hash && splited.length > 1 ? splited[ 1 ] : '';

			if ( stateRef.current.isListing ) {
				if ( newOptionId ) {
					setOptionId( newOptionId );
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

	return (
		<>
			{ isListing && <Header /> }

			<div>
				<style id="fbnd-global-css"></style>
				{ isListing ? (
					<OptionList
						setIsListing={ setIsListing }
						setOptionId={ setOptionId }
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

	// Handle special case for lists route
	if ( currentNav === 'lists' || currentNav.includes( 'lists' ) ) {
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
