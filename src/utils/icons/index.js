/**
 * Small shared icon set for the admin app.
 *
 * Kept intentionally minimal — this replaced a much larger generated icon
 * library that shipped with the removed block system. Add icons here as new
 * surfaces need them.
 */

const logo = (
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none">
		<rect width="32" height="32" rx="8" fill="#3858E9" />
		<path
			d="M9 16.5 14 21l9-10"
			stroke="#fff"
			strokeWidth="2.5"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</svg>
);

const youtube = (
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
		<rect x="2" y="5" width="20" height="14" rx="4" fill="#FF0000" />
		<path d="M10 9.5v5l4.5-2.5L10 9.5Z" fill="#fff" />
	</svg>
);

const showThanks = (
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none">
		<circle cx="24" cy="24" r="24" fill="#22C55E" />
		<path
			d="M14 24.5 20.5 31 34 17"
			stroke="#fff"
			strokeWidth="3"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</svg>
);

const store = (
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none">
		<rect x="6" y="18" width="36" height="22" rx="2" fill="#3858E9" />
		<path d="M6 18 10 8h28l4 10H6Z" fill="#0B0E04" />
	</svg>
);

const revenue = (
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none">
		<path d="M6 34 18 22l8 8 16-16" stroke="#22C55E" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
	</svg>
);

const wholesale = (
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none">
		<circle cx="16" cy="14" r="6" fill="#F2AE40" />
		<circle cx="32" cy="14" r="6" fill="#6C6CFF" />
		<path d="M4 40c0-8 6-14 12-14s12 6 12 14" stroke="#F2AE40" strokeWidth="3" fill="none" />
		<path d="M20 40c0-8 6-14 12-14s12 6 12 14" stroke="#6C6CFF" strokeWidth="3" fill="none" />
	</svg>
);

const icons = {
	logo,
	youtube,
	'show-thanks': showThanks,
	store,
	revenue,
	wholesale,
};

export default icons;
