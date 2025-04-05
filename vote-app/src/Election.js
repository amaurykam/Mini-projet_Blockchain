import React, { use, useEffect, useState } from 'react'
import Candidat from './Candidat';
import { Button, Dialog } from '@mui/material';
import Tour from './Tour';
import { CrueltyFree } from '@mui/icons-material';

export default function Election(props) {

    const [checked, setChecked] = useState(null);
    const [isValidating, setIsValidating] = useState(false);
    const [currentTour, setCurrentTour] = useState(0);
    const [tours, setTours] = useState([{
        id: 1, date: (new Date().getFullYear()), totalVotes: 10, candidates: [{ id: 1, name: 'Jean Dupont', votes: 3 }, { id: 2, name: 'Marie Curie', votes: 2 }, { id: 3, name: 'Albert Einstein', votes: 1 },
        { id: 4, name: 'Isaac Newton', votes: 0 }, { id: 5, name: 'Galileo Galilei', votes: 1 }, { id: 6, name: 'Charles Darwin', votes: 1 }, { id: 7, name: 'Stephen Hawking', votes: 1 }, { id: 8, name: 'Nikola Tesla', votes: 1 }, { id: 9, name: 'Ada Lovelace', votes: 0 }, { id: 10, name: 'Alan Turing', votes: 0 }
        ]
    }]);
    const [hasVoted, setHasVoted] = useState(false);



    const handleChange = (event, candidatIndex) => {
        if (candidatIndex === checked) {
            setChecked(null);
            return;
        }
        event.stopPropagation();
        setChecked(candidatIndex);
    }

    const handleVote = () => {
        setTours((prevTours) => {
            return prevTours.map((tour, index) => {
                if (index === currentTour) {
                    return {
                        ...tour,
                        totalVotes: tour.totalVotes + 1,
                        candidates: tour.candidates.map((candidat, index) => {
                            if (index === checked) {
                                return { ...candidat, votes: candidat.votes + 1 };
                            }
                            return candidat;
                        })

                    };
                }
                return tour;
            });
        })
        setIsValidating(false);
    }

    const handleTourFinish = () => {
        let newTours = [...tours];
        let newCandidates = [];
        const maxVotes = Math.max(...tours[currentTour].candidates.map(c => c.votes));
        const isMajority = maxVotes / tours[currentTour].totalVotes > 0.5;
        const topCandidates = tours[currentTour].candidates.filter(c => c.votes === maxVotes);
        newCandidates = [...topCandidates]
        if (topCandidates.length < 2 && currentTour < 1 && !(isMajority)) {
            const remainingCandidates = tours[currentTour].candidates.filter(c => c.votes < maxVotes);
            const secondMaxVotes = Math.max(...remainingCandidates.map(c => c.votes));
            const secondTopCandidates = remainingCandidates.filter(c => c.votes === secondMaxVotes);
            newCandidates = newCandidates.concat(secondTopCandidates);
        }
        newTours[currentTour].winners = [...newCandidates]
        if (currentTour < 2) {
            newTours.push({
                id: tours[currentTour].id + 1,
                date: new Date().getFullYear(),
                candidates: [...newCandidates.map(c => ({ ...c, votes: 0 }))],
                totalVotes: 0
            });
        }
        setCurrentTour(currentTour + 1);
        setTours(newTours);
        setChecked(null);
    }

    useEffect(() => {
        console.log(tours)
        console.log(currentTour)
    }, [tours, currentTour]);

    return (
        <div className='election-container'>
            {props.tab === 0 ?
                hasVoted ?
                    <div className='has-voted'>
                        <div className='has-voted-title'>Vous avez déjà voté pour ce tour</div>
                    </div>
                    : currentTour > 2 || tours[currentTour].candidates.length === 1 ?
                        <div className='votes-finished'>
                            <div className='votes-finished-title'>Les votes sont terminés</div>
                        </div> :
                        <div className='election-vote'>
                            <div className='election-liste'>
                                {tours[currentTour].candidates.map((candidat, index) => {
                                    return <Candidat key={candidat.id} candidat={candidat} handleChange={handleChange} checked={checked} index={index} />;
                                })}
                            </div>
                            <div className='election-footer'>
                                <Button variant="contained" disabled={checked === null} sx={{ backgroundColor: '#3e4f6f' }} onClick={() => setIsValidating(true)}>Valider le vote</Button>
                                <Button variant="contained" sx={{ backgroundColor: '#3e4f6f' }} onClick={handleTourFinish}>Finir tour</Button>
                            </div>
                            {isValidating &&
                                <Dialog open={isValidating} onClose={() => setIsValidating(false)}>
                                    <div className='dialog-content'>
                                        <div className='dialog-header'>
                                            <div className='dialog-title'>Validation du vote</div>
                                            <div>{`Vous allez voter pour le candidat ${tours[currentTour].candidates[checked].name}`}</div>
                                        </div>
                                        <div className='buttons-container'>
                                            <Button variant="contained" sx={{ backgroundColor: '#3e4f6f' }} onClick={handleVote}>Confirmer</Button>
                                            <Button variant="contained" sx={{ backgroundColor: '#3e4f6f' }} onClick={() => setIsValidating(false)}>Annuler</Button>

                                        </div>
                                    </div>
                                </Dialog>
                            }
                        </div> :

                <div className='election-statistics'>
                    {tours.map((tour, index) => {
                        if (index === currentTour) return null;
                        return (
                            <Tour key={tour.id} tour={tour} index={index} />
                        )
                    })}
                </div>
            }
        </div>
    )
}
