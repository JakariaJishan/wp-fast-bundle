import UTMLinkGenerator from '@/utils/utm-link';
import { useCallback, useEffect, useState } from 'react';
const { __ } = wp.i18n;

const CONFIG = [
	{
		id: 'fbnd_helloBar_summer_sale_2026_vv1',
		start: '2026-07-06',
		end: '2026-08-01',
		countdownDuration: false,
		utmKey: 'summer_sale',
		content: (
			<>
				<span className="dashicons dashicons-bell fbnd-ring"></span>
				&nbsp;
				<span>
					{ __(
						'Summer Sale - Enjoy Up to 50% on',
						'fast-bundle'
					) }
				</span>
				&nbsp;
				<strong>{ __( 'FastBundle Pro', 'fast-bundle' ) }</strong>
			</>
		),
	},
	{
		id: 'fbnd_helloBar_summer_sale_2026_vv1_x1',
		start: '2026-08-02',
		end: '2026-08-16',
		countdownDuration: false,
		utmKey: 'summer_sale',
		content: (
			<>
				<span className="dashicons dashicons-bell fbnd-ring"></span>
				&nbsp;
				<span>
					{ __(
						'Summer Sale - Enjoy Up to 50% on',
						'fast-bundle'
					) }
				</span>
				&nbsp;
				<strong>{ __( 'FastBundle Pro', 'fast-bundle' ) }</strong>
			</>
		),
	},
	{
		id: 'fbnd_helloBar_summer1_flash_sale_2026_2',
		start: '2026-05-22',
		end: '2026-06-01',
		countdownDuration: false,
		utmKey: 'summer_surprise_sale',
		content: (
			<>
				<span className="dashicons dashicons-bell fbnd-ring"></span>
				&nbsp;
				<span>
					{ __(
						'Surprise Sale - Enjoy Up to 55% on',
						'fast-bundle'
					) }
				</span>
				&nbsp;
				<strong>{ __( 'FastBundle Pro', 'fast-bundle' ) }</strong>
			</>
		),
	},
];

const Hellobar = () => {
	const [ config, setConfig ] = useState( () => {
		const _config = CONFIG.find( ( item ) => {
			const validTimeFrame =
				new Date() >= new Date( item.start ) &&
				new Date() <= new Date( item.end );

			return (
				validTimeFrame &&
				fbndBackendData.helloBar &&
				fbndBackendData.helloBar[ item.id ] !== 'hide' &&
				! fbndBackendData.isActive
			);
		} );

		return _config || null;
	} );

	const helloBarAction = () => {
		wp.apiFetch( {
			path: '/fbnd/v1/hello_bar',
			method: 'POST',
			data: { type: 'hello_bar', id: config.id },
		} );
		setConfig( null );
	};

	if ( ! config ) {
		return null;
	}

	return (
		<div>
			<style>
				{ `.fbnd-setting-hellobar {
                    background: #86a62c;
                    padding: 6px 0;
                    text-align: center;
                    color: rgba(255, 255, 255, 0.85);
                    font-size: 14px;
					display: flex;
					gap: 20px;
					justify-content: center;
					align-items: center;
                }

                .fbnd-setting-hellobar a {
                    margin-left: 4px;
                    font-size: 14px;
                    color: #fff;
                }

                .fbnd-setting-hellobar strong {
                    color: #fff;
                    font-weight: 700;
                }
                .fbnd-ring {
                    -webkit-animation: ring 4s .7s ease-in-out infinite;
                    -moz-animation: ring 4s .7s ease-in-out infinite;
                    animation: ring 4s .7s ease-in-out infinite;
                    color: #fff;
                }
                .helobarClose {
                    position: absolute;
                    cursor: pointer;
                    right: 15px;
                    svg {
                        height: 16px;
                        color: #fff;
                    }
                }
                @keyframes ring {
                    0% { transform: rotate(0); }
                    1% { transform: rotate(30deg); }
                    3% { transform: rotate(-28deg); }
                    5% { transform: rotate(34deg); }
                    7% { transform: rotate(-32deg); }
                    9% { transform: rotate(30deg); }
                    11% { transform: rotate(-28deg); }
                    13% { transform: rotate(26deg); }
                    15% { transform: rotate(-24deg); }
                    17% { transform: rotate(22deg); }
                    19% { transform: rotate(-20deg); }
                    21% { transform: rotate(18deg); }
                    23% { transform: rotate(-16deg); }
                    25% { transform: rotate(14deg); }
                    27% { transform: rotate(-12deg); }
                    29% { transform: rotate(10deg); }
                    31% { transform: rotate(-8deg); }
                    33% { transform: rotate(6deg); }
                    35% { transform: rotate(-4deg); }
                    37% { transform: rotate(2deg); }
                    39% { transform: rotate(-1deg); }
                    41% { transform: rotate(1deg); }
                    43% { transform: rotate(0); }
                    100% { transform: rotate(0); }
                }` }
			</style>
			<a
				href={ UTMLinkGenerator( {
					utmKey: config.utmKey,
				} ) }
				target="_blank"
				rel="noreferrer"
				style={ { textDecoration: 'none' } }
			>
				<div className="fbnd-setting-hellobar">
					<span>{ config.content }</span>
					{ config.countdownDuration && (
						<CountdownTimer
							duration={ config.countdownDuration }
							storageKey={ `fbnd_hello_bar_timer_${ config.id }` }
						/>
					) }
					<strong>
						<span>{ __( 'Grab Now', 'fast-bundle' ) }</span>
						&nbsp; &#10148;
					</strong>
					<button
						type="button"
						className="helobarClose"
						onClick={ ( e ) => {
							e.stopPropagation();
							e.preventDefault();
							helloBarAction();
						} }
						aria-label={ __(
							'Close notification',
							'fast-bundle'
						) }
						style={ {
							background: 'none',
							border: 'none',
							padding: 0,
							cursor: 'pointer',
						} }
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="20"
							height="20"
							fill="none"
							viewBox="0 0 20 20"
						>
							<path
								stroke="currentColor"
								d="M15 5 5 15M5 5l10 10"
							/>
						</svg>
					</button>
				</div>
			</a>
		</div>
	);
};

