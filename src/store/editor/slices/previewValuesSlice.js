/**
 * Preview values slice: the builder's mock live-value map.
 *
 * The block list renders real, interactive form controls so a merchant can
 * see the field the way a shopper will — but nothing publishes what got
 * clicked anywhere outside that one field's own local `useState`. This slice
 * holds that mock live-value map for the canvas preview to read.
 *
 * Deliberately NOT part of `blocksSlice`: these are ephemeral preview
 * selections, not saved option data, so they must never mark the post dirty,
 * push an undo entry, or be sent to `/fbnd/set_option`.
 */

export const previewValuesInitialState = {
	previewValues: {},
};

/**
 * @param {Function} set Store setter.
 * @return {Object} Slice state and actions.
 */
export const createPreviewValuesSlice = ( set ) => ( {
	...previewValuesInitialState,

	/**
	 * Sets (or clears) the mock preview value for one field.
	 *
	 * Mirrors the shape `values.js`/`buildValueMap` produces on the storefront:
	 * selection-type fields store an array of selected indexes/uids, text-like
	 * fields store the typed string.
	 *
	 * @param {string} blockId Field's block id.
	 * @param {*}      value   New value, or undefined/[] to clear.
	 */
	setPreviewValue: ( blockId, value ) =>
		set( ( state ) => {
			if ( state.previewValues[ blockId ] === value ) {
				return state;
			}
			return {
				previewValues: {
					...state.previewValues,
					[ blockId ]: value,
				},
			};
		} ),

	/**
	 * Drops a field's preview value entirely (used when a field is removed).
	 *
	 * @param {string} blockId Field's block id.
	 */
	clearPreviewValue: ( blockId ) =>
		set( ( state ) => {
			if ( ! ( blockId in state.previewValues ) ) {
				return state;
			}
			const previewValues = { ...state.previewValues };
			delete previewValues[ blockId ];
			return { previewValues };
		} ),
} );
