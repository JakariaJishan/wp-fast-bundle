import { useEffect, useRef } from '@wordpress/element';
const DatePicker = ( props ) => {
	const {
		placeholder,
		dateFormat,
		onChange,
		defVal,
		maxDate,
		minDate,
		disableDays,
		disableDates,
		disableSpecificDates,
		disableToday,
		disableNextDays,
		padding,
		width,
		minWidth,
		maxWidth,
		style,
		resetValueOnChange,
	} = props;
	const dateInputRef = useRef();

	useEffect( () => {
		if ( dateInputRef.current ) {
			if ( padding ) {
				dateInputRef.current.style.setProperty(
					'padding',
					padding,
					'important'
				);
			}
			if ( width ) {
				dateInputRef.current.style.setProperty(
					'width',
					width,
					'important'
				);
			}
			if ( minWidth ) {
				dateInputRef.current.style.setProperty(
					'min-width',
					minWidth,
					'important'
				);
			}
			if ( maxWidth ) {
				dateInputRef.current.style.setProperty(
					'max-width',
					maxWidth,
					'important'
				);
			}
		}
	}, [] );

	useEffect( () => {
		if ( dateInputRef.current ) {
			dateInputRef.current.setAttribute( 'data-initdate', 'no' );
		}
		const handleChange = ( e ) => {
			if ( onChange ) {
				onChange( e.target.value );
				if ( dateInputRef.current && resetValueOnChange ) {
					dateInputRef.current.value = '';
				}
			}
		};

		const input = dateInputRef.current;
		input.addEventListener( 'change', handleChange );

		return () => {
			input.removeEventListener( 'change', handleChange );
		};
	}, [
		placeholder,
		dateFormat,
		onChange,
		defVal,
		maxDate,
		minDate,
		disableDays,
		disableDates,
		disableSpecificDates,
		disableToday,
		disableNextDays,
		resetValueOnChange,
	] );

	return (
		<input
			type="text"
			readOnly
			ref={ dateInputRef }
			className="fbnd-date-input fbnd-custom-date-input fbnd-w-full fbnd-input fbnd-bc-border-primary fbnd-cursor-pointer fbnd-input"
			placeholder={ placeholder || dateFormat || 'DD/MM/YYYY' }
			data-format={ dateFormat }
			data-defval={ defVal || '' }
			data-initdate={ 'no' }
			style={ {
				minHeight: '32px',
				// borderRadius: 0,
				// backgroundColor: 'transparent',
				...style,
			} }
			data-max-date={ maxDate || '' }
			data-min-date={ minDate || '' }
			data-disabled-weekdays={ JSON.stringify( disableDays || [] ) }
			data-disabled-date={ JSON.stringify( disableDates || [] ) }
			data-disabled-specdates={ JSON.stringify(
				disableSpecificDates || []
			) }
			data-disable-today={ disableToday ?? false }
			data-disable-next-days={ disableNextDays ?? 0 }
			{ ...( defVal ? { value: defVal } : {} ) }
		/>
	);
};

export default DatePicker;
