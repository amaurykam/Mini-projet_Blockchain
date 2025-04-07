import { Card, Checkbox } from '@mui/material'
import React from 'react'

export default function Candidat(props) {

    return (
        <Card>
            <div className='candidat-container' onClick={(e) => props.handleChange(e, props.index)}>
                <div className='candidat-checkbox'>
                    <Checkbox checked={props.checked === props.index} onChange={(e) => props.handleChange(e, props.index)} />
                </div>
                <div className='candidat-infos'>
                    <div className='candidat-header'>
                        <div className='candidat-name'>Nom du candidat</div>
                    </div>
                    <div className='candidat-content'>
                        <div className='candidat-name'>{props.candidat.name}</div>
                    </div>
                </div>
            </div>
        </Card>
    )
}
