import AssignedShow from '@/components/assigned-show';
import DataChart from '@/components/graph/data-chart';
import apiFetch from '@wordpress/api-fetch';
import {
	Button,
	Card,
	CardBody,
	FlexItem,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { DataViews, filterSortAndPaginate } from '@wordpress/dataviews';
import { useEffect, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
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

	getRandomOffsets( 4, 6 ).forEach( ( offset ) =>
		data.push( createEntry( offset ) )
	);
	getRandomOffsets( 5, 30, 7 ).forEach( ( offset ) =>
		data.push( createEntry( offset ) )
	);
	getRandomOffsets( 7, 365, 31 ).forEach( ( offset ) =>
		data.push( createEntry( offset ) )
	);

	return data;
};

const dummyTable = [
	{
		id: 1,
		title: 'Birthday Cake',
		click: '92',
		cart: '78',
		sales: '736.5',
		assigned: {
			aType: 'all_product',
			includes: [],
			excludes: [],
		},
	},
	{
		id: 2,
		title: 'Summer Collection',
		click: '70',
		cart: '60',
		sales: '1200.5',
		assigned: {
			aType: 'all_product',
			includes: [],
			excludes: [],
		},
	},
	{
		id: 3,
		title: 'Gift Box',
		click: '45',
		cart: '75',
		sales: '355.5',
		assigned: {
			aType: 'all_product',
			includes: [],
			excludes: [],
		},
	},
	{
		id: 4,
		title: 'Candy Collection',
		click: '60',
		cart: '79',
		sales: '266.5',
		assigned: {
			aType: 'all_product',
			includes: [],
			excludes: [],
		},
	},
	{
		id: 5,
		title: 'Clothing',
		click: '35',
		cart: '25',
		sales: '30.5',
		assigned: {
			aType: 'all_product',
			includes: [],
			excludes: [],
		},
	},
];

const Analytics = () => {
	const [ isLoading, setIsLoading ] = useState( true );
	const [ statsTable, setStatsTable ] = useState( [] );
	const [ statsGraph, setStatsGraph ] = useState( [] );

	const itemsPerPage = 8;

	const [ view, setView ] = useState( {
		type: 'table',
		perPage: itemsPerPage,
		page: 1,
		layout: 'table',
		fields: [ 'id', 'title', 'assigned', 'click', 'cart', 'sales' ],
	} );

	const processedData = useMemo( () => {
		const source =
			statsTable && statsTable.length > 0 ? statsTable : dummyTable;
		return source.map( ( item ) => ( {
			...item,
			id: Number( item.id ),
			title: item.title || __( 'Untitled', 'fast-bundle' ),
			click: Number( item.click ) || 0,
			cart: Number( item.cart ) || 0,
			sales: Number( item.sales ) || 0,
		} ) );
	}, [ statsTable ] );

	const fields = useMemo(
		() => [
			{
				label: __( 'ID', 'fast-bundle' ),
				id: 'id',
				type: 'integer',
				enableSorting: true,
				render: ( { item } ) => item.id,
			},
			{
				label: __( 'Name', 'fast-bundle' ),
				id: 'title',
				type: 'text',
				enableSorting: true,
				render: ( { item } ) => {
					return (
						<Button
							variant="link"
							title={ item.title }
							href={ `${ window.location.pathname }${ window.location.search }#lists/${ item.id }` }
							style={ {
								overflow: 'hidden',
								textOverflow: 'ellipsis',
								whiteSpace: 'nowrap',
								display: 'block',
							} }
						>
							{ item.title }
						</Button>
					);
				},
			},
			{
				label: __( 'Applied to (Product)', 'fast-bundle' ),
				id: 'assigned',
				type: 'text',
				enableSorting: false,
				render: ( { item } ) => <AssignedShow option={ item } />,
			},
			{
				label: __( 'Click Rate', 'fast-bundle' ),
				id: 'click',
				type: 'integer',
				enableSorting: true,
				render: ( { item } ) =>
					item.click > 99 ? 100 : item.click + '%',
			},
			{
				label: __( 'Add to Cart Rate', 'fast-bundle' ),
				id: 'cart',
				type: 'integer',
				enableSorting: true,
				render: ( { item } ) =>
					item.cart > 99 ? 100 : item.cart + '%',
			},
			{
				label: __( 'Sales', 'fast-bundle' ),
				id: 'sales',
				type: 'text',
				enableSorting: true,
				render: ( { item } ) => (
					<>
						{ item.sales }
						{ fbndBackendData.currencySymbol }
					</>
				),
			},
		],
		[]
	);

	useEffect( () => {
		setIsLoading( true );
		apiFetch( {
			method: 'GET',
			path: '/fbnd/get_analytics',
		} ).then( ( obj ) => {
			setIsLoading( false );
			if ( obj.success ) {
				setStatsTable( obj.stats_table );
				setStatsGraph( obj.stats_graph );
			}
		} );
	}, [] );

	const { data: shownData, paginationInfo } = useMemo( () => {
		return filterSortAndPaginate( processedData, view, fields );
	}, [ view, processedData, fields ] );

	const hasRealData = statsGraph.length > 0;

	return (
		<VStack
			spacing={ 8 }
			className="fbnd-container"
			style={ { marginTop: 40 } }
		>
			<ExpiredMessage />
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
					chartData={ hasRealData ? statsGraph : generateDummyData() }
				/>
			</VStack>

			<Card className="fbnd-analytics-dataviews">
				<CardBody>
					<DataViews
						view={ view }
						onChangeView={ ( viewItem ) => setView( viewItem ) }
						fields={ fields }
						data={ shownData }
						isLoading={ isLoading }
						paginationInfo={ paginationInfo }
						defaultLayouts={ {
							table: {
								spacing: 'normal',
								showHeader: false,
							},
						} }
					/>
				</CardBody>
			</Card>
		</VStack>
	);
};

export default Analytics;
