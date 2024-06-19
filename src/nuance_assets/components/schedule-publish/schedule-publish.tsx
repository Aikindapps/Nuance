import React, { useState, useEffect } from 'react';
import DatePicker, { CalendarContainer } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Select, { SingleValue } from 'react-select';
import './_schedule-publish.scss';
import { icons, colors } from '../../shared/constants';

interface CustomDateTimePickerProps {
    onDateChange: (date: Date | null) => void;
    onTimeChange: (time: { hours: string, minutes: string }) => void;
    onAccessChange: (access: { value: string, label: string }) => void;
    initialAccess?: { value: string, label: string };
    isPremium?: boolean;
}

const CustomDateTimePicker: React.FC<CustomDateTimePickerProps> = ({
    onDateChange,
    onTimeChange,
    onAccessChange,
    initialAccess,
    isPremium = false
}) => {
    const currentDate = new Date();
    const [selectedDate, setSelectedDate] = useState<Date | null>(currentDate);
    const [selectedTime, setSelectedTime] = useState({ hours: currentDate.getHours().toString().padStart(2, '0'), minutes: currentDate.getMinutes().toString().padStart(2, '0') });
    const [selectedAccess, setSelectedAccess] = useState<SingleValue<{ value: string; label: string }> | null>(initialAccess ? { value: initialAccess.value, label: initialAccess.label } : null);

    const accessOptions = isPremium ?
        [
            { value: 'public', label: 'Public' }
        ]
        :
        [
            { value: 'members-only', label: 'Members only' },
            { value: 'public', label: 'Public' }
        ];



    const handleAccessChange = (newValue: SingleValue<{ value: string; label: string }>) => {
        setSelectedAccess(newValue);
        onAccessChange(newValue as { value: string, label: string });
    };


    const handleTimeChange = (type: 'hours' | 'minutes') => (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newTime = { ...selectedTime, [type]: e.target.value };
        const newDate = new Date(selectedDate!);
        newDate.setHours(parseInt(newTime.hours, 10));
        newDate.setMinutes(parseInt(newTime.minutes, 10));

        // If selected date is today and the selected time is in the past, set the time to the current time
        if (newDate < currentDate) {
            if (type === 'hours') {
                newTime.hours = currentDate.getHours().toString().padStart(2, '0');
            } else {
                newTime.minutes = currentDate.getMinutes().toString().padStart(2, '0');
            }
        }

        setSelectedTime(newTime);
        setSelectedDate(newDate);
        onTimeChange(newTime);
    };

    const CustomInput = ({ value, onClick }: { value?: string, onClick?: () => void }) => (
        <div className="custom-input" onClick={onClick}>
            {value || 'Select Date'}
            <div className="calendar-icon">
                <img src={icons.CALENDAR_ICON} alt="Calendar Icon" />
            </div>
        </div>
    );

    const CustomCalendarContainer = ({ className, children }: { className?: string, children?: React.ReactNode }) => {
        return (
            <div className={className}>
                <div className="react-datepicker__month-container">
                    {children}
                    <div className="custom-time-input">
                        <img src={icons.CLOCK_ICON} alt="Clock Icon" />
                        <select value={selectedTime.hours} onChange={handleTimeChange('hours')}>
                            {[...Array(24).keys()].map(hour => (
                                <option
                                    key={hour}
                                    value={hour.toString().padStart(2, '0')}
                                    disabled={selectedDate?.toDateString() === currentDate.toDateString() && hour < currentDate.getHours()}
                                >
                                    {hour.toString().padStart(2, '0')}
                                </option>
                            ))}
                        </select>
                        :
                        <select value={selectedTime.minutes} onChange={handleTimeChange('minutes')}>
                            {['00', '15', '30', '45'].map(minute => (
                                <option
                                    key={minute}
                                    value={minute}
                                    disabled={
                                        selectedDate?.toDateString() === currentDate.toDateString() &&
                                        parseInt(selectedTime.hours, 10) === currentDate.getHours() &&
                                        parseInt(minute, 10) < currentDate.getMinutes()
                                    }
                                >
                                    {minute}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
        );
    };

    useEffect(() => {
        onDateChange(selectedDate);
    }, [selectedDate, onDateChange]);

    return (
        <div className="custom-date-time-picker">
            <div className="form-group">
                <label className="edit-article-left-manage-title">PUBLISH {isPremium && " AND MINT "} MOMENT</label>
                <div className="date-time-picker">
                    <DatePicker
                        selected={selectedDate}
                        onChange={(date) => setSelectedDate(date)}
                        minDate={currentDate}
                        dateFormat="dd-MM-yyyy HH:mm"
                        customInput={<CustomInput />}
                        calendarContainer={CustomCalendarContainer}
                        popperClassName="custom-calendar"
                        calendarClassName="custom-calendar"
                    />
                </div>
            </div>
            <div className="form-group">
                <label className="edit-article-left-manage-title">ACCESS</label>
                <Select
                    value={isPremium ? accessOptions[0] : selectedAccess}
                    onChange={handleAccessChange}
                    options={accessOptions}
                    className="access-select"
                />
            </div>
        </div>
    );
};

export default CustomDateTimePicker;
