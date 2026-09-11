import { Fragment } from '@wordpress/element';

/**
 * A loading placeholder block. Pairs with the `.fbnd-loading-skeleton` /
 * `.fbnd-skeleton-container` animation defined in
 * `scss/backend/utility/skeleton.scss`.
 */
const Skeleton = ( props ) => {
	const {
		count = 1,
		wrapper: Wrapper,
		containerStyles = { width: '100%' },
		className: customClassName,
		containerClassName = '',
		circle = false,
		style: styleProp,
		isTableRow = false,
		container: Container = 'span',
		width,
		height,
		borderRadius,
		inline = false,
	} = props;

	const style = {
		...styleProp,
		...( width !== undefined && { width } ),
		...( height !== undefined && { height } ),
		...( circle
			? { borderRadius: '50%' }
			: borderRadius !== undefined && { borderRadius } ),
	};

	let className = 'fbnd-loading-skeleton';
	if ( customClassName ) {
		className += ` ${ customClassName }`;
	}

	const elements = [];
	for ( let i = 0; i < Math.ceil( count ); i++ ) {
		const skeletonSpan = (
			<span className={ className } style={ style } key={ i }>
				&zwnj;
			</span>
		);
		elements.push(
			inline ? (
				skeletonSpan
			) : (
				<Fragment key={ i }>
					{ skeletonSpan }
					{ ! isTableRow && <br /> }
				</Fragment>
			)
		);
	}

	return (
		<Container
			className={ `${ containerClassName } fbnd-skeleton-container` }
			aria-live="polite"
			aria-busy="true"
			style={ containerStyles }
		>
			{ Wrapper
				? elements.map( ( el, i ) => <Wrapper key={ i }>{ el }</Wrapper> )
				: elements }
		</Container>
	);
};

export default Skeleton;
