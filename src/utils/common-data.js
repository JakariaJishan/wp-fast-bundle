/**
 * Default global style values for the builder.
 *
 * Trimmed down from the original field-component style tokens: only the
 * generic typography tokens survive here, since the concrete field/block
 * types they used to style were removed along with the builder's block
 * library. Extend `common` (or add a new top-level group) as Fast Bundle's
 * own bundle-block types are introduced.
 */
const iniGlobalStyle = {
	appliedStyle: 'style',
	common: {
		heading: {
			open: false,
			typo: {
				_size: { val: 18, unit: 'px' },
				_height: { val: 24, unit: 'px' },
				_space: { val: 1.2, unit: 'px' },
				_weight: '500',
				_style: 'normal',
				_decoration: 'none',
			},
			color: '#0B0E04',
		},
		title: {
			open: false,
			typo: {
				_size: { val: 16, unit: 'px' },
				_height: { val: 24, unit: 'px' },
				_space: { val: 0, unit: 'px' },
				_weight: '500',
				_style: 'normal',
				_decoration: 'none',
			},
			color: '#0B0E04',
		},
		description: {
			open: false,
			typo: {
				_size: { val: 14, unit: 'px' },
				_height: { val: 18, unit: 'px' },
				_space: { val: 0, unit: 'px' },
				_weight: '500',
				_style: 'normal',
				_decoration: 'none',
			},
			color: '#4e5049',
		},
		price: {
			open: false,
			typo: {
				_size: { val: 14, unit: 'px' },
				_height: { val: 20, unit: 'px' },
				_space: { val: 0, unit: 'px' },
				_weight: '400',
				_style: 'normal',
				_decoration: 'none',
			},
			color: '#575E55',
		},
	},
	field_comp: {},
};

const iniGlobalStyleThematic = {
	thematic: true,
	presets: {
		palette: 'classic',
		custom: {},
		changed: false,
	},
	typography: {
		size: 'md',
		shape: 'sharp',
	},
};

export { iniGlobalStyle, iniGlobalStyleThematic };
