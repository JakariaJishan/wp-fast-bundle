import {
	Button,
	__experimentalHStack as HStack,
	Popover,
	__experimentalText as Text,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useMemo, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { arrowUpRight } from '@wordpress/icons';

const AssignedShow = ( { option, show = true } ) => {
	const [ isHover, setIsHover ] = useState( false );
	const popUpRef = useRef();

	const selectedLabel = useMemo( () => {
		const labelMap = {
			specific_category: __( 'Categories', 'fast-bundle' ),
			specific_tag: __( 'Tags', 'fast-bundle' ),
			specific_brand: __( 'Brands', 'fast-bundle' ),
		};
		return (
			labelMap[ option?.assigned?.aType ] ||
			__( 'Products', 'fast-bundle' )
		);
	}, [ option?.assigned?.aType ] );

	const tooltipStyle = useMemo( () => {
		return {
			position: 'absolute',
			zIndex: 20,
			background: '#fff',
			border: '1px solid #ddd',
			borderRadius: 6,
			boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
			padding: 16,
			top: '100%',
			left: 0,
			marginTop: 0,
			minWidth: 260,
			transform: 'translateY(1px)',
			transition: 'opacity 0.2s ease, transform 0.2s ease',
			maxHeight: '400px',
			overflowY: 'auto',
		};
	}, [] );

	const assignedIncludes = option?.assigned?.includes || [];

	const assignedSummary = useMemo( () => {
		const total = assignedIncludes.length;
		if ( total > 4 ) {
			return `+${ total - 4 } ${ selectedLabel }`;
		}
		return `${ total } ${ selectedLabel }`;
	}, [ assignedIncludes.length, selectedLabel ] );

	return (
		<div>
			{ option?.assigned?.aType === 'all_product' ? (
				<div>All Product</div>
			) : (
				<div
					onMouseEnter={ () =>
						assignedIncludes.length > 0 && setIsHover( true )
					}
					onMouseLeave={ () => {
						assignedIncludes.length > 0 && setIsHover( false );
					} }
				>
					<HStack justify="start" alignment="center" gap={ 8 }>
						{ assignedIncludes.slice( 0, 4 ).map( ( item, i ) => (
							<img
								key={ i }
								style={ {
									height: 28,
									width: 28,
									borderRadius: 35,
									border: '2px solid var(--fbnd-color-base-two)',
									marginLeft: i === 0 ? 0 : '-24px',
								} }
								src={
									item.thumbnail ||
									fbndBackendData.url +
										'assets/img/default-product.svg'
								}
								alt="Assign Product"
							/>
						) ) }
						<div>{ assignedSummary }</div>
					</HStack>

					<div style={ { height: 0, width: 0 } } ref={ popUpRef } />
					{ show && isHover && (
						<Popover
							anchorRef={ popUpRef }
							position="bottom left"
							onClose={ () => setIsHover( false ) }
							noArrow={ true }
						>
							<div style={ tooltipStyle }>
								<div
									style={ {
										position: 'absolute',
										height: '4px',
										width: '100%',
										left: '0',
										top: '-4px',
									} }
									onMouseEnter={ () => setIsHover( true ) }
								/>
								<VStack>
									{ option.assigned.includes?.map(
										( product, index ) => (
											<HStack
												key={ index }
												justify="start"
											>
												<img
													key={ `profiler-${ product.item_id }` }
													style={ {
														height: 42,
														width: 42,
														borderRadius: 4,
													} }
													src={
														product.thumbnail ||
														fbndBackendData.url +
															'assets/img/default-product.svg'
													}
													alt="product"
												/>
												{ product.url ? (
													<a
														href={ product.url }
														target="_blank"
														rel="noopener noreferrer"
														style={ {
															boxShadow: 'none',
															display: 'flex',
															alignItems:
																'center',
															gap: 0,
															textDecoration:
																'none',
														} }
													>
														<Text
															truncate
															numberOfLines={ 1 }
															style={ {
																maxWidth:
																	'130px',
															} }
															title={
																product.item_name
															}
														>
															{
																product.item_name
															}
														</Text>
														<Button
															icon={
																arrowUpRight
															}
															size="compact"
															label={ __(
																'View',
																'fast-bundle'
															) }
															iconSize={ 17 }
															style={ {
																outline: 'none',
															} }
														/>
													</a>
												) : (
													<Text
														truncate
														numberOfLines={ 1 }
														style={ {
															maxWidth: '130px',
														} }
														title={
															product.item_name
														}
													>
														{ product.item_name }
													</Text>
												) }
											</HStack>
										)
									) }
								</VStack>
							</div>
						</Popover>
					) }
				</div>
			) }
		</div>
	);
};

export default AssignedShow;
