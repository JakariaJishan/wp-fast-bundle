/**
 * Pure helpers for walking and updating the block tree.
 *
 * Each returns the original array when nothing matched, so untouched branches
 * keep their reference and selectors watching them do not fire.
 */

/**
 * Recursively applies an update to the block matching `blockid`, walking into
 * `innerBlocks`. Returns the original array when nothing matched, so untouched
 * branches keep their reference and selectors do not fire.
 *
 * @param {Array}  blocks     Block list.
 * @param {string} blockid    Target block id.
 * @param {Object} updateData Partial block data to merge.
 * @return {Array} Updated block list.
 */
export const applyBlockUpdate = ( blocks, blockid, updateData ) => {
	let changed = false;

	const next = blocks.map( ( block ) => {
		if ( block.blockid === blockid ) {
			changed = true;
			return { ...block, ...updateData };
		}

		if ( Array.isArray( block.innerBlocks ) && block.innerBlocks.length ) {
			const innerBlocks = applyBlockUpdate(
				block.innerBlocks,
				blockid,
				updateData
			);

			if ( innerBlocks !== block.innerBlocks ) {
				changed = true;
				return { ...block, innerBlocks };
			}
		}

		return block;
	} );

	return changed ? next : blocks;
};

/**
 * Finds a block by id anywhere in the tree.
 *
 * @param {Array}  blocks  Block list.
 * @param {string} blockid Target block id.
 * @return {Object|null} The block, or null.
 */
export const findBlock = ( blocks, blockid ) => {
	for ( const block of blocks ) {
		if ( block.blockid === blockid ) {
			return block;
		}
		if ( Array.isArray( block.innerBlocks ) && block.innerBlocks.length ) {
			const found = findBlock( block.innerBlocks, blockid );
			if ( found ) {
				return found;
			}
		}
	}
	return null;
};
