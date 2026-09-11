// @ts-nocheck

const path = require( 'path' );
const webpack = require( 'webpack' );
const MiniCssExtractPlugin = require( 'mini-css-extract-plugin' );

let defaultConfig = require( '@wordpress/scripts/config/webpack.config' );
const RtlCssPlugin = require( '@wordpress/scripts/plugins/rtlcss-webpack-plugin' );

const jsOutputPath = path.resolve( __dirname, 'assets/js' );
const cssOutputPath = path.resolve( __dirname, 'assets/css' );
const cssOutputRelativeToJs =
	path
		.relative( jsOutputPath, cssOutputPath )
		.split( path.sep )
		.join( '/' ) || '.';

class MoveRtlCssToCssFolderPlugin {
	constructor( { destination = '../css' } = {} ) {
		this.destination = destination;
	}

	apply( compiler ) {
		compiler.hooks.thisCompilation.tap(
			'MoveRtlCssToCssFolderPlugin',
			( compilation ) => {
				// Run after RtlCssPlugin (which uses PROCESS_ASSETS_STAGE_OPTIMIZE)
				compilation.hooks.processAssets.tap(
					{
						name: 'MoveRtlCssToCssFolderPlugin',
						stage: webpack.Compilation
							.PROCESS_ASSETS_STAGE_OPTIMIZE_INLINE,
					},
					() => {
						const destination = this.destination
							.replace( /\\/g, '/' )
							.replace( /\/$/, '' );

						for ( const {
							name: assetName,
						} of compilation.getAssets() ) {
							if ( ! assetName.endsWith( '-rtl.css' ) ) {
								continue;
							}

							// Skip if it already has the correct directory path
							const expectedPath = `${ destination }/`;
							if ( assetName.startsWith( expectedPath ) ) {
								continue;
							}

							// Get just the filename without any directory components
							const basename = assetName
								.split( '/' )
								.pop()
								.split( '\\' )
								.pop();

							const prefix =
								destination && destination !== '.'
									? `${ destination }/`
									: '';
							const newAssetName = `${ prefix }${ basename }`;

							if (
								typeof compilation.renameAsset === 'function'
							) {
								compilation.renameAsset(
									assetName,
									newAssetName
								);
							} else {
								const asset = compilation.getAsset( assetName );
								if ( ! asset ) {
									continue;
								}
								compilation.emitAsset(
									newAssetName,
									asset.source,
									asset.info
								);
								compilation.deleteAsset( assetName );
							}

							for ( const chunk of compilation.chunks ) {
								if ( chunk.files?.has( assetName ) ) {
									chunk.files.delete( assetName );
									chunk.files.add( newAssetName );
								}
							}
						}
					}
				);
			}
		);
	}
}

defaultConfig = {
	...defaultConfig,
	context: __dirname,
	resolve: {
		...( defaultConfig.resolve || {} ),
		alias: {
			...( defaultConfig.resolve?.alias || {} ),
			'@': path.resolve( __dirname, 'src' ),
		},
	},
	entry: {
		fastbundle: path.resolve( __dirname, 'src/index.js' ),
		'frontend-script': path.resolve(
			__dirname,
			'src/frontend_script/index.js'
		),
		'fbnd-admin': path.resolve( __dirname, 'src/menu/fbnd-admin.js' ),

		// CSS-only entrypoints (replaces gulp SCSS build)
		'fastbundle-frontend': path.resolve(
			__dirname,
			'src/scss/frontend.scss'
		),
	},
	output: {
		...( defaultConfig.output || {} ),
		path: jsOutputPath,
		filename: '[name].js',
		clean: true,
	},
	plugins: [
		...( defaultConfig.plugins || [] ).filter(
			( plugin ) =>
				! ( plugin instanceof MiniCssExtractPlugin ) &&
				! ( plugin instanceof RtlCssPlugin )
		),
		new MiniCssExtractPlugin( {
			filename: `${ cssOutputRelativeToJs }/[name].css`,
		} ),
		new RtlCssPlugin(),
		new MoveRtlCssToCssFolderPlugin( {
			destination: cssOutputRelativeToJs,
		} ),
	],
	module: {
		...defaultConfig.module,
		rules: [
			...defaultConfig.module.rules,
			{
				test: /\.svg$/i,
				use: [
					{
						loader: '@svgr/webpack',
						options: {
							icon: false,
							svgo: false,
						},
					},
				],
			},
		],
	},
};

module.exports = defaultConfig;
