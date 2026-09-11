import icons from '@/utils/icons/index';
import {
	Button,
	Modal,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useState } from '@wordpress/element';

const TutorialModal = ( { label, modalTitle, videoUrl, variant = 'link' } ) => {
	const [ isModalOpen, setIsModalOpen ] = useState( false );

	return (
		<>
			<Button
				icon={ icons.youtube }
				iconSize={ 20 }
				variant={ variant }
				label={ label }
				onClick={ () => setIsModalOpen( true ) }
				style={ { textDecoration: 'none', outline: 'none' } }
			>
				{ label }
			</Button>

			{ isModalOpen && (
				<Modal
					__experimentalHideHeader
					title={ modalTitle }
					onRequestClose={ () => setIsModalOpen( false ) }
					size="large"
				>
					<VStack spacing={ 6 }>
						<iframe
							width="100%"
							height="500"
							src={ videoUrl }
							style={ { maxHeight: '80vh' } }
							title="YouTube video player"
							frameBorder="0"
							allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
							referrerPolicy="strict-origin-when-cross-origin"
							allowFullScreen
						></iframe>
					</VStack>
				</Modal>
			) }
		</>
	);
};

export default TutorialModal;
