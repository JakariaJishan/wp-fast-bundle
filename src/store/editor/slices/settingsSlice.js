/**
 * Settings slice: global styles and product assignment.
 *
 * Replaces `EditorProvider`. The API calls that lived in the provider are
 * actions here, so they can be invoked from anywhere without a hook.
 */

import { iniGlobalStyle, iniGlobalStyleThematic } from '@/utils/common-data';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';

/**
 * Assignment types offered in the assign drawer.
 *
 * Read `fbndBackendData` lazily via a getter: this module is evaluated at
 * import time, and the pro flag must reflect the value when the drawer opens.
 */
export const assignType = [
	{ value: 'all_product', label: __( 'All Product', 'fast-bundle' ) },
	{
		value: 'specific_product',
		label: __( 'Specific Product', 'fast-bundle' ),
	},
	{
		value: 'specific_category',
		label: __( 'Specific Category', 'fast-bundle' ),
	},
	{
		value: 'specific_tag',
		label: __( 'Specific Tag', 'fast-bundle' ),
		isPro: true,
		get proDisabled() {
			return ! fbndBackendData.isActive;
		},
	},
];

export const settingsInitialState = {
	optionId: null,
	postData: {},
	assignedData: {},
	selectProductData: {},
	globalStyles: iniGlobalStyle,
	updateProductImageData: {},
	lastSavedAt: null,
};

const mergeByKey = ( key, one, two ) => ( {
	...( one?.[ key ] || {} ),
	...( two?.[ key ] || {} ),
} );

/**
 * @param {Function} set Store setter.
 * @param {Function} get Store getter.
 * @return {Object} Slice state and actions.
 */
