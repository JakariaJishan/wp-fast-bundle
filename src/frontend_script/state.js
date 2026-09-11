import $ from 'jquery';

const fbndFrontendState = {
	// Initialize data
	basePrice: 0,
	basePricePercentage: 0,
	optionPriceObj: {},
	addAbleProductsObj: {},
	allFieldCondition: {},
	requiredFields: [],
	minMaxWarnings: {},
	formulaDynamicValues: {},
	productAttributes: {},
	advFormulaValues: {},
	advFormulaProductValues: {},
	advFormulaFieldValues: {},

	// State update methods
	/**
	 * Update the base product price
	 *
	 * @function updateBasePrice
	 * @param {number} price - The base price to set
	 */
	updateBasePrice( price ) {
		this.basePrice = price;
	},

	/**
	 * Update the base price percentage for percentage-based calculations
	 *
	 * @function updateBasePricePercentage
	 * @param {number} percentage - The base price percentage to set
	 */
	updateBasePricePercentage( percentage ) {
		this.basePricePercentage = percentage;
	},

	/**
	 * Update price data for a specific option
	 *
	 * @function updateOptionPriceObj
	 * @param {string} optionId - The option identifier
	 * @param {string} price    - The price data object
	 */
	updateOptionPriceObj( optionId, price ) {
		this.optionPriceObj[ optionId ] = price;
	},

	/**
	 * Get a copy of the entire option price object
	 *
	 * @function getOptionPriceObj
	 * @return {Object} Copy of the option price object
	 */
	getOptionPriceObj() {
		return { ...this.optionPriceObj };
	},

	/**
	 * Get price data for a specific option
	 *
	 * @function getOptionPriceObjValue
	 * @param {string} optionId - The option identifier
	 * @return {any} The price data or undefined if not found
	 */
	getOptionPriceObjValue( optionId ) {
		return this.optionPriceObj[ optionId ];
	},

	/**
	 * Remove price data for a specific option
	 *
	 * @function deleteOptionPriceObj
	 * @param {string} optionId - The option identifier to remove
	 */
	deleteOptionPriceObj( optionId ) {
		delete this.optionPriceObj[ optionId ];
	},

	/**
	 * Replace the entire option price object
	 *
	 * @function replaceOptionPriceObject
	 * @param {Object} updatedObj - The new option price object
	 */
	replaceOptionPriceObject( updatedObj ) {
		this.optionPriceObj = updatedObj;
	},

	/**
	 * Update addable product data
	 *
	 * @function updateAddAbleProduct
	 * @param {string} productId - The product identifier
	 * @param {*}      data      - The product data
	 */
	updateAddAbleProduct( productId, data ) {
		this.addAbleProductsObj[ productId ] = data;
	},

	/**
	 * Update field condition data
	 *
	 * @function updateFieldCondition
	 * @param {string} fieldId   - The field identifier
	 * @param {Object} condition - The field condition data
	 */
	updateFieldCondition( fieldId, condition ) {
		this.allFieldCondition[ fieldId ] = condition;
	},

	/**
	 * Add a field to the required fields list
	 *
	 * @function addRequiredField
	 * @param {string} fieldId - The field identifier to add
	 */
	addRequiredField( fieldId ) {
		if ( ! this.requiredFields.includes( fieldId ) ) {
			this.requiredFields.push( fieldId );
		}
	},

	/**
	 * Remove a field from the required fields list
	 *
	 * @function removeRequiredField
	 * @param {string} fieldId - The field identifier to remove
	 */
	removeRequiredField( fieldId ) {
		const index = this.requiredFields.indexOf( fieldId );
		if ( index > -1 ) {
			this.requiredFields.splice( index, 1 );
		}
	},

	/**
	 * Update min/max warning settings for a field
	 *
	 * @function updateMinMaxWarning
	 * @param {string} fieldId - The field identifier
	 * @param {Object} warning - The warning configuration
	 */
	updateMinMaxWarning( fieldId, warning ) {
		this.minMaxWarnings[ fieldId ] = warning;
	},

	/**
	 * Clear min/max warning for a field
	 *
	 * @function clearMinMaxWarning
	 * @param {string} fieldId - The field identifier
	 */
	clearMinMaxWarning( fieldId ) {
		delete this.minMaxWarnings[ fieldId ];
	},

	/**
	 * Update formula dynamic value
	 *
	 * @function updateFormulaDynamicValue
	 * @param {string} formulaId - The formula identifier
	 * @param {number} value     - The numeric value
	 */
	updateFormulaDynamicValue( formulaId, value ) {
		this.formulaDynamicValues[ formulaId ] = value;
	},

	/**
	 * Delete formula dynamic value
	 *
	 * @function deleteFormulaValue
	 * @param {string} formulaId - The formula identifier
	 */
	deleteFormulaValue( formulaId ) {
		delete this.formulaDynamicValues[ formulaId ];
	},

	// State getter methods
	/**
	 * Get the current base price
	 *
	 * @function getBasePrice
	 * @return {number} The current base price
	 */
	getBasePrice() {
		return this.basePrice;
	},

	/**
	 * Get the current base price percentage
	 *
	 * @function getBasePricePercentage
	 * @return {number} The current base price percentage
	 */
	getBasePricePercentage() {
		return this.basePricePercentage;
	},

	/**
	 * Get price for a specific option
	 *
	 * @function getOptionPrice
	 * @param {string} optionId - The option identifier
	 * @return {number} The option price or 0 if not found
	 */
	getOptionPrice( optionId ) {
		return this.optionPriceObj[ optionId ] || 0;
	},

	/**
	 * Get addable product data
	 *
	 * @function getAddAbleProduct
	 * @param {string} productId - The product identifier
	 * @return {*} The product data
	 */
	getAddAbleProduct( productId ) {
		return this.addAbleProductsObj[ productId ];
	},

	/**
	 * Get copy of required fields array
	 *
	 * @function getRequiredFields
	 * @return {string[]} Array of required field identifiers
	 */
	getRequiredFields() {
		return [ ...this.requiredFields ];
	},

	/**
	 * Get min/max warning configuration for a field
	 *
	 * @function getMinMaxWarning
	 * @param {string} fieldId - The field identifier
	 * @return {Object|undefined} The warning configuration
	 */
	getMinMaxWarning( fieldId ) {
		return this.minMaxWarnings[ fieldId ];
	},

	getFormulaDynamicValue( formulaId ) {
		return this.formulaDynamicValues[ formulaId ];
	},

	updateProductAttributes( key, value ) {
		this.productAttributes[ key ] = value;
	},

	updateAdvFormulaDynamicItem( advKey, value ) {
		this.advFormulaValues[ advKey ] = value;
	},

	updateAdvFormulaProductValues( advKey, value ) {
		this.advFormulaProductValues[ advKey ] = value;
	},
	updateAdvFormulaFieldValues( advKey, value ) {
		this.advFormulaFieldValues[ advKey ] = value;
	},
	getAdvFormulaFieldValuesObject() {
		return this.advFormulaFieldValues;
	},

	getAllAdvFormulaDynamicItems( { blockRepeaterId } ) {
		const fieldValues = this.getMappedValue(
			this.advFormulaFieldValues || {},
			blockRepeaterId
		);

		const productValues = this.advFormulaProductValues;
		const result = {
			...( productValues || {} ),
			...Object.values( fieldValues || {} ).reduce( function (
				acc,
				obj
			) {
				if ( obj && typeof obj === 'object' ) {
					Object.assign( acc, obj );
				}
				return acc;
			}, {} ),
		};
		return result;
	},

	removeAdvFormulaFieldValues( advKey ) {
		delete this.advFormulaFieldValues[ advKey ];
	},
	removeAdvFormulaRepeaterFieldValues( blockRepeaterId, advKey ) {
		delete this.advFormulaFieldValues?.[ blockRepeaterId ]?.[ advKey ];
	},

	getMappedValue( obj, blockRepeaterId ) {
		const revampedObj = this.getRevampedFormulaObj( obj, blockRepeaterId );
		const blockRepeaterIdSelector = blockRepeaterId
			? `.fbnd-repeater-instance[data-repeater-id="${ blockRepeaterId }"] `
			: '';

		return Object.keys( revampedObj ).reduce( ( result, groupKey ) => {
			let passed = true;
			const currentBlock = $(
				`${ blockRepeaterIdSelector }.fbnd-parent[data-bid="${ groupKey }"]`
			);
			const underHiddenSection = currentBlock.closest(
				'.fbnd-parent.fbnd-section-block.fbnd-field-none'
			);

			if (
				underHiddenSection.length ||
				currentBlock.hasClass( 'fbnd-field-none' )
			) {
				passed = false;
				if ( blockRepeaterId ) {
					this.removeAdvFormulaRepeaterFieldValues(
						blockRepeaterId,
						groupKey
					);
				} else {
					this.removeAdvFormulaFieldValues( groupKey );
				}
			}

			if ( passed ) {
				result[ groupKey ] = revampedObj[ groupKey ];
			}

			return result;
		}, {} );
	},

	getRevampedFormulaObj( obj, blockRepeaterId ) {
		const isRepeaterKey = ( key ) => /-repeater-\d+$/.test( key );

		return Object.keys( obj ).reduce( ( result, key ) => {
			if ( isRepeaterKey( key ) ) {
				if ( blockRepeaterId && key === blockRepeaterId ) {
					Object.assign( result, obj[ key ] );
				}
			} else {
				result[ key ] = obj[ key ];
			}
			return result;
		}, {} );
	},
};

export default fbndFrontendState;
