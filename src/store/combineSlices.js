/**
 * Slice helpers.
 *
 * A slice is just a function `( set, get ) => ({ ...state, ...actions })`.
 * `combineSlices` merges several of them into the single initialiser that
 * `createStore` expects, which is how Zustand composes slices:
 *
 *     const useStore = createStore(
 *         combineSlices( createBlocksSlice, createUiSlice )
 *     );
 *
 * Every slice receives the same `set`/`get`, so one slice can read or write
 * another's state when it genuinely needs to. Keep that rare: the point of
 * slicing is that each file owns its own keys.
 *
 * @param {...Function} slices Slice initialisers.
 * @return {Function} A single initialiser.
 */
export const combineSlices =
	( ...slices ) =>
	( set, get, api ) =>
		slices.reduce(
			( acc, slice ) => Object.assign( acc, slice( set, get, api ) ),
			{}
		);
