/**
 * Toast store.
 *
 * Kept separate from the editor store: toasts fire from the license page, the
 * settings page, the option list and the fonts manager, none of which should
 * have to import the block tree to report an error.
 *
 * Because it is a store rather than component state, anything can raise a
 * toast without being handed a setter first — including store actions and
 * `apiFetch` callbacks:
 *
 *     useToastStore.getState().showError( error.message );
 */

import createStore from '../createStore';

const emptyToast = { state: false, status: '', messages: [] };

const useToastStore = createStore( ( set ) => ( {
	toast: emptyToast,

	/**
	 * Dismisses one message, clearing the toast once the last one goes.
	 *
	 * @param {number} index Message index.
	 */
	dismissMessage: ( index ) =>
		set( ( state ) => {
			const messages = state.toast.messages.filter(
				( message, i ) => i !== index
			);

			return {
				toast: messages.length
					? { ...state.toast, messages }
					: emptyToast,
			};
		} ),

	hideToast: () => set( { toast: emptyToast } ),

	/**
	 * Drop-in replacement for the `setToastMessages` state setter every page
	 * used to declare, so call sites keep passing the object shape they always
	 * did. `state` defaults to true: callers that omit it are raising a toast.
	 *
	 * @param {Object} next `{ status, messages, state }`.
	 */
	setToastMessages: ( next ) =>
		set( {
			toast: {
				...emptyToast,
				...next,
				state: next?.state ?? true,
				messages: next?.messages ?? [],
			},
		} ),
} ) );

export default useToastStore;
