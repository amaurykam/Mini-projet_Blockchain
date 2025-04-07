import * as React from 'react';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
// import { TextField } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

export default function DatePicker({ value, onChange, label }) {
    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DateTimePicker
                label={label}
                value={value}
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
