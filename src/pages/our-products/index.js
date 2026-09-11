import {
	Button,
	Card,
	CardBody,
	CardFooter,
	CardHeader,
	Icon,
	__experimentalText as Text,
} from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

const productIcons = {
	wholesale_x: (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="48"
			height="48"
			fill="none"
			viewBox="0 0 48 48"
		>
			<path
				fill="#FEAD01"
				d="M22.288 5.44498 11.1095 7.77499c-.6634.13829-1.0892.78825-.9509 1.45173l2.33 11.17848c.1383.6635.7883 1.0892 1.4517.9509l11.1785-2.33c.6635-.1383 1.0892-.7882.9509-1.4517l-2.33-11.1785c-.1383-.66347-.7882-1.08921-1.4517-.95092Zm3.1934 15.32522-11.1785 2.33c-.6635.1383-1.0892.7882-.9509 1.4517l2.33 11.1785c.1383.6635.7882 1.0892 1.4517.9509l11.1785-2.33c.6635-.1383 1.0892-.7883.9509-1.4517l-2.33-11.1785c-.1383-.6635-.7883-1.0892-1.4517-.9509ZM37.6161 2.25064 26.4377 4.58065c-.6635.1383-1.0893.78826-.951 1.45173l2.33 11.17852c.1383.6634.7883 1.0892 1.4518.9509l11.1784-2.33c.6635-.1383 1.0893-.7883.951-1.4518l-2.33-11.17843c-.1383-.66348-.7883-1.08922-1.4518-.95093Zm3.1934 15.32716-11.1785 2.33c-.6635.1383-1.0892.7883-.9509 1.4517l2.33 11.1785c.1383.6635.7883 1.0892 1.4517.9509l11.1785-2.33c.6635-.1383 1.0892-.7882.9509-1.4517l-2.33-11.1785c-.1383-.6635-.7882-1.0892-1.4517-.9509Z"
			/>
			<path
				fill="#6C6CFF"
				d="M11.4509 35.4957c-.2235-.0003-.4402-.0776-.6136-.2187-.1734-.1412-.293-.3377-.3386-.5566L4.40205 5.44687c-.0671-.32174-.25914-.60372-.53395-.784-.27481-.18029-.60992-.24415-.93177-.17757-.15961.03288-.31112.09709-.44576.18889-.13464.09181-.24976.20939-.33867.34596-.08986.13594-.15175.2884-.1821.4485-.03036.16011-.02855.32465.00531.48404l.47956 2.30076c.05267.25283.00277.51622-.13875.73225-.14152.21603-.36305.367-.61587.41971-.12518.0261-.25429.02728-.37992.00348-.12564-.0238-.24534-.07212-.352302-.1422-.106958-.07007-.199074-.16054-.271063-.26622-.071988-.10568-.122425-.22451-.14848-.3497L.0686777 6.35002c-.0868909-.41-.0913681-.83319-.0132214-1.24494.0781467-.41176.2373657-.80387.4684307-1.15352.228483-.35063.524233-.65249.870113-.8881.34589-.23562.73506-.40032 1.145-.48457.8274-.1712 1.68888-.00722 2.39554.45595.70665.46317 1.20075 1.18772 1.3739 2.01471L12.4051 34.3231c.0294.1417.0269.2883-.0074.4289s-.0996.2719-.1909.3842c-.0914.1122-.2067.2028-.3374.2649-.1307.0622-.2737.0944-.4185.0944v.0002Zm8.49 5.5912c-.2408-.0005-.4729-.0901-.6515-.2515-.1786-.1615-.291-.3834-.3156-.623-.0245-.2395.0404-.4796.1825-.674.1421-.1944.3511-.3293.5868-.3786l27.0841-5.6452c.2528-.0527.5162-.0028.7322.1387.216.1415.3669.3631.4196.6159.0527.2528.0028.5162-.1387.7322-.1415.216-.363.3669-.6158.4196l-27.0841 5.6452c-.0656.0136-.1325.0205-.1995.0207Z"
			/>
			<path
				fill="#070C1A"
				d="M12.8922 45.9671c-.8322-.0016-1.647-.2389-2.3499-.6845-.70286-.4456-1.26512-1.0812-1.62162-1.8332-.35651-.752-.49266-1.5896-.39269-2.4158.09996-.8262.43196-1.6072.95753-2.2525.52558-.6452 1.22318-1.1284 2.01208-1.3935.7889-.2651 1.6367-.3012 2.4453-.1043.8086.197 1.5448.619 2.1234 1.2172.5786.5981.9759 1.348 1.1458 2.1627.2383 1.1434.0126 2.3345-.6273 3.3115-.64.977-1.6418 1.6597-2.7852 1.898-.2984.0625-.6025.0941-.9074.0944Zm.014-6.8621c-.1701 0-.3398.0176-.5062.0525-.4757.099-.9113.3369-1.2518.6835-.3404.3467-.5704.7865-.6609 1.2638-.0905.4774-.0374.9708.1525 1.418.19.4472.5083.828.9147 1.0943.4064.2663.8826.4061 1.3684.4017.4859-.0044.9595-.1527 1.361-.4263.4015-.2735.7129-.66.8948-1.1105.1819-.4505.2261-.9449.127-1.4205-.1152-.5517-.4164-1.047-.8533-1.403-.4368-.3561-.9827-.5512-1.5462-.5528v-.0007Z"
			/>
		</svg>
	),
	wow_store: (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="48"
			height="48"
			fill="none"
			viewBox="0 0 48 48"
		>
			<path
				fill="#FF176B"
				d="M33.4798 8.9711 48 0l-7.1908 32.9249-4.4393 5.9884H4.9711L0 32.9249l3.90751-17.9654 8.76299 2.9827-2.6127 11.9769h6.289l3.9307-17.9653h9.4335l-3.9307 17.9653h6.2891l4.578-20.948h-3.1676ZM9.98852 48.0005c1.66478 0 2.98268-1.3411 2.98268-2.9827s-1.3411-2.9826-2.98268-2.9826c-1.64162 0-2.98266 1.341-2.98266 2.9826 0 1.6416 1.34104 2.9827 2.98266 2.9827Zm15.67578 0c1.6416 0 2.9827-1.3411 2.9827-2.9827s-1.3411-2.9826-2.9827-2.9826-2.9827 1.341-2.9827 2.9826c0 1.6416 1.3411 2.9827 2.9827 2.9827Z"
			/>
		</svg>
	),
	wow_revenue: (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="48"
			height="48"
			fill="none"
			viewBox="0 0 48 48"
		>
			<path
				fill="#00A464"
				d="M47.9999 47.9999H36L24 0h12l11.9999 47.9999Zm-12 0H24L12 15.96h12l11.9999 32.0399Zm-12 .0001H12L0 32.04h12L23.9999 48Z"
			/>
		</svg>
	),
	wow_optin: (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="48"
			height="48"
			fill="none"
			viewBox="0 0 48 48"
		>
			<g fill="#F97415" clipPath="url(#optin_48_path)">
				<path d="M28.7992 24.0373c0-2.6419-2.1581-4.8-4.8-4.8-2.6418 0-4.8 2.1581-4.8 4.8 0 2.6419 2.1582 4.8 4.8 4.8 2.6419 0 4.8-2.1581 4.8-4.8Z" />
				<path d="M24 48.0372v-9.6c7.9256 0 14.4-6.4744 14.4-14.4S31.9256 9.63721 24 9.63721 9.6 16.1116 9.6 24.0372H0C0 10.7907 10.7535 0 24 0s24 10.7535 24 24-10.7535 24-24 24v.0372Z" />
				<path d="m19.2 28.8369-19.2 6.4 8.8186 3.9814L12.8 48.0369l6.4372-19.2H19.2Z" />
			</g>
			<defs>
				<clipPath id="optin_48_path">
					<path fill="#fff" d="M0 0h48v48H0z" />
				</clipPath>
			</defs>
		</svg>
	),
	post_x: (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="48"
			height="48"
			fill="none"
			viewBox="0 0 48 48"
		>
			<path
				fill="#037FFF"
				d="M19.4589 1H4.22278C1.8906 1 0 2.8855 0 5.21139V20.4064c0 2.3259 1.8906 4.2115 4.22278 4.2115H19.4589c2.3322 0 4.2229-1.8856 4.2229-4.2115V5.21139C23.6818 2.8855 21.7911 1 19.4589 1Z"
			/>
			<path
				fill="#3BABFF"
				d="M39.2247 5.5459H23.9883c-2.332 0-4.2227 1.88551-4.2227 4.21138V24.9523c0 2.3259 1.8907 4.2115 4.2227 4.2115h15.2364c2.332 0 4.2227-1.8856 4.2227-4.2115V9.75728c0-2.32587-1.8907-4.21138-4.2227-4.21138Z"
			/>
			<path
				fill="#69C6FF"
				d="M43.7753 23.7119H28.5391c-2.3322 0-4.2227 1.8856-4.2227 4.2114v15.195c0 2.3261 1.8905 4.2117 4.2227 4.2117h15.2362c2.332 0 4.2227-1.8856 4.2227-4.2117v-15.195c0-2.3258-1.8907-4.2114-4.2227-4.2114Z"
			/>
			<path
				fill="#71DEFF"
				d="M24.0135 19.166H8.77749c-2.3322 0-4.2228 1.8855-4.2228 4.2114v15.1952c0 2.3259 1.8906 4.2112 4.2228 4.2112H24.0135c2.3323 0 4.2229-1.8853 4.2229-4.2112V23.3774c0-2.3259-1.8906-4.2114-4.2229-4.2114Z"
			/>
		</svg>
	),
	wow_addon: (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="40"
			height="40"
			fill="none"
			viewBox="0 0 32 32"
		>
			<rect
				width="14.12"
				height="14.12"
				x="1"
				y="16.88"
				fill="#86A62C"
				rx="3.53"
			/>
			<rect
				width="14.12"
				height="14.12"
				x="16.88"
				y="1"
				fill="#86A62C"
				rx="3.53"
			/>
			<path
				fill="#86A62C"
				fillRule="evenodd"
				d="M1.38 2.93C1 3.68 1 4.67 1 6.65v2.82c0 1.98 0 2.97.38 3.72.34.66.88 1.2 1.55 1.54.75.39 1.74.39 3.72.39h2.82c1.98 0 2.97 0 3.72-.39.66-.34 1.2-.88 1.54-1.54.39-.75.39-1.74.39-3.72V6.65c0-1.98 0-2.97-.39-3.72a3.53 3.53 0 0 0-1.54-1.55C12.44 1 11.45 1 9.47 1H6.65c-1.98 0-2.97 0-3.72.38-.67.34-1.2.88-1.55 1.55Zm5.98 8.62 5.73-5.73-1.24-1.25-5.11 5.1-2.47-2.46-1.25 1.25 3.1 3.09c.34.34.9.34 1.24 0ZM16.88 22.53c0-1.98 0-2.97.39-3.72.34-.66.88-1.2 1.54-1.54.75-.39 1.74-.39 3.72-.39h2.82c1.98 0 2.97 0 3.72.39.67.34 1.2.88 1.55 1.54.38.75.38 1.74.38 3.72v2.82c0 1.98 0 2.97-.38 3.72-.34.67-.88 1.2-1.55 1.55-.75.38-1.74.38-3.72.38h-2.82c-1.98 0-2.97 0-3.72-.38a3.53 3.53 0 0 1-1.54-1.55c-.39-.75-.39-1.74-.39-3.72v-2.82Zm6.18.53v-3.09h1.76v3.09h3.1v1.76h-3.1v3.1h-1.76v-3.1h-3.09v-1.76h3.09Z"
				clipRule="evenodd"
			/>
		</svg>
	),
	wow_shipping: (
		<svg
			width="48"
			height="48"
			viewBox="0 0 30 30"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M28.9502 12.2067L22.3167 5.57321C21.9772 5.23371 21.5168 5.04297 21.0366 5.04297H18.1658C16.916 5.04297 15.9029 6.05612 15.9029 7.3059V16.3576C15.9029 16.8575 15.4976 17.2628 14.9977 17.2628H2.77788C1.5281 17.2628 0.514952 18.2759 0.514952 19.5257V21.5624C0.514952 22.8121 1.5281 23.8253 2.77788 23.8253H3.37305C3.87547 21.8733 5.64746 20.4309 7.75633 20.4309C9.8652 20.4309 11.6372 21.8733 12.1396 23.8253H17.4032C17.9056 21.8733 19.6776 20.4309 21.7865 20.4309C23.8954 20.4309 25.6674 21.8733 26.1698 23.8253H27.2175C28.4673 23.8253 29.4805 22.8121 29.4805 21.5624V13.4868C29.4805 13.0067 29.2897 12.5462 28.9502 12.2067Z"
				fill="#0C54FC"
			/>
			<path
				d="M18.6208 24.9572C18.6208 26.7069 20.0392 28.1253 21.7889 28.1253C23.5386 28.1253 24.957 26.7069 24.957 24.9572C24.957 23.2075 23.5386 21.7891 21.7889 21.7891C20.0392 21.7891 18.6208 23.2075 18.6208 24.9572Z"
				fill="#0C54FC"
			/>
			<path
				d="M4.58957 24.9572C4.58957 26.7069 6.00798 28.1253 7.75768 28.1253C9.50737 28.1253 10.9258 26.7069 10.9258 24.9572C10.9258 23.2075 9.50737 21.7891 7.75768 21.7891C6.00798 21.7891 4.58957 23.2075 4.58957 24.9572Z"
				fill="#0C54FC"
			/>
			<path
				d="M20.402 7.73204C20.6671 7.46692 21.0968 7.46692 21.3619 7.73204L26.3404 12.7105L26.3872 12.7622C26.6045 13.0288 26.5889 13.422 26.3404 13.6705C26.0919 13.919 25.6988 13.9346 25.4321 13.7173L25.3804 13.6705L20.402 8.69202C20.1368 8.4269 20.1368 7.99716 20.402 7.73204Z"
				fill="white"
			/>
			<path
				d="M0.519531 4.13793C0.519531 2.88815 1.53268 1.875 2.78246 1.875H11.8342C13.084 1.875 14.0971 2.88815 14.0971 4.13793V13.1897C14.0971 14.4394 13.084 15.4526 11.8342 15.4526H2.78246C1.53268 15.4526 0.519531 14.4394 0.519531 13.1897V4.13793Z"
				fill="#0C54FC"
			/>
			<path
				d="M2.32812 4.59072C2.32812 4.09081 2.73338 3.68555 3.2333 3.68555H11.3798C11.8798 3.68555 12.285 4.09081 12.285 4.59072V5.94848C12.285 6.44839 11.8798 6.85365 11.3798 6.85365H3.2333C2.73338 6.85365 2.32812 6.44839 2.32812 5.94848V4.59072Z"
				fill="white"
			/>
			<path
				d="M2.32812 9.56923C2.32812 9.06932 2.73338 8.66406 3.2333 8.66406C3.73321 8.66406 4.13847 9.06932 4.13847 9.56923C4.13847 10.0691 3.73321 10.4744 3.2333 10.4744C2.73338 10.4744 2.32812 10.0691 2.32812 9.56923Z"
				fill="white"
			/>
			<path
				d="M6.39844 9.56923C6.39844 9.06932 6.8037 8.66406 7.30361 8.66406C7.80352 8.66406 8.20878 9.06932 8.20878 9.56923C8.20878 10.0691 7.80352 10.4744 7.30361 10.4744C6.8037 10.4744 6.39844 10.0691 6.39844 9.56923Z"
				fill="white"
			/>
			<path
				d="M10.4766 9.56923C10.4766 9.06932 10.8818 8.66406 11.3817 8.66406C11.8816 8.66406 12.2869 9.06932 12.2869 9.56923C12.2869 10.0691 11.8816 10.4744 11.3817 10.4744C10.8818 10.4744 10.4766 10.0691 10.4766 9.56923Z"
				fill="white"
			/>
			<path
				d="M2.32812 12.7372C2.32812 12.2373 2.73338 11.832 3.2333 11.832C3.73321 11.832 4.13847 12.2373 4.13847 12.7372C4.13847 13.2371 3.73321 13.6424 3.2333 13.6424C2.73338 13.6424 2.32812 13.2371 2.32812 12.7372Z"
				fill="white"
			/>
			<path
				d="M6.39844 12.7372C6.39844 12.2373 6.8037 11.832 7.30361 11.832C7.80352 11.832 8.20878 12.2373 8.20878 12.7372C8.20878 13.2371 7.80352 13.6424 7.30361 13.6424C6.8037 13.6424 6.39844 13.2371 6.39844 12.7372Z"
				fill="white"
			/>
			<path
				d="M10.4766 12.7372C10.4766 12.2373 10.8818 11.832 11.3817 11.832C11.8816 11.832 12.2869 12.2373 12.2869 12.7372C12.2869 13.2371 11.8816 13.6424 11.3817 13.6424C10.8818 13.6424 10.4766 13.2371 10.4766 12.7372Z"
				fill="white"
			/>
		</svg>
	),
};
const productList = {
	wow_invoice: {
		title: 'WowInvoice',
		subtitle: __(
			'Generate & automate professional PDF documents like invoices, packing slips, picklists and shipping labels for WooCommerce effortlessly',
			'optin'
		),
		install: 'installation url',
		pluginUrl: '#',
		new: true,
	},
	wow_shipping: {
		title: 'WowShipping',
		subtitle: __(
			'Easily set up table rate shipping with 30+ powerful conditions like, weight, quantity, products, country, and more.',
			'fast-bundle'
		),
		install: 'installation url',
		pluginUrl: '#',
		hot: true,
	},
	wholesale_x: {
		title: 'WholesaleX',
		subtitle: `WholesaleX 
        ${ __(
			'is a B2B wholesale plugin featuring advanced wholesale pricing and customization features.',
			'fast-bundle'
		) }`,
		install: 'installation url',
		pluginUrl: 'https://getwholesalex.com/',
	},
	wow_store: {
		title: 'WowStore',
		subtitle: `WowStore ${ __(
			'is a complete WooCommerce store builder featuring advanced options to improve sales!',
			'fast-bundle'
		) }`,
		install: 'installation url',
		pluginUrl: '#',
	},
	wow_revenue: {
		title: 'WowRevenue',
		subtitle: `WowRevenue ${ __(
			'boost sales and maximize revenue with the advanced discount campaigns of WowRevenue.',
			'fast-bundle'
		) }`,
		install: 'installation url',
		pluginUrl: 'https://www.wowrevenue.com/',
	},
	wow_optin: {
		title: 'WowOptin',
		subtitle: `WowOptin ${ __(
			'generates actionable leads and boost sales with popups, banners, and floating bars using WowOptin.',
			'fast-bundle'
		) }`,
		install: 'installation url',
		pluginUrl: 'https://www.wowoptin.com/',
	},
	post_x: {
		title: 'PostX',
		subtitle: `PostX ${ __(
			'creates wonderful custom blogs and more using the powerful and customizable PostX site builder.',
			'fast-bundle'
		) }`,
		install: 'installation url',
		pluginUrl: '#',
	},
};

