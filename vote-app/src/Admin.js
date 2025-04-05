import { Button, Snackbar, TextField } from '@mui/material'
import React, { use, useEffect, useState } from 'react'

export default function Admin() {
    const [state, setState] = useState({
        open: false,
        vertical: 'top',
        horizontal: 'center',
    });
    const [message, setMessage] = useState('');
    const [candidat, setCandidat] = useState('');
    const [admin, setAdmin] = useState('');
    const [newOwner, setNewOwner] = useState('');

    useEffect(() => {
        if (message && !state.open) {
            setState({ ...state, open: true });
        }
    }, [message, state]);

    const { vertical, horizontal, open } = state;

    const handleClose = () => {
        setState({ ...state, open: false });
        setMessage('')
    };

    const handleCanddidateAdd = () => {
        if (candidat === '') {
            setState({ ...state, open: true });
            setMessage('Veuillez entrer un nom de candidat valide');
        }
        else {
            // Call the add candidate function here
            setCandidat('');
            setMessage('Candidat ajouté avec succès');
        }
    }

    const handleAdminAdd = () => {
        if (admin === '') {
            setState({ ...state, open: true });
            setMessage('Veuillez entrer une adresse valide');
        }
        else {
            // Call the add admin function here
            setAdmin('');
            setMessage('Administrateur ajouté avec succès');
        }
    }

    const handleTransferOwnership = () => {
        if (newOwner === '') {
            setState({ ...state, open: true });
            setMessage('Veuillez entrer une adresse valide');
        }
        else {
            // Call the transfer ownership function here
            setNewOwner('');
            setMessage('Propriété transférée avec succès');
        }
    }

    return (

        <div className='admin-container'>
            <div className='mini-form'>
                <div className='header'>
                    Ajouter un candidat
                </div>
                <TextField value={candidat} onChange={(e) => setCandidat(e.target.value)} size="large" label="Nom du candidat" variant="outlined" sx={{ width: '100%' }} />

                <div className='button'>
                    <Button size="large" variant="contained" sx={{ backgroundColor: '#3e4f6f' }} onClick={handleCanddidateAdd}>Ajouter</Button>
                </div>
            </div>
            <div className='mini-form'>
                <div className='header'>
                    Ajouter un administrateur
                </div>
                <TextField value={admin} onChange={(e) => setAdmin(e.target.value)} size="large" label="Adresse de l'administrateur" variant="outlined" sx={{ width: '100%' }} />

                <div className='button'>
                    <Button size="large" variant="contained" sx={{ backgroundColor: '#3e4f6f' }} onClick={handleAdminAdd}>Ajouter</Button>
                </div>

            </div >
            <div className='mini-form'>
                <div className='header'>
                    Transférer la propriété du contrat
                </div>

                <TextField value={newOwner} onChange={(e) => setNewOwner(e.target.value)} size="large" label="Adresse du nouveau propriétaire" variant="outlined" sx={{ width: '100%' }} />
                <div className='button'>
                    <Button size="large" variant="contained" sx={{ backgroundColor: '#3e4f6f' }} onClick={handleTransferOwnership}>Transférer</Button>
                </div>
            </div >
            <Snackbar
                anchorOrigin={{ vertical, horizontal }}
                open={open}
                onClose={handleClose}
                message={message}
                key={vertical + horizontal}
            />

        </div >
    )
}
