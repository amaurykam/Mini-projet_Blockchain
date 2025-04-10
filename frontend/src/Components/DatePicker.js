import * as React from 'react';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
dayjs.extend(utc);
dayjs.extend(timezone);

export default function DatePicker({ value, onChange, label, minDateTime }) {
    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DateTimePicker
                label={label}
                value={value}
                minDateTime={minDateTime ? minDateTime : dayjs().tz('Europe/Paris')}
                onChange={onChange}
                // Format avec des tirets pour la date et en 24h
                format="DD-MM-YYYY HH:mm"
                ampm={false}
                slotProps={{
                    textField: {
                        fullWidth: true,
                        InputProps: {
                            sx: {
                                '& .MuiSvgIcon-root': {
                                    color: 'white', // 🎨 vous pouvez changer la couleur ici
                                },
                            },
                        },
                    },
                }}
            />
        </LocalizationProvider>
    );
}
