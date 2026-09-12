import { formatPrice } from '../format-price';
import { __ } from '@wordpress/i18n';
import { calculateTotals } from './discount-settings';

const PLACEHOLDER_IMAGE = () =>
	`${ fbndBackendData?.url || '' }assets/img/default-product.svg`;

/**
 * Live preview of the storefront Fixed Bundle widget, built from the
 * builder's current (unsaved) state. Reuses the exact markup and class
 * names `Fixed_Bundle_Cart::render_widget()` renders on the storefront —
 * the admin app also loads that widget's stylesheet — so this is a faithful
 * preview, not an approximation.
 *
 * @param {Object} props
 * @param {string} props.title    Bundle title (falls back to a placeholder).
 * @param {Array}  props.items    Bundle items.
 * @param {Object} props.discount `{ type, value }`.
 * @param {Object} props.display  `{ description, buttonText }`.
 */
const FixedBundlePreview = ( { title, items, discount, display } ) => {
	const totals = calculateTotals( items, discount );
	const hasSaving = totals.savings > 0;

	if ( items.length === 0 ) {
		return (
			<p style={ { color: '#757575', fontSize: 13 } }>
				{ __(
					'Add products to see a preview of the storefront widget.',
					'fast-bundle'
				) }
			</p>
		);
	}

	return (
		<div className="fbnd-fixed-bundle">
			<h3 className="fbnd-fixed-bundle__title">
				{ title || __( 'Fixed Bundle', 'fast-bundle' ) }
			</h3>
			{ display.description && (
				<div
					className="fbnd-fixed-bundle__desc"
					dangerouslySetInnerHTML={ { __html: display.description } }
				/>
			) }

			<ul className="fbnd-fixed-bundle__items">
				{ items.map( ( item ) => (
					<li className="fbnd-fixed-bundle__item" key={ item.product_id }>
						<img
							className="fbnd-fixed-bundle__item-image"
							src={ item.image || PLACEHOLDER_IMAGE() }
							alt={ item.name }
						/>
						<span className="fbnd-fixed-bundle__item-name">
							{ item.name }
							{ item.quantity > 1 && (
								<span className="fbnd-fixed-bundle__item-qty">
									{ ' ' }
									&times;&nbsp;{ item.quantity }
								</span>
							) }
						</span>
					</li>
				) ) }
			</ul>

			<div className="fbnd-fixed-bundle__summary">
				{ hasSaving && (
					<span className="fbnd-fixed-bundle__original">
						{ formatPrice( totals.originalTotal ) }
					</span>
				) }
				<span className="fbnd-fixed-bundle__discounted">
					{ formatPrice( totals.discountedTotal ) }
				</span>
				{ hasSaving && (
					<span className="fbnd-fixed-bundle__savings">
						{ __( 'You save', 'fast-bundle' ) }{ ' ' }
						{ formatPrice( totals.savings ) }
					</span>
				) }
			</div>

			<button type="button" className="fbnd-fixed-bundle__button button alt" disabled>
				{ display.buttonText || __( 'Add Bundle to Cart', 'fast-bundle' ) }
			</button>
		</div>
	);
};

export default FixedBundlePreview;
