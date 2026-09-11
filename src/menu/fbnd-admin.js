import jQuery from 'jquery';
import './fbnd-admin.scss';

( function ( $ ) {
	'use strict';

	// *************************************
	// Add target blank for upgrade button
	// *************************************
	const fbndMenuHref = $( '#toplevel_page_fbnd-dashboard > a' ).attr(
		'href'
	);
	if ( fbndMenuHref?.indexOf( '?page=fbnd-dashboard' ) > 0 ) {
		$( '#toplevel_page_fbnd-dashboard > a' ).attr(
			'href',
			fbndMenuHref + '#dashboard'
		);
	}

	if ( '?page=fbnd-dashboard' == window.location.search ) {
		const hash = window.location.hash;
		if ( hash ) {
			if ( hash.indexOf( 'demoid' ) < 0 ) {
				$( '#toplevel_page_fbnd-dashboard ul li' ).removeClass(
					'current'
				);

				if ( hash.includes( '#lists' ) ) {
					$(
						'#toplevel_page_fbnd-dashboard ul li a[href$=' +
							'#lists' +
							']'
					)
						.closest( 'li' )
						.addClass( 'current' );
				} else if ( hash === '#dashboard' ) {
					$(
						'#toplevel_page_fbnd-dashboard ul li.wp-first-item'
					).addClass( 'current' );
				} else {
					$(
						`#toplevel_page_fbnd-dashboard ul li a[href$="${ hash }"]`
					).addClass( 'current' );
				}
			}
		}
	}
	$( document ).on(
		'click',
		'#toplevel_page_fbnd-dashboard ul li a',
		function () {
			let value = $( this ).attr( 'href' );
			if ( value ) {
				value = value.split( '#' );
				if (
					typeof value[ 1 ] != 'undefined' &&
					value[ 1 ].indexOf( 'demoid' ) < 0 &&
					value[ 1 ]
				) {
					$( '#toplevel_page_fbnd-dashboard ul li a' )
						.closest( 'ul' )
						.find( 'li' )
						.removeClass( 'current' );
					$( this ).closest( 'li' ).addClass( 'current' ); // Submenu click
					$(
						`#toplevel_page_fbnd-dashboard ul li a[href$="${ value[ 1 ] }"]`
					).addClass( 'current' );
					if ( value[ 1 ] == 'dashboard' ) {
						$(
							'#toplevel_page_fbnd-dashboard ul li.wp-first-item'
						).addClass( 'current' );
					}
				}
			}
		}
	);

	$( '#toplevel_page_fbnd-dashboard ul > li > a' ).each( function () {
		if (
			$( this ).attr( 'href' ) &&
			$( this ).attr( 'href' ).indexOf( '?page=fbnd-dashboard' ) > 0
		) {
			if ( $( this ).hasClass( 'wp-first-item' ) !== false ) {
				$( this ).attr(
					'href',
					$( this ).attr( 'href' ) + '#dashboard'
				);
			}
		}
	} );

	$( '.wp-submenu > li > a' ).each( function () {
		if (
			$( this )
				.attr( 'href' )
				.indexOf( '?post_type=product&page=fastbundle-page' ) > 0
		) {
			$( this ).attr(
				'href',
				$( this )
					.attr( 'href' )
					.replace(
						'edit.php?post_type=product&page=fastbundle-page',
						'admin.php?page=fbnd-dashboard#dashboard'
					)
			);
		}
	} );
	// eslint-disable-next-line no-undef

	// Plugin Homepage URL Change
	if ( $( '#plugin-information-content' ).length > 0 ) {
		$(
			'a[href$="#"]'
		).attr( 'href', '#' );
	}
} )( jQuery );
