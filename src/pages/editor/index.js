/* eslint-disable react-hooks/exhaustive-deps */
import apiFetch from '@wordpress/api-fetch';
import {
	Button,
	Card,
	CardBody,
	__experimentalHStack as HStack,
	Icon,
	Modal,
	__experimentalText as Text,
	TextControl,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';
import { useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { arrowUpLeft, check } from '@wordpress/icons';

import useEditorStore, { currentPostCss } from '@/store/editor/useEditorStore';
import useToastStore from '@/store/toast/useToastStore';
import Canvas from './canvas';
import Drawer from './drawer';
import './editor.scss';

const Editor = ( props ) => {
	const isMobile = useViewportMatch( 'mobile', '<' );
	const isMedium = useViewportMatch( 'medium', '<' );

	const { optionId, setIsListing, setOptionId } = props;
	const [ saving, setSaving ] = useState( false );
	const [ isLoading, setIsLoading ] = useState( true );
	const setToastMessages = useToastStore(
		( state ) => state.setToastMessages
	);

	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const [ isTitleAlertOpen, setIsTitleAlertOpen ] = useState( false );
	const isNewPost = useRef( false );
	const hasSeededNewPost = useRef( false );

	const fieldData = useEditorStore( ( state ) => state.blocks );
	// Seeding the canvas, never a user edit: no history, no dirty flag.
	const setFieldData = useEditorStore( ( state ) => state.setBlocks );

	const resetStore = useEditorStore( ( state ) => state.resetStore );
	const setHasUnsavedChanges = useEditorStore(
		( state ) => state.setHasUnsavedChanges
	);
	const hasUnsavedChanges = useEditorStore(
		( state ) => state.hasUnsavedChanges
	);
	const postData = useEditorStore( ( state ) => state.postData );
	const settingPostData = useEditorStore(
		( state ) => state.settingPostData
	);
	const fetchOptionData = useEditorStore(
		( state ) => state.fetchOptionData
	);

	const setAssignedProducts = useEditorStore(
		( state ) => state.setAssignedProducts
	);
	const fetchAssignedProducts = useEditorStore(
		( state ) => state.fetchAssignedProducts
	);
	const saveGlobalStyles = useEditorStore(
		( state ) => state.saveGlobalStyles
	);
	const setLastSavedAt = useEditorStore( ( state ) => state.setLastSavedAt );

	// `optionId` used to be a prop on `EditorProvider`. The store needs it
	// before any action that posts to the API can run.
	useEffect( () => {
		useEditorStore.getState().setOptionId( optionId );
	}, [ optionId ] );

	// The provider fetched global styles in a mount effect; do it here now.
	useEffect( () => {
		useEditorStore.getState().fetchGlobalStyles();
	}, [] );

	useEffect( () => {
		const rootElement = document.documentElement;
		rootElement.classList.add( 'fbnd-editor-page' );

		return () => {
			rootElement.classList.remove( 'fbnd-editor-page' );
		};
	}, [] );

	useEffect( () => {
		if ( optionId !== 'new' ) {
			if ( isNewPost.current ) {
				isNewPost.current = false;
				return;
			}
			getOptionData();
			fetchAssignedProducts( optionId );
		} else if ( optionId === 'new' ) {
			isNewPost.current = true;
			if ( ! hasSeededNewPost.current ) {
				hasSeededNewPost.current = true;
				setFieldData( [], { history: false } );
				settingPostData( 'title', 'Option Set' );
				currentPostCss.current = '';
			}
			setIsLoading( false );
		}
	}, [ optionId ] );

	useEffect( () => {
		const abortControl = new AbortController();
		const handleKeyDown = ( event ) => {
			if (
				( event.ctrlKey || event.metaKey ) &&
				[ 's', 'S' ].includes( event.key )
			) {
				event.preventDefault();
				setOptionData( postData?.status );
			}
		};

		document.addEventListener( 'keydown', handleKeyDown, {
			signal: abortControl.signal,
		} );
		return () => {
			abortControl.abort();
		};
	}, [ postData, fieldData ] );

	const getOptionData = () => {
		setIsLoading( true );
		fetchOptionData( optionId )
			.catch( ( error ) => {
				setToastMessages( {
					status: 'error',
					messages: [ error.message ],
					state: true,
				} );
			} )
			.finally( () => setIsLoading( false ) );
	};

	const setOptionData = ( status = 'draft', initData ) => {
		if ( ! ( postData.title || '' ).trim() ) {
			setIsTitleAlertOpen( true );
			return;
		}
		settingPostData( 'status', status );
		setSaving( true );
		const joinedString = currentPostCss.current
			? Object.values( currentPostCss.current ).join( '' )
			: '';
		setAssignedProducts();
		saveGlobalStyles();
		setHasUnsavedChanges( false );

		let id = optionId;
		if ( String( optionId ).includes( 'new' ) ) {
			id = 'new';
		}
		apiFetch( {
			method: 'POST',
			path: '/fbnd/set_option',
			data: {
				id,
				status,
				title: postData.title,
				content: initData || fieldData,
				css: joinedString,
				wpnonce: fbndBackendData.nonce,
			},
		} )
			.then( ( obj ) => {
				setSaving( false );
				setLastSavedAt( Date.now() );
				if ( obj.id ) {
					setOptionId( obj.id );
					const url = new URL( window.location.href );
					const newHash = `#lists/${ obj.id }`;
					const newUrl = `${ url.pathname }${ url.search }${ newHash }`;
					window.history.pushState( {}, '', newUrl );
					setAssignedProducts( { id: obj.id, type: 'newforce' } );
				}
				if ( obj.message ) {
					setToastMessages( {
						status: 'success',
						messages: [ obj.message ],
						state: obj.success,
					} );
				}
			} )
			.catch( () => {
				setToastMessages( {
					status: 'error',
					messages: [
						__( 'You are not allowed to do this', 'fast-bundle' ),
					],
					state: true,
				} );
				setSaving( false );
			} );
	};

	const approachExit = () => {
		setIsModalOpen( false );
		setIsListing( true );
		resetStore();
		const url = new URL( window.location.href );
		const newHash = `#lists`;
		const newUrl = `${ url.pathname }${ url.search }${ newHash }`;
		window.history.pushState( {}, '', newUrl );
	};

	const handleExit = () => {
		if ( hasUnsavedChanges ) {
			setIsModalOpen( true );
		} else {
			approachExit();
		}
	};

	const buttonSize = 'compact';

	return (
		<div>
			{ isModalOpen && (
				<Modal
					title={ __( 'Confirm', 'fast-bundle' ) }
					onRequestClose={ () => setIsModalOpen( false ) }
					size="medium"
				>
					<VStack spacing={ 6 }>
						<Text size={ 16 }>
							{ __(
								'You have unsaved changes. Save before leaving, or discard them.',
								'fast-bundle'
							) }
						</Text>
						<HStack justify="end">
							<Button
								variant="secondary"
								isDestructive
								onClick={ approachExit }
							>
								{ __( 'Discard & Exit', 'fast-bundle' ) }
							</Button>
							<Button
								variant="primary"
								onClick={ () => {
									setOptionData( postData?.status );
									approachExit();
								} }
							>
								{ __( 'Save & Exit', 'fast-bundle' ) }
							</Button>
						</HStack>
					</VStack>
				</Modal>
			) }
			{ isTitleAlertOpen && (
				<Modal
					title={ __( 'Title Required', 'fast-bundle' ) }
					onRequestClose={ () => setIsTitleAlertOpen( false ) }
					size="small"
				>
					<VStack spacing={ 6 }>
						<Text size={ 16 }>
							{ __(
								'Please enter a title for this option set before saving.',
								'fast-bundle'
							) }
						</Text>
						<HStack justify="end">
							<Button
								variant="primary"
								onClick={ () => setIsTitleAlertOpen( false ) }
							>
								{ __( 'OK', 'fast-bundle' ) }
							</Button>
						</HStack>
					</VStack>
				</Modal>
			) }

			<Card
				isRounded={ false }
				size="small"
				style={ { top: 0, zIndex: 999, position: 'sticky' } }
			>
				<CardBody style={ { padding: 0 } }>
					<HStack spacing={ 6 } alignment="top">
						<HStack
							spacing={ 3 }
							wrap={ isMedium }
							expanded={ ! isMedium }
							alignment={ isMedium ? 'top' : 'center' }
						>
							<Button
								icon={ arrowUpLeft }
								iconSize={ 24 }
								onClick={ handleExit }
								label={ __(
									'Back to Option Set List',
									'fast-bundle'
								) }
								variant="link"
								style={ {
									padding: '0 16px',
									borderRight: '1px solid #0000001a',
									width: 64,
									height: 64,
								} }
								size={ buttonSize }
							/>
							<HStack
								spacing={ 3 }
								expanded={ false }
								wrap
								style={ {
									flex: 1,
									alignItems: 'center',
									padding: '10px 6px',
								} }
							>
								<TextControl
									__nextHasNoMarginBottom
									placeholder={ __(
										'Enter Option Set Name',
										'fast-bundle'
									) }
									value={ postData.title || '' }
									onChange={ ( value ) =>
										settingPostData( 'title', value )
									}
									style={ {
										minWidth: isMobile ? 156 : 250,
										maxWidth: isMobile ? 200 : 300,
										height: 32,
										minHeight: 30,
									} }
								/>
								<HStack
									spacing={ 3 }
									expanded={ false }
									justify="end"
									style={ {
										flexShrink: isMedium ? 1 : 0,
										marginRight: '15px',
										marginInlineStart: 'auto',
									} }
									wrap={ isMedium }
								>
									<ToggleGroupControl
										__nextHasNoMarginBottom
										hideLabelFromVision
										isBlock
										value={ postData?.status || 'draft' }
										onChange={ ( tab ) =>
											settingPostData( 'status', tab )
										}
										style={ { height: 32 } }
									>
										<ToggleGroupControlOption
											label="Draft"
											value="draft"
										/>
										<ToggleGroupControlOption
											label="Publish"
											value="publish"
										/>
									</ToggleGroupControl>
									<Button
										__next40pxDefaultSize
										variant="primary"
										onClick={ () =>
											setOptionData(
												postData?.status || 'draft'
											)
										}
										isBusy={ saving }
										style={ {
											minWidth: 85,
											justifyContent: 'center',
										} }
										size={ buttonSize }
									>
										{ hasUnsavedChanges ? (
											__( 'Save', 'fast-bundle' )
										) : (
											<>
												<Icon icon={ check } />
												{ __( 'Saved', 'fast-bundle' ) }
											</>
										) }
									</Button>
								</HStack>
							</HStack>
						</HStack>
					</HStack>
				</CardBody>
			</Card>

			<Canvas isLoading={ isLoading } />
			<Drawer />
		</div>
	);
};

export default Editor;
