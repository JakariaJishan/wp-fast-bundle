import { formatPrice } from '../format-price';
import { __ } from '@wordpress/i18n';
import { calculateRewardTotals } from './reward-discount';

const PLACEHOLDER_IMAGE = () =>
	`${ fbndBackendData?.url || '' }assets/img/default-product.svg`;

const ItemRow = ( { item, priceNode } ) => (
	<li className="fbnd-bxgy__item">
		<img
			className="fbnd-bxgy__item-image"
			src={ item.image || PLACEHOLDER_IMAGE() }
			alt={ item.name }
		/>
		<span className="fbnd-bxgy__item-name">
			{ item.name }
			{ item.quantity > 1 && (
				<span className="fbnd-bxgy__item-qty"> &times;&nbsp;{ item.quantity }</span>
			) }
		</span>
		{ priceNode && <span className="fbnd-bxgy__item-price">{ priceNode }</span> }
	</li>
);

/**
 * Live preview of the storefront Buy X Get Y widget, built from the
 * builder's current (unsaved) state. Reuses the exact markup and class
 * names `Buy_X_Get_Y_Cart::render_widget()` renders on the storefront —
 * the admin app also loads that widget's stylesheet — so this is a faithful
 * preview, not an approximation.
 *
 * @param {Object} props
 * @param {string} props.title          Deal title (falls back to a placeholder).
 * @param {Array}  props.triggers       Trigger ("buy") items.
 * @param {Array}  props.rewards        Reward ("get") items.
 * @param {Object} props.rewardDiscount `{ type, value }`.
 * @param {Object} props.display        `{ description, buttonText }`.
 */
const BuyXGetYPreview = ( { title, triggers, rewards, rewardDiscount, display } ) => {
	if ( triggers.length === 0 && rewards.length === 0 ) {
		return (
			<p style={ { color: '#757575', fontSize: 13 } }>
				{ __(
					'Add trigger and reward products to see a preview of the storefront widget.',
					'fast-bundle'
				) }
			</p>
		);
	}

	const { rewardTotal, savings } = calculateRewardTotals( rewards, rewardDiscount );
	const triggerTotal = triggers.reduce(
		( sum, item ) => sum + ( parseFloat( item.price ) || 0 ) * item.quantity,
		0
	);
	const total = triggerTotal + rewardTotal;
	const hasSaving = savings > 0;

	const rewardUnitPrice = ( item ) => {
		const price = parseFloat( item.price ) || 0;
		const value = parseFloat( rewardDiscount.value ) || 0;
		if ( rewardDiscount.type === 'free' ) {
			return 0;
		}
		if ( rewardDiscount.type === 'fixed_price' ) {
			return Math.max( 0, value );
		}
		return Math.max( 0, price * ( 1 - value / 100 ) );
	};

	return (
		<div className="fbnd-bxgy">
			<h3 className="fbnd-bxgy__title">
				{ title || __( 'Buy X Get Y', 'fast-bundle' ) }
			</h3>
			{ display.description && (
				<div
					className="fbnd-bxgy__desc"
					dangerouslySetInnerHTML={ { __html: display.description } }
				/>
			) }

			{ triggers.length > 0 && (
				<div className="fbnd-bxgy__group">
					<span className="fbnd-bxgy__group-label">
						{ __( 'Buy', 'fast-bundle' ) }
					</span>
					<ul className="fbnd-bxgy__items">
						{ triggers.map( ( item ) => (
							<ItemRow key={ item.product_id } item={ item } />
						) ) }
					</ul>
				</div>
			) }

			{ rewards.length > 0 && (
				<div className="fbnd-bxgy__group">
					<span className="fbnd-bxgy__group-label">
						{ __( 'Get', 'fast-bundle' ) }
					</span>
					<ul className="fbnd-bxgy__items">
						{ rewards.map( ( item ) => {
							const unitPrice = rewardUnitPrice( item );
							const price = parseFloat( item.price ) || 0;
							return (
								<ItemRow
									key={ item.product_id }
									item={ item }
									priceNode={
										<>
											{ unitPrice < price && (
												<span className="fbnd-bxgy__item-price-original">
													{ formatPrice( price ) }
												</span>
											) }
											{ 0 === unitPrice ? (
												<span className="fbnd-bxgy__item-price-free">
													{ __( 'FREE', 'fast-bundle' ) }
												</span>
											) : (
												formatPrice( unitPrice )
											) }
										</>
									}
								/>
							);
						} ) }
					</ul>
				</div>
			) }

			<div className="fbnd-bxgy__summary">
				<span className="fbnd-bxgy__total">{ formatPrice( total ) }</span>
				{ hasSaving && (
					<span className="fbnd-bxgy__savings">
						{ __( 'You save', 'fast-bundle' ) } { formatPrice( savings ) }
					</span>
				) }
			</div>

			<button type="button" className="fbnd-bxgy__button button alt" disabled>
				{ display.buttonText || __( 'Add Deal to Cart', 'fast-bundle' ) }
			</button>
		</div>
	);
};

export default BuyXGetYPreview;
