import gulp from 'gulp';
import fs from 'fs';
import path from 'path';
import zip from 'gulp-zip';

function getDateTime() {
	const currDate = new Date();
	const year = currDate.getFullYear();
	const month = currDate.getMonth() + 1; // Note: Month is zero-based, so January is 0
	const day = currDate.getDate();
	const hours = currDate.getHours();
	const minutes = currDate.getMinutes();
	const seconds = currDate.getSeconds();
	return `__${ year }-${ month }-${ day }_${ hours }-${ minutes }-${ seconds }`;
}

let folderName = 'fast-bundle';
let destName = 'fast-bundle';
gulp.task( 'copy_files', function () {
	const filePath = path.join( process.cwd(), './fast-bundle.php' );
	const date = getDateTime();
	folderName = 'Version-Unknown' + date;

	try {
		const data = fs.readFileSync( filePath, 'utf8' );
		const versionRegex = /define\( 'FBND_VER', '(\d+\.\d+\.\d+)' \);/;
		const match = data.match( versionRegex );
		if ( match ) {
			folderName = 'V' + match[ 1 ] + date;
			destName = destName + '-' + match[ 1 ];
		} else {
			console.log( 'Version definition not found.' );
		}
	} catch ( err ) {
		console.error( 'Error getting version: ', err );
	}

	return gulp
		.src(
			[
				'./**/*',
				'!./.git',
				'!./node_modules/**',
				'!./.gitignore',
				'!./src/**',
				'!./build/**',
				'!./**/*.LICENSE.txt',
				'!.*',
				'!package.json',
				'!package-lock.json',
				'!*.js',
				'!gulpfile.mjs',
				'!jsconfig.json',
				'!*.phar',
				'!*.yml',
				'!./assets/js/wowactions.js',
				'!./**/*.md',
				'!./**/*.js.map',
				'!./**/*.css.map',
			],
			{ encoding: false }
		)
		.pipe(
			gulp.dest( `./build/${ folderName }/fast-bundle/`, {
				overwrite: true,
			} )
		);
} );

gulp.task( 'zip', function () {
	return (
		gulp
			.src( `./build/${ folderName }/**`, { encoding: false } )
			// @ts-ignore
			.pipe( zip( destName + '.zip' ) )
			.pipe( gulp.dest( `./build/${ folderName }/` ) )
	);
} );

gulp.task( 'package', gulp.series( 'copy_files', 'zip' ) );
