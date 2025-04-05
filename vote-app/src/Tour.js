import { Divider, IconButton, LinearProgress } from '@mui/material';
import React, { useEffect, useState } from 'react'
import { KeyboardArrowUp, KeyboardArrowDown } from '@mui/icons-material';

export default function Tour(props) {
    const [viewDetails, setViewDetails] = useState(false);

    useEffect(() => {
        console.log(props.tour)
    }, [props.tour]);

    return (
        <div className={`tour-container ${viewDetails ? '' : ''}`} >
            <div className='tour-header'>
                <div className='tour-name'>{`Résultats - TOUR ${parseInt(props.index) + 1}`}</div>
                <div className='tour-date'>{props.tour.date}</div>
            </div>
            {/* {viewDetails ? */}
            <div className={`tour-candidates ${viewDetails ? 'show' : ''}`}>
                {props.tour.candidates.map((candidat, index) => {
                    return <div key={candidat.id} className='tour-candidate-container'>

                        <div className='tour-candidate detailed'>
                            <div className='tour-candidate-name'>
                                {candidat.name}
                            </div>
                            <LinearProgress variant="determinate" value={(candidat.votes / props.tour.totalVotes) * 100} sx={{ width: '100%' }} />
                            <div className='number'>
                                {Math.round((candidat.votes / props.tour.totalVotes) * 100)} %
                            </div>
                        </div>
                        {index < (props.tour.candidates.length - 1) && <Divider sx={{ borderColor: '#7a7a7a' }}></Divider>}
                    </div>
                        ;
                })}
            </div>
            {/*: */}
            <div className={`tour-winers ${viewDetails ? '' : 'show'}`}>
                {props.tour.winners?.map((candidat, index) => {
                    return (<div key={candidat.id} >

                        <div key={candidat.id} className='tour-candidate'>
                            <div className='tour-candidate-name'>
                                Candidat : {candidat.name}
                            </div>
                            <div className='tour-candidate-votes'>
                                <div className='label'>
                                    Nombre de voix :
                                </div>
                                <LinearProgress variant="determinate" value={(candidat.votes / props.tour.totalVotes) * 100} sx={{ width: '100%' }} />
                                <div className='number'>
                                    {Math.round((candidat.votes / props.tour.totalVotes) * 100)} %
                                </div>
                            </div>
                        </div>
                        {/* {index < (props.tour.winners.length - 1) && <Divider sx={{ borderColor: '#7a7a7a' }}></Divider>} */}

                    </div>
                    )
                        ;
                })}
            </div>
            {/* } */}
            <div className='tour-footer'>
                <IconButton onClick={() => setViewDetails(!viewDetails)}>
                    {!viewDetails ? <KeyboardArrowDown sx={{ color: '#fff' }} />
                        :
                        <KeyboardArrowUp sx={{ color: '#fff' }} />}
                </IconButton>

            </div>
        </div >
    )
}
