import CreateOfferModal from '@/components/create-offer-modal';
import useNavStore from '@/store/nav/useNavStore';
import icons from '@/utils/icons';
import {
	Button,
	Card,
	CardDivider,
	Dropdown,
	DropdownMenu,
	__experimentalHStack as HStack,
	Icon,
	__experimentalText as Text,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';
import { useLayoutEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { chevronDown, chevronUp, menu, plugins } from '@wordpress/icons';
import Hellobar from './hello-bar';
import './style.scss';
const UPGRADE_PRO_URL = '#';

const UPGRADE_PRO_TEXT = fbndBackendData.isExpired
	? __( 'Renew License', 'fast-bundle' )
	: __( 'Upgrade Pro', 'fast-bundle' );
const menuItems = [
	{ to: 'dashboard', label: __( 'Dashboard', 'fast-bundle' ) },
	{ to: 'lists', label: __( 'Option Set', 'fast-bundle' ) },
	{ to: 'analytics', label: __( 'Analytics', 'fast-bundle' ) },
	{ to: 'settings', label: __( 'Settings', 'fast-bundle' ) },
];

const Header = () => {
	const isMobile = useViewportMatch( 'mobile', '<' );
	const isTab = useViewportMatch( 'medium', '<' );
	const isXLarge = useViewportMatch( 'xlarge' );
	const menuRef = useRef( null );
	const linkRefs = useRef( [] );
	const linkWidthsRef = useRef( [] );
	const calculateWidthsRef = useRef( null );
	const rafIdRef = useRef( null );
	const moreToggleRef = useRef( null );
	const moreMeasureRef = useRef( null );
	const [ exceedingIndex, setExceedingIndex ] = useState( 0 );
	const [ moreState, setMoreState ] = useState( false );
	const currentNav = useNavStore( ( state ) => state.currentNav );
	const setCurrentNav = useNavStore( ( state ) => state.setCurrentNav );
	const isFreshInstall = useNavStore( ( state ) => state.isFreshInstall );

	const scheduleCalculateWidths = () => {
		if ( rafIdRef.current ) {
			cancelAnimationFrame( rafIdRef.current );
		}
		rafIdRef.current = requestAnimationFrame( () =>
			calculateWidthsRef.current?.()
		);
	};

	calculateWidthsRef.current = () => {
		if ( isTab ) {
			setExceedingIndex( 0 );
			return;
		}
		if ( ! menuRef.current ) {
			return;
		}

		const menuWidth = menuRef.current.offsetWidth;
		if ( ! menuWidth ) {
			return;
		}

		const moreToggleWidth = Math.max(
			80, // Set a minimum width to prevent layout issues when the More button is not rendered yet.
			moreToggleRef.current?.offsetWidth ||
				moreMeasureRef.current?.offsetWidth ||
				0 // Add some padding to prevent wrapping issues.
		);

		const totalItems = menuItems.length;
		let totalWidth = 0;
		let visibleCount = 0;

		for ( let index = 0; index < totalItems; index++ ) {
			const el = linkRefs.current[ index ];
			if ( el?.offsetWidth ) {
				linkWidthsRef.current[ index ] = el.offsetWidth;
			}
			const itemWidth = linkWidthsRef.current[ index ] || 0;
			const remaining = totalItems - ( index + 1 );
			const nextTotal = totalWidth + itemWidth;
			const requiredWidth =
				remaining > 0 ? nextTotal + moreToggleWidth : nextTotal;

			if ( requiredWidth <= menuWidth ) {
				totalWidth = nextTotal;
				visibleCount = index + 1;
			} else {
				break;
			}
		}

		const nextExceedingIndex =
			visibleCount >= totalItems || totalItems - visibleCount === 1
				? 0
				: Math.max( visibleCount, 1 );
		setExceedingIndex( nextExceedingIndex );
	};

	useLayoutEffect( () => {
		scheduleCalculateWidths();

		const abortControl = new AbortController();
		window.addEventListener( 'resize', scheduleCalculateWidths, {
			signal: abortControl.signal,
		} );

		let resizeObserver;
		if ( window.ResizeObserver && menuRef.current ) {
			resizeObserver = new ResizeObserver( scheduleCalculateWidths );
			resizeObserver.observe( menuRef.current );
		}

		return () => {
			abortControl.abort();
			resizeObserver?.disconnect();
			if ( rafIdRef.current ) {
				cancelAnimationFrame( rafIdRef.current );
			}
		};
	}, [ isTab ] );

	useLayoutEffect( () => {
		// When exceedingIndex changes, the More button mounts/unmounts — recalculate.
		scheduleCalculateWidths();
	}, [ exceedingIndex ] );

	const handleMobileNav = ( to ) => {
		setCurrentNav( to );
	};

	const moreMenuControls = menuItems
		.slice( exceedingIndex )
		.map( ( item ) => ( {
			title: item.label,
			isActive: currentNav === item.to,
			onClick: () => setCurrentNav( item.to ),
		} ) );

	const headerDropdownContent = () => {
		return (
			<div style={ { width: '70vw', maxWidth: 250 } }>
				<VStack>
					{ ! isFreshInstall &&
						menuItems.map( ( item, index ) => (
							<Button
								__next40pxDefaultSize
								variant="tertiary"
								onClick={ () => handleMobileNav( item.to ) }
								ref={ ( el ) =>
									( linkRefs.current[ index ] = el )
								}
								key={ item.to }
								style={ {
									justifyContent: 'center',
									backgroundColor:
										currentNav === item.to
											? 'rgba(var(--wp-admin-theme-color--rgb), 0.1)'
											: '',
								} }
							>
								{ item.label }
							</Button>
						) ) }

					{ ! isFreshInstall && (
						<Button
							__next40pxDefaultSize
							variant="tertiary"
							onClick={ () => handleMobileNav( 'our_product' ) }
							style={ {
								justifyContent: 'center',
								backgroundColor:
									currentNav === 'our_product'
										? 'rgba(var(--wp-admin-theme-color--rgb), 0.1)'
										: '',
							} }
						>
							{ __( 'Our Pluginss', 'fast-bundle' ) }
						</Button>
					) }
				</VStack>
			</div>
		);
	};

	return (
		<Card isRounded={ false } size={ isMobile ? 'xSmall' : 'small' }>
			<Hellobar />
			{ /* Hidden button used only to pre-measure the More toggle width — do not remove */ }
			<Button
				ref={ moreMeasureRef }
				variant="tertiary"
				icon={ chevronDown }
				tabIndex={ -1 }
				aria-hidden="true"
				style={ {
					position: 'absolute',
					top: '-9999px',
					left: '-9999px',
					visibility: 'hidden',
					pointerEvents: 'none',
				} }
			>
				{ __( 'More', 'fast-bundle' ) }
			</Button>
			<div className="fbnd-container">
				<HStack spacing={ 0 }>
					<HStack
						alignment="stretch"
						justify="space-between"
						spacing={ isXLarge ? 2 : 0 }
						style={ { padding: isFreshInstall && '16px 0px' } }
					>
						<HStack expanded={ false } style={ { flexShrink: 0 } }>
							<Icon
								icon={ icons.logo }
								style={ {
									width: 'fit-content',
									height: isXLarge ? 40 : isMobile ? 26 : 30,
								} }
							/>

							{ ( isXLarge || isTab ) && ! isMobile && (
								<Text
									size="xSmall"
									style={ {
										border: '1px solid currentColor',
										padding: '2px 6px 0px',
										borderRadius: '40px',
										flexShrink: 0,
									} }
								>
									{ fbndBackendData.version }
								</Text>
							) }
						</HStack>
						{ ! isFreshInstall && (
							<CardDivider
								style={ { width: 'auto' } }
								marginStart={ isMobile ? 2 : 3 }
								marginEnd={ isMobile ? 2 : 3 }
								orientation="vertical"
							/>
						) }

						{ ! isFreshInstall && (
							<HStack
								spacing={ isXLarge ? 4 : 2 }
								style={ { padding: '16px 0px' } }
							>
								<CreateOfferModal
									buttonVariant="primary"
									size={
										isXLarge
											? 'default'
											: isMobile
											? 'small'
											: 'compact'
									}
								/>

								{ ! isTab && (
									<HStack alignment="left" ref={ menuRef }>
										{ exceedingIndex !== 0 ? (
											<>
												{ menuItems
													.slice( 0, exceedingIndex )
													.map( ( item, index ) => (
														<Button
															__next40pxDefaultSize
															ref={ ( el ) =>
																( linkRefs.current[
																	index
																] = el )
															}
															key={ item.to }
															variant="tertiary"
															onClick={ () =>
																setCurrentNav(
																	item.to
																)
															}
															style={ {
																flexShrink: 0,
																backgroundColor:
																	currentNav ===
																	item.to
																		? 'rgba(var(--wp-admin-theme-color--rgb), 0.1)'
																		: '',
															} }
															size={
																isXLarge
																	? 'default'
																	: isMobile
																	? 'small'
																	: 'compact'
															}
														>
															{ item.label }
														</Button>
													) ) }
												<DropdownMenu
													controls={
														moreMenuControls
													}
													popoverProps={ {
														placement: 'bottom-end',
													} }
													icon={
														moreState
															? chevronUp
															: chevronDown
													}
													label={ __(
														'More',
														'fast-bundle'
													) }
													text={ __(
														'More',
														'fast-bundle'
													) }
													onToggle={ ( open ) =>
														setMoreState( open )
													}
													toggleProps={ {
														ref: moreToggleRef,
														variant: 'tertiary',
														iconPosition: 'right',
														style: {
															padding:
																'0 0 0 8px',
															flexShrink: 0,
															backgroundColor:
																moreState
																	? 'rgba(var(--wp-admin-theme-color--rgb), 0.1)'
																	: '',
														},
													} }
												/>
											</>
										) : (
											menuItems.map( ( item, index ) => (
												<Button
													__next40pxDefaultSize
													ref={ ( el ) =>
														( linkRefs.current[
															index
														] = el )
													}
													key={ item.to }
													variant="tertiary"
													onClick={ () =>
														setCurrentNav( item.to )
													}
													style={ {
														flexShrink: 0,
														backgroundColor:
															currentNav ===
															item.to
																? 'rgba(var(--wp-admin-theme-color--rgb), 0.1)'
																: '',
													} }
													size={
														isXLarge
															? 'default'
															: isMobile
															? 'small'
															: 'compact'
													}
												>
													{ item.label }
												</Button>
											) )
										) }
									</HStack>
								) }
							</HStack>
						) }
						{ ! fbndBackendData.isActive && isTab && (
							<HStack spacing={ 0 } alignment="right">
								<Button
									__next40pxDefaultSize
									variant="secondary"
									href={ UPGRADE_PRO_URL }
									icon={
										<svg
											xmlns="http://www.w3.org/2000/svg"
											width="24"
											height="24"
											fill="none"
											viewBox="0 0 24 24"
											size="24"
										>
											<path
												fill="currentColor"
												d="M11.052 5.744a1.21 1.21 0 0 1 1.896 0l.096.14 2.346 4.02 3.054-2.776.09-.075c.944-.727 2.328.127 2.05 1.33l-2.19 9.491a1.67 1.67 0 0 1-1.624 1.292H7.23c-.777 0-1.45-.535-1.625-1.292l-2.19-9.492c-.277-1.202 1.107-2.056 2.05-1.329l.09.075L8.61 9.905l2.347-4.02zm-1.327 5.228a1.208 1.208 0 0 1-1.857.285L5.02 8.667l2.047 8.87a.17.17 0 0 0 .163.13h9.541a.17.17 0 0 0 .163-.13l2.046-8.87-2.847 2.59a1.208 1.208 0 0 1-1.857-.285L12 7.072z"
											></path>
										</svg>
									}
									target="_blank"
									size={
										isXLarge
											? 'default'
											: isMobile
											? 'small'
											: 'compact'
									}
									className="upgrade-pro-button"
								>
									{ UPGRADE_PRO_TEXT }
								</Button>
							</HStack>
						) }
						{ ! isFreshInstall && (
							<CardDivider
								style={ { width: 'auto' } }
								marginStart={ isMobile ? 2 : 3 }
								marginEnd={ isMobile ? 2 : 3 }
								orientation="vertical"
							/>
						) }
					</HStack>

					<HStack
						expanded={ false }
						style={ {
							flexShrink: 0,
							lineHeight: isTab && 0,
							margin: isTab && '0 -6px',
						} }
					>
						{ isTab ? (
							<Dropdown
								renderToggle={ ( { isOpen, onToggle } ) => (
									<Button
										variant="tertiary"
										onClick={ onToggle }
										aria-expanded={ isOpen }
										label={ __( 'Menu', 'fast-bundle' ) }
										size="compact"
										icon={ menu }
										iconSize={ isMobile ? 26 : 30 }
										style={ {
											minWidth: 'auto',
											width: 'fit-content',
										} }
									/>
								) }
								renderContent={ () => headerDropdownContent() }
							/>
						) : (
							<>
								{ ! isFreshInstall && (
									<Button
										__next40pxDefaultSize
										variant="tertiary"
										icon={ plugins }
										onClick={ () =>
											setCurrentNav( 'our_product' )
										}
										style={ { flexShrink: 0 } }
										size={
											isXLarge
												? 'default'
												: isMobile
												? 'small'
												: 'compact'
										}
									>
										{ __(
											'Our Plugins',
											'fast-bundle'
										) }
									</Button>
								) }

								{ ! fbndBackendData.isActive && (
									<Button
										__next40pxDefaultSize
										variant="secondary"
										href={ UPGRADE_PRO_URL }
										icon={
											<svg
												xmlns="http://www.w3.org/2000/svg"
												width="24"
												height="24"
												fill="none"
												viewBox="0 0 24 24"
												size="24"
											>
												<path
													fill="currentColor"
													d="M11.052 5.744a1.21 1.21 0 0 1 1.896 0l.096.14 2.346 4.02 3.054-2.776.09-.075c.944-.727 2.328.127 2.05 1.33l-2.19 9.491a1.67 1.67 0 0 1-1.624 1.292H7.23c-.777 0-1.45-.535-1.625-1.292l-2.19-9.492c-.277-1.202 1.107-2.056 2.05-1.329l.09.075L8.61 9.905l2.347-4.02zm-1.327 5.228a1.208 1.208 0 0 1-1.857.285L5.02 8.667l2.047 8.87a.17.17 0 0 0 .163.13h9.541a.17.17 0 0 0 .163-.13l2.046-8.87-2.847 2.59a1.208 1.208 0 0 1-1.857-.285L12 7.072z"
												></path>
											</svg>
										}
										target="_blank"
										className="upgrade-pro-button"
										size={
											isXLarge
												? 'default'
												: isMobile
												? 'small'
												: 'compact'
										}
									>
										{ UPGRADE_PRO_TEXT }
									</Button>
								) }
							</>
						) }
					</HStack>
				</HStack>
			</div>
		</Card>
	);
};

export default Header;