export const createSettingsSlice = ( set, get ) => ( {
	...settingsInitialState,

	assignType,

	/**
	 * The id of the option post being edited. Was a prop on `EditorProvider`;
	 * the editor page sets it on mount.
	 *
	 * @param {string|number} optionId Option id, or 'new'.
	 */
	setOptionId: ( optionId ) => set( { optionId } ),

	setPostData: ( postData ) => set( { postData } ),

	/**
	 * Writes one field of the option post (title, status) and marks the post
	 * dirty, which is always what editing one of them means.
	 *
	 * The merge happens inside `set` so successive calls in one tick build on
	 * each other, rather than each starting from the value captured at render.
	 *
	 * @param {string} type  Field name.
	 * @param {*}      value Field value.
	 */
	settingPostData: ( type, value ) =>
		set( ( state ) => ( {
			postData: { ...state.postData, [ type ]: value },
			hasUnsavedChanges: true,
		} ) ),

	/**
	 * Loads the option post being edited: its meta into `postData`, its saved
	 * blocks onto the canvas.
	 *
	 * Seeding the canvas is not a user edit, so the blocks are written with
	 * `history: false` — otherwise opening an add-on would mark it dirty and
	 * push an undo entry nobody made.
	 *
	 * @param {string|number} optionId Option id to load.
	 * @return {Promise} The request.
	 */
	fetchOptionData: ( optionId ) =>
		apiFetch( {
			method: 'POST',
			path: '/fbnd/get_option',
			data: { id: optionId },
		} ).then( ( obj ) => {
			if ( obj.success && obj.post ) {
				set( { postData: obj.post } );

				if (
					obj.post.content &&
					typeof obj.post.content === 'object'
				) {
					get().setBlocks( obj.post.content, { history: false } );
				}
			}
			return obj;
		} ),

	setAssignedData: ( assignedData ) => set( { assignedData } ),

	setSelectProductData: ( selectProductData ) => set( { selectProductData } ),

	setUpdateProductImageData: ( updateProductImageData ) =>
		set( ( state ) => ( {
			updateProductImageData:
				typeof updateProductImageData === 'function'
					? updateProductImageData( state.updateProductImageData )
					: updateProductImageData,
		} ) ),

	setLastSavedAt: ( lastSavedAt ) => set( { lastSavedAt } ),

	/**
	 * Sets the global style state.
	 *
	 * @param {*} globalStyles The new style
	 */
	setGlobalStyles: ( globalStyles ) =>
		set( ( state ) => {
			if ( globalStyles === state.globalStyles ) {
				return state;
			}
			return { globalStyles };
		} ),

	/**
	 * Updates one assignment field. Changing the type resets the selections
	 * beneath it, as the provider did.
	 *
	 * @param {string} type One of aType, includes, excludes, excludeCategories.
	 * @param {*}      data The new value.
	 */
	handleAssignedData: ( type, data ) =>
		set( ( state ) => ( {
			assignedData: {
				...state.assignedData,
				[ type ]: data,
				...( type === 'aType' && {
					includes: [],
					excludes: [],
					excludeCategories: [],
				} ),
			},
		} ) ),

	/**
	 * Persists the product assignment.
	 *
	 * @param {Object} _data      Optional override.
	 * @param {string} _data.id   Option id to force.
	 * @param {string} _data.type Pass 'newforce' with an id to target a new post.
	 * @return {Promise|undefined} The request, or undefined when skipped.
	 */
	setAssignedProducts: ( _data ) => {
		const { id, type } = _data || {};
		const { optionId, assignedData, updateProductImageData } = get();

		if ( optionId === 'new' && ! id ) {
			return undefined;
		}

		const mergedIds = [
			...new Set( Object.values( updateProductImageData ).flat() ),
		];

		return apiFetch( {
			method: 'POST',
			path: '/fbnd/set_assign',
			data: {
				wpnonce: fbndBackendData.nonce,
				option_id: type === 'newforce' && id ? id : optionId,
				product_image: mergedIds,
				raw_data: {
					aType: assignedData.aType || 'specific_product',
					includes:
						assignedData.includes?.map( ( val ) => val.item_id ) ||
						[],
					excludes:
						assignedData.excludes?.map( ( val ) => val.item_id ) ||
						[],
					excludeCategories:
						assignedData.excludeCategories?.map(
							( val ) => val.item_id
						) || [],
				},
			},
		} );
	},

	/**
	 * Loads the saved product assignment for the option being edited.
	 *
	 * The counterpart to `setAssignedProducts`. `optionId` is a parameter here
	 * rather than a `get()` read: the assign drawer fetches from a mount
	 * effect, and child effects run before the parent's, so the id the editor
	 * writes to the store is not there yet at that point.
	 *
	 * An assignment with an empty `aType` was never saved, so it is written
	 * back once to give the option a row to update later.
	 *
	 * @param {string|number} optionId Option id to load.
	 * @return {Promise} The request.
	 */
	fetchAssignedProducts: ( optionId ) =>
		apiFetch( {
			method: 'POST',
			path: '/fbnd/get_assign',
			data: { option_id: optionId },
		} ).then( ( obj ) => {
			if ( obj.success && obj.assigned ) {
				if ( obj.assigned.aType === '' ) {
					get().setAssignedProducts( false );
				}
				set( { assignedData: obj.assigned } );
			}
			return obj;
		} ),

	/**
	 * Persists the global styles.
	 *
	 * @return {Promise} The request.
	 */
	saveGlobalStyles: () => {
		const { globalStyles } = get();

		return apiFetch( {
			method: 'POST',
			path: '/fbnd/set_global',
			data: {
				wpnonce: fbndBackendData.nonce,
				style: globalStyles,
				isThemetic: globalStyles.thematic ? 'yes' : 'no',
			},
		} );
	},

	/**
	 * Loads global styles once per page load. The provider did this in a mount
	 * effect; the editor page calls it instead.
	 *
	 * @return {Promise} The request.
	 */
	fetchGlobalStyles: () =>
		apiFetch( { method: 'GET', path: '/fbnd/get_global' } ).then(
			( obj ) => {
				if ( ! obj.success || ! obj.response ) {
					return;
				}

				const { globalStyles } = get();
				let merged;

				if ( obj.response.thematicStyle ) {
					merged = {
						...iniGlobalStyleThematic,
						...obj.response.thematicStyle,
					};
				} else if ( obj.response.globalStyle ) {
					merged = {
						...globalStyles,
						...( obj.response.globalStyle || {} ),
						common: mergeByKey(
							'common',
							globalStyles,
							obj.response.globalStyle
						),
						field_comp: mergeByKey(
							'field_comp',
							globalStyles,
							obj.response.globalStyle
						),
					};
				} else {
					merged = { ...iniGlobalStyleThematic };
				}

				get().setGlobalStyles( { ...merged } );
			}
		),
} );
