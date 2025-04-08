import * as React from 'react';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
// import { TextField } from '@mui/material';
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
                format='DD/MM/YYYY HH:mm'
                ampm={false}
                slotProps={{
                    textField: {
                        fullWidth: true,
                        InputProps: {
                            sx: {
                                '& .MuiSvgIcon-root': {
                                    color: 'white', // 🎨 tu changes la couleur ici !
                                },
                            },
                        },
                    },
                }}
            />
        </LocalizationProvider>
    );
}