const CountdownTimer = ( { duration, storageKey } ) => {
	const durationMs = Math.max( Number( duration ) || 0, 0 ) * 1000;

	const getSavedEndTime = useCallback( () => {
		if ( ! durationMs || ! storageKey ) {
			return null;
		}

		try {
			const savedValue = window.localStorage.getItem( storageKey );
			const parsedValue = Number( savedValue );

			if ( Number.isFinite( parsedValue ) && parsedValue > 0 ) {
				return parsedValue;
			}
		} catch ( error ) {
			return null;
		}

		return null;
	}, [ durationMs, storageKey ] );

	const persistEndTime = useCallback(
		( endTime ) => {
			if ( ! storageKey ) {
				return;
			}

			try {
				window.localStorage.setItem( storageKey, String( endTime ) );
			} catch ( error ) {
				void error;
			}
		},
		[ storageKey ]
	);

	const getRemainingSeconds = useCallback( () => {
		if ( ! durationMs ) {
			return 0;
		}

		const now = Date.now();
		let endTime = getSavedEndTime();

		if ( ! endTime || endTime <= now ) {
			endTime = now + durationMs;
			persistEndTime( endTime );
		}

		return Math.max( Math.ceil( ( endTime - now ) / 1000 ), 0 );
	}, [ durationMs, getSavedEndTime, persistEndTime ] );

	const [ remainingSeconds, setRemainingSeconds ] =
		useState( getRemainingSeconds );

	useEffect( () => {
		if ( ! durationMs ) {
			setRemainingSeconds( 0 );
			return undefined;
		}

		const tick = () => {
			setRemainingSeconds( getRemainingSeconds() );
		};

		tick();
		const intervalId = window.setInterval( tick, 1000 );

		return () => {
			window.clearInterval( intervalId );
		};
	}, [ durationMs, getRemainingSeconds ] );

	if ( ! durationMs ) {
		return null;
	}

	const days = Math.floor( remainingSeconds / 86400 );
	const hours = Math.floor( ( remainingSeconds % 86400 ) / 3600 );
	const minutes = Math.floor( ( remainingSeconds % 3600 ) / 60 );
	const seconds = remainingSeconds % 60;
	const formattedHours = String( hours ).padStart( 2, '0' );
	const formattedMinutes = String( minutes ).padStart( 2, '0' );
	const formattedSeconds = String( seconds ).padStart( 2, '0' );

	return (
		<strong>
			{ `${ days }:${ formattedHours }:${ formattedMinutes }:${ formattedSeconds }` }
		</strong>
	);
};

export default Hellobar;
