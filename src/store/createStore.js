/**
 * A tiny Zustand-like store for the FastBundle editor.
 *
 * No providers, no context, no reducers. Create a store once at module scope
 * and import the returned hook anywhere:
 *
 *     const useEditorStore = createStore( ( set, get ) => ( {
 *         blocks: [],
 *         addBlock: ( block ) =>
 *             set( ( state ) => ( { blocks: [ ...state.blocks, block ] } ) ),
 *     } ) );
 *
 *     const blocks = useEditorStore( ( state ) => state.blocks );
 *
 * Outside React (event handlers, apiFetch callbacks, the frontend script):
 *
 *     useEditorStore.getState().addBlock( block );
 */

import { useRef, useSyncExternalStore } from '@wordpress/element';

/**
 * Default equality check used to decide whether a selected slice changed.
 * Reference equality, matching Zustand's default.
 *
 * @param {*} a Previous slice.
 * @param {*} b Next slice.
 * @return {boolean} True when the slice is considered unchanged.
 */
const referenceEqual = ( a, b ) => Object.is( a, b );

/**
 * Creates the vanilla (framework free) store. Useful on its own for the
 * frontend script, and used internally by `createStore`.
 *
 * @param {Function} createState `( set, get, api ) => stateAndActions`
 * @return {Object} `{ getState, getInitialState, setState, subscribe, destroy }`
 */
export const createStoreVanilla = ( createState ) => {
	let state;
	const listeners = new Set();

	/**
	 * Merges a partial update into state (shallow, like Zustand).
	 *
	 * @param {Object|Function} partial Partial state, or `( state ) => partial`.
	 * @param {boolean}         replace Replace state entirely instead of merging.
	 */
	const setState = ( partial, replace = false ) => {
		const nextPartial =
			typeof partial === 'function' ? partial( state ) : partial;

		if ( Object.is( nextPartial, state ) || nextPartial === undefined ) {
			return;
		}

		const prevState = state;
		state = replace ? nextPartial : Object.assign( {}, state, nextPartial );

		if ( Object.is( prevState, state ) ) {
			return;
		}

		listeners.forEach( ( listener ) => listener( state, prevState ) );
	};

	const getState = () => state;

	/**
	 * Subscribes to every state change.
	 *
	 * @param {Function} listener `( state, prevState ) => void`
	 * @return {Function} Unsubscribe.
	 */
	const subscribe = ( listener ) => {
		listeners.add( listener );
		return () => listeners.delete( listener );
	};

	const destroy = () => listeners.clear();

	const api = { setState, getState, subscribe, destroy };

	state = createState( setState, getState, api );

	// Snapshot of the store as first created, so `resetStore` can restore it.
	const initialState = state;
	api.getInitialState = () => initialState;

	return api;
};

/**
 * Creates a React hook bound to a new store.
 *
 * The hook can be called three ways:
 *
 *     useStore()                          // whole state, re-renders on any change
 *     useStore( ( s ) => s.blocks )       // only re-renders when `blocks` changes
 *     useStore( selector, shallow )       // custom equality for derived objects
 *
 * The returned hook also carries the vanilla API as static properties:
 * `getState`, `setState`, `subscribe`, `destroy`, `getInitialState`.
 *
 * @param {Function} createState `( set, get, api ) => stateAndActions`
 * @return {Function} The `useStore` hook.
 */
const createStore = ( createState ) => {
	const api = createStoreVanilla( createState );

	const useStore = ( selector, isEqual = referenceEqual ) => {
		const select = selector || ( ( s ) => s );

		return useSyncExternalStoreWithSelector(
			api.subscribe,
			api.getState,
			select,
			isEqual
		);
	};

	Object.assign( useStore, api );

	return useStore;
};

/**
 * `useSyncExternalStore` only compares the *snapshot* by reference, so it
 * cannot express "re-render only when this slice changed". This wrapper keeps
 * the last selected slice in a ref and returns the cached one whenever the new
 * selection is equal, so the snapshot reference stays stable and React bails
 * out of the re-render.
 *
 * Equivalent to the `use-sync-external-store/with-selector` shim, inlined so we
 * do not add an import that is not already part of the build.
 *
 * @param {Function} subscribe   Store subscribe.
 * @param {Function} getSnapshot Store getState.
 * @param {Function} selector    Slice selector.
 * @param {Function} isEqual     Equality check for the slice.
 * @return {*} The selected slice.
 */
const useSyncExternalStoreWithSelector = (
	subscribe,
	getSnapshot,
	selector,
	isEqual
) => {
	// Cache lives outside React state on purpose: mutating it must never
	// schedule a render, it only keeps the returned reference stable.
	const cache = useConstant( () => ( {
		hasValue: false,
		value: undefined,
	} ) );

	const getSelection = () => {
		const nextValue = selector( getSnapshot() );

		if ( cache.hasValue && isEqual( cache.value, nextValue ) ) {
			return cache.value;
		}

		cache.hasValue = true;
		cache.value = nextValue;
		return nextValue;
	};

	return useSyncExternalStore( subscribe, getSelection, getSelection );
};

/**
 * `useRef` with lazy init, without pulling another import into every consumer.
 *
 * @param {Function} init Factory called once per component instance.
 * @return {*} The stable value.
 */
const useConstant = ( init ) => {
	const ref = useRef();
	if ( ref.current === undefined ) {
		ref.current = init();
	}
	return ref.current;
};

export default createStore;
