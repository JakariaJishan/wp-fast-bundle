/**
 * Generates a unique block id using the current timestamp and a random string.
 *
 * @return {string} New block id.
 */
const generateBlockId = () => {
	const dateString = Date.now().toString( 36 );
	return (
		dateString.slice( 0, 1 ) +
		dateString.slice( -3 ) +
		'-' +
		Math.random().toString( 36 ).substring( 2, 8 )
	);
};

/**
 * Regenerates block ids across a tree of blocks, e.g. when duplicating an
 * option set. Every `blockid` reference elsewhere in the tree is rewritten
 * to the new id so cross-references (like `sectionid`) stay consistent.
 *
 * @param {Array}   allBlocks Blocks to process.
 * @param {boolean} changeIds When true, assigns fresh ids; otherwise returns
 *                            the blocks unchanged aside from a shallow copy.
 * @return {Array} The processed blocks.
 */
const updateOptionBlockIds = ( allBlocks, changeIds = false ) => {
	let changes = {};

	function handleDuplication( blocks, parentBlockId = null ) {
		return blocks.map( ( block ) => {
			const newBlock = { ...block };
			const newBlockId = generateBlockId();
			changes = { ...changes, [ block.blockid ]: newBlockId };
			newBlock.blockid = newBlockId;

			if ( Array.isArray( newBlock.innerBlocks ) ) {
				newBlock.innerBlocks = handleDuplication(
					newBlock.innerBlocks,
					newBlockId
				);
			}

			if ( parentBlockId && newBlock.sectionid ) {
				newBlock.sectionid = parentBlockId;
			}

			return newBlock;
		} );
	}

	if ( ! changeIds ) {
		return handleDuplication( allBlocks );
	}

	const updated = handleDuplication( allBlocks );
	let jsonString = JSON.stringify( updated );
	for ( const oldKey in changes ) {
		jsonString = jsonString.replace(
			new RegExp( oldKey, 'g' ),
			changes[ oldKey ]
		);
	}
	return JSON.parse( jsonString );
};

export { generateBlockId, updateOptionBlockIds };
