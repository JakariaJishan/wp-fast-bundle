import CreateOptionDropdown from '@/components/create-option-dropdown';
import DataChart from '@/components/graph/data-chart';
import useNavStore from '@/store/nav/useNavStore';
import Icons from '@/utils/icons';
import apiFetch from '@wordpress/api-fetch';
import {
	Button,
	Card,
	CardBody,
	CardDivider,
	CardHeader,
	ExternalLink,
	FlexItem,
	__experimentalHeading as Heading,
	__experimentalHStack as HStack,
	Icon,
	__experimentalText as Text,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';
import { Fragment, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { arrowRight, starEmpty } from '@wordpress/icons';
import ExpiredMessage from '@/components/expired-message';

const generateDummyData = () => {
	const now = new Date();
	const data = [];

	const createEntry = ( daysAgo ) => {
		const date = new Date( now );
		date.setDate( now.getDate() - daysAgo );
		return {
			id: Math.floor( Math.random() * 100 ) + 1,
			date: date.toISOString().split( 'T' )[ 0 ],
			impression_count: Math.floor( Math.random() * 2 ),
			click_count: Math.floor( Math.random() * 6 ),
			add_to_cart_count: Math.floor( Math.random() * 5 ),
			order_count: Math.floor( Math.random() * 3 ),
			sales: Math.floor( Math.random() * 51 ),
		};
	};

	const getRandomOffsets = ( count, maxDaysAgo, minDaysAgo = 0 ) => {
		const offsets = new Set();
		while ( offsets.size < count ) {
			const offset =
				Math.floor( Math.random() * ( maxDaysAgo - minDaysAgo + 1 ) ) +
				minDaysAgo;
			offsets.add( offset );
		}
		return [ ...offsets ];
	};

	// Add 4 within last 7 days
	getRandomOffsets( 4, 6 ).forEach( ( offset ) =>
		data.push( createEntry( offset ) )
	);

	// Add 5 within last 30 days (excluding last 7)
	getRandomOffsets( 5, 30, 7 ).forEach( ( offset ) =>
		data.push( createEntry( offset ) )
	);

	// Add 7 within last 365 days (excluding last 30)
	getRandomOffsets( 7, 365, 31 ).forEach( ( offset ) =>
		data.push( createEntry( offset ) )
	);

	return data;
};

const plugins = [
	{
		id: 'wow_store',
		icon: Icons.store,
		title: __( 'WowStore', 'fast-bundle' ),
		description: __(
			'No-code WooCommerce, start to finish!',
			'fast-bundle'
		),
	},
	{
		id: 'wow_revenue',
		icon: Icons.revenue,
		title: __( 'WowRevenue', 'fast-bundle' ),
		description: __(
			'Boost Sales & AOV with Custom Campaigns!',
			'fast-bundle'
		),
	},
	{
		id: 'wholesale_x',
		icon: Icons.wholesale,
		title: __( 'WholesaleX', 'fast-bundle' ),
		description: __(
			'All-in-One B2B Wholesale Solution.',
			'fast-bundle'
		),
	},
];

const actionCardsData = {
	community: {
		title: __( 'Join Our Community', 'fast-bundle' ),
		description: __(
			'Join the FastBundle community to connect with other users and share your experience with everyone',
			'fast-bundle'
		),
		buttonText: __( 'Join The Community', 'fast-bundle' ),
		buttonHref: '#',
		buttonIcon: 'facebook',
	},
	review: {
		title: __( 'Leave a review!', 'fast-bundle' ),
		description: __(
			'Love the features and functionalities of FastBundle - show your support by sharing a 5-star review.',
			'fast-bundle'
		),
		buttonText: __( 'Write a Review', 'fast-bundle' ),
		buttonHref:
			'https://wordpress.org/support/plugin/fast-bundle/reviews/#new-post',
		headerExtra: starEmpty,
	},
};

const settingsData = [
	{
		text: __( 'Documentation', 'fast-bundle' ),
		link: '#',
		linkText: __( 'Read Now', 'fast-bundle' ),
	},
	{
		text: __( 'Beginner Tutorials', 'fast-bundle' ),
		link: 'https://www.youtube.com/playlist?list=PLPidnGLSR4qfFfyjdTCYIEMdy05U5cLob',
		linkText: __( 'Watch Video', 'fast-bundle' ),
	},
	{
		text: __( 'Our Blogs', 'fast-bundle' ),
		link: '#',
		linkText: __( 'See All Blogs', 'fast-bundle' ),
	},
	{
		text: __( 'Get Support', 'fast-bundle' ),
		link: '#',
		linkText: __( 'Get Support', 'fast-bundle' ),
	},
];

const Overview = () => {
	const [ isLoading, setIsLoading ] = useState( true );
	const [ statsGraph, setStatsGraph ] = useState( [] );
	const isWide = useViewportMatch( 'wide' );
	const isTab = useViewportMatch( 'large', '<' );
	const columnStyle = ( widePercent ) => ( {
		flexBasis: isWide ? widePercent : '100%',
		width: '100%',
	} );

	const setCurrentNav = useNavStore( ( state ) => state.setCurrentNav );

	const [ installStatus, setInstallStatus ] = useState( {} );
	const [ installed, setInstalled ] = useState(
		fbndBackendData.products || {}
	);
	const [ actives, setActives ] = useState(
		fbndBackendData.products_active || {}
	);

	const handleInstall = ( key ) => {
		setInstallStatus( ( prevState ) => ( {
			...prevState,
			[ key ]: 'ing..',
		} ) );

		const formData = new FormData();
		formData.append( 'action', 'fbnd_install_plugin' );
		formData.append( 'wpnonce', fbndBackendData.nonce );
		formData.append( 'plugin', key );

		fetch( fbndBackendData.ajax, {
			method: 'POST',
			body: formData,
		} )
			.then( ( response ) => response.json() )
			// .then( () => {} )
			.catch( () => {} )
			.finally( () => {
				setInstallStatus( ( prevState ) => ( {
					...prevState,
					[ key ]: false,
				} ) );
				setInstalled( ( prevState ) => ( {
					...prevState,
					[ key ]: true,
				} ) );
				setActives( ( prevState ) => ( {
					...prevState,
					[ key ]: true,
				} ) );
			} );
	};

	useEffect( () => {
		setIsLoading( true );
		apiFetch( {
			method: 'GET',
			path: '/fbnd/get_analytics',
		} ).then( ( obj ) => {
			setIsLoading( false );
			if ( obj.success ) {
				setStatsGraph( obj.stats_graph );
			}
		} );
	}, [] );

	const SidebarCard = ( { title, headerExtra, children } ) => (
		<Card size="small">
			<CardHeader>
				<Heading level={ 3 }>{ title }</Heading>
				{ headerExtra }
			</CardHeader>
			<CardBody>{ children }</CardBody>
		</Card>
	);

	const renderActionCard = ( {
		title,
		description,
		buttonText,
		buttonHref,
		buttonIcon,
		headerExtra,
	} ) => (
		<SidebarCard
			title={ title }
			headerExtra={ headerExtra && <Icon icon={ headerExtra } /> }
		>
			<VStack spacing={ 4 }>
				<Text size={ 16 } variant="muted">
					{ description }
				</Text>
				<FlexItem isBlock={ false }>
					<Button
						size="compact"
						variant="secondary"
						icon={ buttonIcon }
						href={ buttonHref }
						target="_blank"
					>
						{ buttonText }
					</Button>
				</FlexItem>
			</VStack>
		</SidebarCard>
	);

	const renderHeroContent = () => (
		<Card>
			<CardBody>
				<HStack
					spacing={ isTab ? 6 : 12 }
					direction={ isTab ? 'column' : 'row' }
				>
					<VStack spacing={ 5 } style={ { width: '100%' } }>
						<CardHeader
							isBorderless
							size="xSmall"
							style={ { marginBottom: '-20px' } }
						/>
						<Icon
							icon={ Icons.logo }
							style={ { width: 'fit-content' } }
							height="32px"
							width="100%"
						/>
						<Heading level={ 2 }>
							{ __(
								'Unlock Customizations without Boundaries',
								'fast-bundle'
							) }
						</Heading>
						<Text size="large">
							{ __(
								'Effortlessly add custom product options—text fields, images, swatches, and more!',
								'fast-bundle'
							) }
						</Text>
						<FlexItem>
							<CreateOptionDropdown />
						</FlexItem>
					</VStack>
					<VStack>
						<HStack alignment="topRight">
							<img
								src={
									fbndBackendData.url +
									'assets/img/overview-hero-badge.svg'
								}
								alt={ __(
									'FastBundle Badge',
									'fast-bundle'
								) }
								style={ {
									position: 'absolute',
									top: '0px',
									right: '0px',
								} }
							/>
						</HStack>
						<img
							style={ { marginBottom: '7px' } }
							src={
								fbndBackendData.url +
								'assets/img/overview-hero.png'
							}
							alt="FastBundle Hero"
						/>
					</VStack>
				</HStack>
			</CardBody>
		</Card>
	);

	const PluginCard = ( { id, icon, title, description } ) => {
		const isActivated = installed[ id ] && actives[ id ];
		return (
			<Card size="small">
				<CardBody>
					<VStack spacing={ 3 }>
						<HStack>
							<HStack justify="start" expanded={ false }>
								<Icon
									style={ { width: 'fit-content' } }
									icon={ icon }
									height="24px"
									width="100%"
								/>
							</HStack>
							<FlexItem>
								{ isActivated ? (
									<Button isPressed disabled size="small">
										{ __( 'Activated', 'fast-bundle' ) }
									</Button>
								) : (
									<Button
										isBusy={ installStatus[ id ] }
										variant="primary"
										size="small"
										onClick={ () => handleInstall( id ) }
									>
										{ ! installed[ id ]
											? __( 'Install', 'fast-bundle' )
											: __(
													'Activate',
													'fast-bundle'
											  ) }
									</Button>
								) }
							</FlexItem>
						</HStack>
						<Text size={ 15 } variant="muted">
							{ description }
						</Text>
					</VStack>
				</CardBody>
			</Card>
		);
	};

	const renderOurProduct = () => (
		<SidebarCard
			title={ __( 'Our Plugins', 'fast-bundle' ) }
			headerExtra={
				<Button
					size="small"
					variant="secondary"
					icon={ arrowRight }
					iconPosition="right"
					onClick={ () => setCurrentNav( 'our_product' ) }
				>
					{ __( 'View All', 'fast-bundle' ) }
				</Button>
			}
		>
			<VStack spacing={ 4 }>
				{ plugins.map( ( plugin ) => (
					<PluginCard key={ plugin.id } { ...plugin } />
				) ) }
			</VStack>
		</SidebarCard>
	);

	const renderTips = () => (
		<SidebarCard title={ __( 'Resources', 'fast-bundle' ) }>
			<VStack spacing={ 5 }>
				{ settingsData.map( ( { text, link, linkText }, index ) => (
					<Fragment key={ index }>
						{ index > 0 && <CardDivider /> }
						<HStack alignment="edge">
							<Text size={ 16 }>{ text }</Text>
							<ExternalLink href={ link }>
								{ linkText }
							</ExternalLink>
						</HStack>
					</Fragment>
				) ) }
			</VStack>
		</SidebarCard>
	);

	const hasRealData = statsGraph.length > 0;

	return (
		<HStack
			alignment="start"
			spacing={ 8 }
			expanded={ false }
			className="fbnd-container"
			style={ { marginTop: 40 } }
			direction={ isWide ? 'row' : 'column' }
		>
			<VStack
				spacing={ 8 }
				justify="start"
				style={ columnStyle( '70%' ) }
			>
				<ExpiredMessage />
				{ renderHeroContent() }
				<VStack spacing={ 3 }>
					{ ! hasRealData && ! isLoading && (
						<FlexItem>
							<Button
								variant="secondary"
								size="compact"
								style={ {
									borderRadius: 40,
									pointerEvents: 'none',
								} }
							>
								{ __( 'This is Dummy Data', 'fast-bundle' ) }
							</Button>
						</FlexItem>
					) }
					<DataChart
						isLoading={ isLoading }
						isOverview={ true }
						chartData={
							hasRealData ? statsGraph : generateDummyData()
						}
					/>
				</VStack>
			</VStack>

			<VStack
				spacing={ 8 }
				justify="start"
				style={ columnStyle( '30%' ) }
			>
				{ renderOurProduct() }
				{ renderActionCard( actionCardsData.community ) }
				{ renderTips() }
				{ renderActionCard( actionCardsData.review ) }
			</VStack>
		</HStack>
	);
};

export default Overview;
