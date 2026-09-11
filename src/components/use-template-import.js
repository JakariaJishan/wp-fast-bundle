import { useCallback } from '@wordpress/element';

/**
 * Shared logic to navigate to the builder for a new option.
 */
export const useTemplateImport = () => {
	const goToNew = useCallback( () => {
		window.location.href = fbndBackendData.db_url + 'lists/new';
	}, [] );

	return { goToNew };
};

export default useTemplateImport;
