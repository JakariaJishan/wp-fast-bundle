import { useMemo, useState } from '@wordpress/element';
import {
	Card,
	CardBody,
	CardHeader,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import {
	Area,
	AreaChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';

const metrics = {
	sales: { label: __( 'Sales', 'fast-bundle' ), color: '#3858E9' },
	order_count: { label: __( 'Orders', 'fast-bundle' ), color: '#22C55E' },
	click_count: { label: __( 'Clicks', 'fast-bundle' ), color: '#F2AE40' },
	add_to_cart_count: {
		label: __( 'Add to Cart', 'fast-bundle' ),
		color: '#6C6CFF',
	},
};

/**
 * Renders `chartData` (rows shaped like `{ date, sales, order_count,
 * click_count, add_to_cart_count }`) as a switchable area chart.
 *
 * @param {Object}  props
 * @param {boolean} props.isLoading Shows a loading placeholder instead of the chart.
 * @param {Array}   props.chartData Rows to plot.
 */
const DataChart = ( { isLoading, chartData = [] } ) => {
	const isMobile = useViewportMatch( 'mobile', '<' );
	const [ activeMetric, setActiveMetric ] = useState( 'sales' );

	const sortedData = useMemo(
		() =>
			[ ...chartData ].sort(
				( a, b ) => new Date( a.date ) - new Date( b.date )
			),
		[ chartData ]
	);

	return (
		<Card>
			<CardHeader>
				<HStack spacing={ 2 } justify="start" wrap>
					{ Object.entries( metrics ).map( ( [ key, meta ] ) => (
						<button
							key={ key }
							type="button"
							onClick={ () => setActiveMetric( key ) }
							style={ {
								border: 'none',
								background:
									activeMetric === key
										? 'rgba(56,88,233,0.1)'
										: 'transparent',
								color:
									activeMetric === key ? '#3858E9' : '#4e5049',
								padding: '6px 12px',
								borderRadius: 20,
								cursor: 'pointer',
								fontWeight: 500,
							} }
						>
							{ meta.label }
						</button>
					) ) }
				</HStack>
			</CardHeader>
			<CardBody>
				<div style={ { height: isMobile ? 240 : 340 } }>
					{ isLoading ? (
						<div
							style={ {
								height: '100%',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								color: '#9FA79D',
							} }
						>
							{ __( 'Loading…', 'fast-bundle' ) }
						</div>
					) : (
						<ResponsiveContainer width="100%" height="100%">
							<AreaChart
								data={ sortedData }
								margin={ { left: -25 } }
							>
								<defs>
									<linearGradient
										id="fbnd-chart-color"
										x1="0"
										y1="0"
										x2="0"
										y2="1"
									>
										<stop
											offset="5%"
											stopColor={
												metrics[ activeMetric ].color
											}
											stopOpacity={ 0.2 }
										/>
										<stop
											offset="95%"
											stopColor={
												metrics[ activeMetric ].color
											}
											stopOpacity={ 0 }
										/>
									</linearGradient>
								</defs>
								<CartesianGrid
									strokeDasharray="3 3"
									vertical={ false }
								/>
								<XAxis dataKey="date" />
								<YAxis />
								<Tooltip />
								<Area
									type="monotone"
									dataKey={ activeMetric }
									stroke={ metrics[ activeMetric ].color }
									fillOpacity={ 1 }
									fill="url(#fbnd-chart-color)"
								/>
							</AreaChart>
						</ResponsiveContainer>
					) }
				</div>
			</CardBody>
		</Card>
	);
};

export default DataChart;
