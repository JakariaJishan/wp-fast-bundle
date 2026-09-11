/**
 * Blocks slice: the block tree and everything that writes to it.
 *
 * Owns `blocks`,`hasUnsavedChanges` and `editHistory`.
 */

import { applyBlockUpdate, findBlock } from '../blockTree';

export const blocksInitialState = {
	blocks: [],
	hasUnsavedChanges: false,
	editHistory: { undoStack: [], redoStack: [] },
};

/**
 * Pushes the current tree onto the undo stack and clears redo.
 *
 * @param {Object} state Current state.
 * @return {Object} The next `editHistory`.
 */
const pushHistory = ( state ) => ( {
	undoStack: [ ...state.editHistory.undoStack, state.blocks ],
	redoStack: [],
} );

/**
 * @param {Function} set Store setter.
 * @param {Function} get Store getter.
 * @return {Object} Slice state and actions.
 */
export const createBlocksSlice = ( set, get ) => ( {
	...blocksInitialState,

	/**
	 * Replaces the whole block tree. Stands in for the old `updateFieldData`.
	 *
	 * `history` separates a user edit from seeding the editor. Pass
	 * `{ history: false }` when filling the canvas from the API or a template:
	 * that write is not something the user did, so it must not mark the post
	 * dirty or push an undo entry the user never made.
	 *
	 * @param {Array}   blocks          Next blocks.
	 * @param {Object}  options         Options.
	 * @param {boolean} options.history Record history and mark dirty.
	 */
	setBlocks: ( blocks, { history = true } = {} ) =>
		set( ( state ) => {
			if ( blocks === state.blocks ) {
				return state;
			}

			return history
				? {
						blocks,
						hasUnsavedChanges: true,
						editHistory: pushHistory( state ),
				  }
				: { blocks };
		} ),

	updateBlock: ( id, newData ) =>
		set( ( state ) => {
			const blocks = applyBlockUpdate( state.blocks, id, newData );

			if ( blocks === state.blocks ) {
				return state;
			}

			return { blocks, hasUnsavedChanges: true };
		} ),

	/**
	 * Writes one or more attributes onto the currently selected block.
	 *
	 * Replaces the old `toolbarSetData` prop that was drilled through the
	 * settings drawer. Both call shapes of the old helper work:
	 *
	 *     setBlockAttr( 'label', 'Size' );
	 *     setBlockAttr( { label: 'Size', required: true } );
	 *
	 * Section blocks need no special case: the update recurses into
	 * `innerBlocks`, so nesting is handled at any depth.
	 *
	 * @param {string|Object} key   Attribute name, or an object to merge.
	 * @param {*}             value Value, when `key` is a string.
	 */
	setBlockAttr: ( key, value ) =>
		set( ( state ) => {
			if ( ! state.activeBlockId ) {
				return state;
			}

			const updateData =
				typeof key === 'object' && key !== null
					? key
					: { [ key ]: value };

			const blocks = applyBlockUpdate(
				state.blocks,
				state.activeBlockId,
				updateData
			);

			if ( blocks === state.blocks ) {
				return state;
			}

			return {
				blocks,
				hasUnsavedChanges: true,
				editHistory: pushHistory( state ),
			};
		} ),

	/**
	 * Reads a block without subscribing. For actions and callbacks, never in
	 * render.
	 *
	 * @param {string} blockid Block id.
	 * @return {Object|null} The block, or null.
	 */
	getBlock: ( blockid ) => findBlock( get().blocks, blockid ),

	/**
	 * Reads the selected block without subscribing.
	 *
	 * @return {Object|null} The active block, or null.
	 */
	getActiveBlock: () => {
		const { blocks, activeBlockId } = get();
		return activeBlockId ? findBlock( blocks, activeBlockId ) : null;
	},

	setHasUnsavedChanges: ( value ) => set( { hasUnsavedChanges: value } ),

	/**
	 * Replaces the undo/redo stacks.
	 *
	 * @param {Object} editHistory Next `{ undoStack, redoStack }`.
	 */
	setEditHistory: ( editHistory ) => set( { editHistory } ),
} );
