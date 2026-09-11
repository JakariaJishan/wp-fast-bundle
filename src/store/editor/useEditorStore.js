/**
 * The editor store, composed from slices.
 *
 * Import the hook anywhere, no provider needed:
 *
 *     import useEditorStore from '@/store/editor/useEditorStore';
 *
 *     const blocks = useEditorStore( ( state ) => state.blocks );
 *     const addBlock = useEditorStore( ( state ) => state.addBlock );
 *
 * The slices share one store, so a component can select across them in a
 * single subscription. Each slice owns its own keys:
 *
 *   - `slices/blocksSlice`        the block tree, history, dirty flag
 *   - `slices/uiSlice`            selection, drawer, drag state
 *   - `slices/settingsSlice`      global styles, assignment, fonts
 *   - `slices/previewValuesSlice` the builder's mock live-value map
 *
 * Blocks follow the existing editor shape: each block has a `blockid` and may
 * carry nested `innerBlocks`, so updates recurse.
 */

import { combineSlices } from '../combineSlices';
import createStore from '../createStore';
import { blocksInitialState, createBlocksSlice } from './slices/blocksSlice';
import {
	createPreviewValuesSlice,
	previewValuesInitialState,
} from './slices/previewValuesSlice';
import {
	createSettingsSlice,
	settingsInitialState,
} from './slices/settingsSlice';
import { createUiSlice, uiInitialState } from './slices/uiSlice';

/**
 * Shared mutable flags that must never schedule a render.
 *
 * `suppressFocusOpen` tells the drawers to skip their reopen-focus effect;
 * `currentPostCss` accumulates per-block CSS during render. Both were refs on
 * the old providers and stay refs here — putting either in reactive state
 * would re-render the editor on every keystroke.
 */
export const suppressFocusOpen = { current: false };
export const currentPostCss = { current: {} };

const initialState = {
	...blocksInitialState,
	...uiInitialState,
	...settingsInitialState,
	...previewValuesInitialState,
};

const useEditorStore = createStore(
	combineSlices(
		createBlocksSlice,
		createUiSlice,
		createSettingsSlice,
		createPreviewValuesSlice,
		// Actions that span slices live here, after the others are built.
		( set ) => ( {
			/**
			 * Resets state back to how the store was first created.
			 * Actions are kept, since they live on the same object.
			 */
			resetStore: () => set( initialState ),
		} )
	)
);

export default useEditorStore;