export const OurProduct = () => {
	const [ installStatus, setInstallStatus ] = useState( {} );
	const [ installed, setInstalled ] = useState(
		fbndBackendData.products || {}
	);
	const [ actives, setActives ] = useState(
		fbndBackendData.products_active || {}
	);

	const containerStyle = {
		gap: 32,
		marginTop: 40,
		display: 'grid',
		gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
	};

	const handleInstall = ( key ) => {
		setInstallStatus( ( prevState ) => ( {
			...prevState,
			[ key ]: true,
		} ) );

		const formData = new FormData();
		formData.append( 'action', 'fbnd_install_plugin' );
		formData.append( 'wpnonce', fbndBackendData.nonce );
		formData.append( 'plugin', key );

		fetch( fbndBackendData.ajax, {
			method: 'POST',
			body: formData,
		} )
			.then( ( response ) => response.json() )
			.then( () => {
				setInstalled( ( prevState ) => ( {
					...prevState,
					[ key ]: true,
				} ) );
				setActives( ( prevState ) => ( {
					...prevState,
					[ key ]: true,
				} ) );
			} )
			.catch( () => {} )
			.finally( () => {
				setInstallStatus( ( prevState ) => ( {
					...prevState,
					[ key ]: false,
				} ) );
			} );
	};

	const renderProductCard = ( product, key ) => {
		const isInstalling = Boolean( installStatus[ product ] );
		return (
			<Card
				key={ key }
				style={ {
					position: 'relative',
					paddingBottom: 70,
					width: '100%',
					outline: window.location.hash.includes( product )
						? '2px solid #0c54fc'
						: 'none',
				} }
			>
				<CardHeader style={ { justifyContent: 'start' } }>
					<Icon
						style={ { width: 'fit-content' } }
						icon={ icons[ product ] }
						height="32px"
						width="100%"
					/>
					{ productList[ product ]?.hot && (
						<span
							style={ {
								backgroundColor: '#f60029',
								color: '#fff',
								padding: '2px 8px',
								borderRadius: 9999,
								fontWeight: 'bold',
							} }
						>
							{ __( 'Hot', 'fast-bundle' ) }
						</span>
					) }
					{ productList[ product ]?.new && (
						<span
							style={ {
								backgroundColor: '#16a34a',
								color: '#fff',
								padding: '2px 8px',
								borderRadius: 9999,
								fontWeight: 'bold',
							} }
						>
							{ __( 'New', 'fast-bundle' ) }
						</span>
					) }
				</CardHeader>
				<CardBody>
					<Text size={ 16 } variant="muted">
						{ productList[ product ]?.subtitle }
					</Text>
				</CardBody>
				<CardFooter style={ { position: 'absolute', bottom: 0 } }>
					{ actives[ product ] ? (
						<Button disabled variant="secondary">
							{ __( 'Activated', 'fast-bundle' ) }
						</Button>
					) : (
						<Button
							onClick={ () => handleInstall( product ) }
							disabled={ isInstalling }
							isBusy={ isInstalling }
							variant="secondary"
						>
							{ ! installed[ product ]
								? __( 'Install', 'fast-bundle' )
								: __( 'Activate', 'fast-bundle' ) }
						</Button>
					) }

					<Button
						href={ productList[ product ].pluginUrl }
						target="_blank"
						rel="noreferrer noopener"
						variant="link"
					>
						{ __( 'Plugin Details', 'fast-bundle' ) }
					</Button>
				</CardFooter>
			</Card>
		);
	};

	return (
		<div style={ containerStyle } className="fbnd-container">
			{ Object.keys( productList ).map( ( product, key ) => {
				return renderProductCard( product, key );
			} ) }
		</div>
	);
};
