/**
 * Shared selectors and convenience hooks for the editor store.
 *
 * Settings components should use these rather than writing inline selectors,
 * so every consumer subscribes to the same slice on the same terms.
 */

import useEditorStore from './useEditorStore';

// One frozen instance, so "no selection" is referentially stable and does not
// cause a re-render each time the selector runs.
const EMPTY = Object.freeze( {} );

/**
 * The block currently open in the settings drawer.
 *
 * Returns the block object itself, so the subscription is scoped to that one
 * block: editing a different block does not re-render this consumer, and the
 * `blocks` array changing shape elsewhere does not either, because
 * `applyBlockUpdate` keeps untouched branches referentially stable.
 *
 * @return {Object} The active block, or an empty object when none is selected.
 */
export const useActiveBlock = () =>
	useEditorStore( ( state ) =>
		state.activeBlockId ? state.getActiveBlock() || EMPTY : EMPTY
	);

/**
 * The writer for the active block. Stable for the store's lifetime, so
 * selecting it never triggers a re-render.
 *
 * @return {Function} `( key, value ) => void` or `( object ) => void`.
 */
export const useSetBlockAttr = () =>
	useEditorStore( ( state ) => state.setBlockAttr );

export const useUpdateDrawer = () =>
	useEditorStore( ( state ) => state.updateDrawer );
