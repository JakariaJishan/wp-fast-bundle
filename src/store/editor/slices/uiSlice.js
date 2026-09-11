/**
 * UI slice: selection, drawer, drag state and transient editor data.
 */

export const uiInitialState = {
	activeBlockId: '',
	drawer: { open: false, compo: '' },
	draggData: {},
	additionalData: {},
};

/**
 * @param {Function} set Store setter.
 * @return {Object} Slice state and actions.
 */
export const createUiSlice = ( set ) => ( {
	...uiInitialState,

	/**
	 * Selects a block and opens the settings drawer for it. Passing an empty
	 * id clears the selection and closes the drawer.
	 *
	 * @param {string} id Block id, or '' to clear.
	 */
	setActiveBlockId: ( id ) =>
		set( {
			activeBlockId: id,
			drawer: id
				? { open: true, compo: 'blockSettingsDrawer' }
				: { open: false, compo: '' },
		} ),

	/**
	 * Replaces the drawer state outright, unlike `updateDrawer` which merges.
	 * Missing keys fall back to closed, so `setDrawer( {} )` closes the drawer
	 * rather than doing nothing.
	 *
	 * @param {Object} next Next drawer state.
	 */
	setDrawer: ( next = {} ) =>
		set( { drawer: { open: false, compo: '', ...next } } ),

	/**
	 * Merges into the drawer state.
	 *
	 * @param {Object|Function} newData Partial state, or `( prev ) => partial`.
	 */
	updateDrawer: ( newData ) =>
		set( ( state ) => ( {
			drawer: {
				...state.drawer,
				...( typeof newData === 'function'
					? newData( state.drawer )
					: newData ),
			},
		} ) ),

	/**
	 * Merges drag state. Mirrors the old context helper, which always shallow
	 * merged rather than replacing.
	 *
	 * @param {Object} newData Partial drag state.
	 */
	updateDraggData: ( newData ) =>
		set( ( state ) => ( {
			draggData: { ...state.draggData, ...newData },
		} ) ),

	/**
	 * Merges into `additionalData`, like `updateDraggData` above. Every caller
	 * patches a key or two and keeps the rest, so the merge happens here rather
	 * than each caller spreading the previous value back in.
	 *
	 * @param {Object} newData Partial additional data.
	 */
	updateAdditionalData: ( newData ) =>
		set( ( state ) => ( {
			additionalData: { ...state.additionalData, ...newData },
		} ) ),
} );
