import React, { useEffect, useState } from "react";
import { Box, Typography, Button, Card, CardContent, LinearProgress, Divider, IconButton } from "@mui/material";
// import dayjs from "dayjs";
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';

function ElectionResult({ election, contract, normalizedAccount, owner, onBack }) {
  const [globalWinner, setGlobalWinner] = useState(null);
  const [globalWinnerDetails, setGlobalWinnerDetails] = useState(null);
  const [roundDetails, setRoundDetails] = useState([]);
  const [isRoundsDetailsVisible, setIsRoundsDetailsVisible] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleArrowClick = (index) => {
    const newVisibility = [...isRoundsDetailsVisible];
    newVisibility[index] = !newVisibility[index];
    setIsRoundsDetailsVisible(newVisibility);
  }

  useEffect(() => {
    async function fetchData() {
      try {
        // Récupération du gagnant global de l'élection
        const winnerId = await contract.getElectionResult(election.electionId);
        const parsedWinner = Number(winnerId);
        setGlobalWinner(parsedWinner);
        if (parsedWinner !== 0) {
          // On suppose que le mapping candidates renvoie un objet avec firstName, lastName et politicalParty.
          const candidate = await contract.candidates(parsedWinner);
          setGlobalWinnerDetails(candidate);
        }

        // On suppose que election.currentRound indique le nombre total de rounds
        const currentRound = Number(election.currentRound);
        const roundsArray = [];

        for (let roundNumber = 1; roundNumber <= currentRound; roundNumber++) {
          try {
            // Récupérer les résultats bruts du round
            // getRoundResults retourne un tuple : 
            // [totalVotes, candidateIds, votesPerCandidate, startDate, endDate]
            const [totalVotes, candidateIds, votesPerCandidate] =
              await contract.getRoundResults(election.electionId, roundNumber);
            const totalVotesNum = Number(totalVotes);

            // Récupérer le nombre total d'inscrits pour ce round (fonction du contrat)
            const totalRegistered = Number(await contract.getRegisteredVotersCount());
            // Récupérer le nombre de votes blancs pour ce round (supposé être indexé sous l'ID 0)
            const whiteVotes = Number(await contract.roundCandidateVotes(election.electionId, roundNumber, 0));
            const votesExpressed = totalVotesNum - whiteVotes;
            const absent = Math.max(totalRegistered - totalVotesNum, 0);

            // Récupérer les détails pour les candidats ayant voté (hors vote blanc)
            const candidateVotes = [];
            for (let i = 0; i < candidateIds.length; i++) {
              const cid = Number(candidateIds[i]);
              if (cid === 0) continue; // vote blanc traité séparément
              const cand = await contract.candidates(cid);
              candidateVotes.push({
                id: cid,
                name: `${cand.firstName} ${cand.lastName}`,
                politicalParty: cand.politicalParty,
                votes: Number(votesPerCandidate[i]),
              });
            }

            // Pour les rounds qui ne sont pas le dernier round, récupérer la liste
            // des candidats qualifiés pour le tour suivant.
            let qualifiedCandidates = [];
            if (roundNumber < currentRound) {
              try {
                const nextRoundData = await contract.electionRounds(election.electionId, roundNumber + 1);
                const candidateIds = await contract.getCandidateIdsForRound(election.electionId, roundNumber + 1);
                console.log(nextRoundData)
                const qualifiedIds = candidateIds
                  .map(id => Number(id))
                  .filter(id => id !== 0);
                qualifiedCandidates = await Promise.all(
                  qualifiedIds.map(async (cid) => {
                    const cand = await contract.candidates(cid);
                    console.log(cand)
                    return {
                      id: cid,
                      name: `${cand.firstName} ${cand.lastName}`,
                      politicalParty: cand.politicalParty,
                      votes: Number(candidateVotes.find(v => v.id === cid)?.votes ?? 0),
                    };
                  })
                );
              } catch (err) {
                console.error(`Erreur lors de la récupération des candidats qualifiés pour le round ${roundNumber + 1}:`, err);
              }
            }

            roundsArray.push({
              roundNumber,
              totalRegistered,
              whiteVotes,
              totalVotes: totalVotesNum,
              votesExpressed,
              absent,
              candidateVotes,
              qualifiedCandidates, // candidates qualifiés pour le tour suivant (si applicable)
            });
          } catch (roundError) {
            console.error(`Erreur lors de la récupération des résultats du round ${roundNumber}:`, roundError);
          }
        }
        setRoundDetails(roundsArray);
        setIsRoundsDetailsVisible(roundsArray.map(() => false)); // Initialiser la visibilité de chaque round à faux
      } catch (err) {
        console.error("Erreur lors de la récupération des résultats détaillés :", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [contract, election.electionId, election.currentRound]);

  return (
    <Box sx={{ mt: 4 }}>
      <Button variant="outlined" onClick={onBack}>
        Retour
      </Button>
      <Typography variant="h5" sx={{ mt: 2 }}>
        Résultat de l'élection #{election.electionId}
      </Typography>

      {loading ? (
        <Typography>Chargement des résultats...</Typography>
      ) : (
        <>
          {/* SECTION : Résultat de l'élection et statistiques cumulées */}
          <Box sx={{ mt: 2, p: 2, border: "1px solid #ccc", borderRadius: 2 }}>
            <Typography variant="h6">Gagnant :</Typography>
            <Typography variant="body1" sx={{ ml: 2 }}>
              {globalWinner === 0
                ? "Vote blanc"
                : globalWinnerDetails
                  ? `${globalWinnerDetails.firstName} ${globalWinnerDetails.lastName} (${globalWinnerDetails.politicalParty})`
                  : `Candidat ID ${globalWinner}`}
            </Typography>
          </Box>

          {/* SECTION : Résultats par tour */}
          <Box sx={{ mt: 4 }}>
            <Typography variant="h5">Résultats par tour</Typography>
            {roundDetails.length > 0 ? (
              roundDetails.map((round, roundIndex) => (
                <Card key={round.roundNumber} sx={{ mt: 2 }}>
                  <CardContent sx={{ transitionDuration: '0.3s' }}>
                    <Typography variant="h6">Tour #{round.roundNumber}</Typography>
                    <ul className="list-stats">
                      <li>
                        <Typography>👥 Nombre d’inscrits : </Typography>
                        <Typography className="value"> {round.totalRegistered}  </Typography>
                      </li>
                      <Divider></Divider>
                      <li>
                        <Typography>
                          ⚪ Votes blancs :
                        </Typography>
                        <Typography className="value">
                          {round.whiteVotes}
                        </Typography>
                      </li>
                      <Divider></Divider>
                      <li>
                        <Typography>
                          ❌ Absents :
                        </Typography>
                        <Typography className="value">
                          {round.absent}
                        </Typography>
                      </li>
                      <Divider></Divider>
                      <li>
                        <Typography>
                          ✅ Total des votes :
                        </Typography>
                        <Typography className="value">
                          {round.totalVotes}
                        </Typography>
                      </li>
                      <Divider></Divider>
                      <li>
                        <Typography>
                          📈 Votes exprimés (hors blancs) :
                        </Typography>
                        <Typography className="value">
                          {round.votesExpressed}
                        </Typography>
                      </li>
                    </ul>
                    {/* Si ce round n'est pas le dernier, afficher les candidats qualifiés pour le tour suivant */}
                    <Typography variant="subtitle1">
                      🗳️ Votes par candidat :
                    </Typography>
                    {round.qualifiedCandidates && round.qualifiedCandidates.length > 0 ? (
                      <Box sx={{ mt: 2 }}>
                        {/* <Typography variant="subtitle1">
                          🔜 Candidats qualifiés pour le tour suivant :
                        </Typography> */}
                        {round.qualifiedCandidates.map((qc) => (
                          <div key={qc.id} className='tour-candidate-container'>
                            <div className='tour-candidate detailed'>
                              <div className='tour-candidate-name'>
                                <Typography key={qc.id}>
                                  {qc.name} : {qc.votes ?? 0} vote(s)
                                </Typography>
                              </div>
                              <LinearProgress variant="determinate" value={(qc.votes / round.totalVotes) * 100} sx={{ width: '100%' }} />
                              <div className='number'>
                                {Math.round((qc.votes / round.totalVotes) * 100)} %
                              </div>
                            </div>
                            <Divider sx={{ borderColor: '#7a7a7a' }}></Divider>
                          </div>
                        ))}
                      </Box>
                    ) :
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle1">
                          {isRoundsDetailsVisible[roundIndex] ? "Votes par candidats :" : "Gagnant du tour et de l'élection"}
                        </Typography>
                        <div className='tour-candidate-container'>
                          <div className='tour-candidate detailed'>
                            <div className='tour-candidate-name'>
                              <Typography >
                                {globalWinner === 0
                                  ? "Vote blanc"
                                  : globalWinnerDetails
                                    ? `${globalWinnerDetails.firstName} ${globalWinnerDetails.lastName} (${globalWinnerDetails.politicalParty})`
                                    : `Candidat ID ${globalWinner}`} : {round.candidateVotes.find(c => c.id === globalWinner)?.votes ?? 0} vote(s)
                                {/* {globalWinner.name} : {globalWinner.votes ?? 0} vote(s) */}
                              </Typography>
                            </div>
                            <LinearProgress variant="determinate" value={(round.candidateVotes.find(c => c.id === globalWinner).votes / round.totalVotes) * 100} sx={{ width: '100%' }} />
                            <div className='number'>
                              {Math.round((round.candidateVotes.find(c => c.id === globalWinner).votes / round.totalVotes) * 100)} %
                            </div>
                          </div>
                        </div>
                        <Divider sx={{ borderColor: '#7a7a7a' }}></Divider>
                      </Box>
                    }

                    {isRoundsDetailsVisible[roundIndex] && <Box sx={{ mt: 2 }}>
                      {round.candidateVotes.map((cv, index) => {
                        if (round.qualifiedCandidates && round.qualifiedCandidates.length > 0 && round.qualifiedCandidates.some(c => c.id === cv.id)) return null;
                        if (roundIndex === roundDetails.length - 1 && cv.id === globalWinner) return null; // Ne pas afficher le gagnant du tour si c'est le dernier round
                        return (
                          <div key={cv.id} className='tour-candidate-container'>
                            <div className='tour-candidate detailed'>
                              <div className='tour-candidate-name'>
                                <Typography key={cv.id}>
                                  {cv.name} : {cv.votes ?? 0} vote(s)
                                </Typography>
                              </div>
                              <LinearProgress variant="determinate" value={(cv.votes / round.totalVotes) * 100} sx={{ width: '100%' }} />
                              <div className='number'>
                                {Math.round((cv.votes / round.totalVotes) * 100)} %
                              </div>
                            </div>
                            <Divider sx={{ borderColor: '#7a7a7a' }}></Divider>
                          </div>
                        )
                      })}
                      <div className='tour-candidate-container'>
                        <div className='tour-candidate detailed'>
                          <div className='tour-candidate-name'>
                            <Typography>
                              Vote Blanc : {round.whiteVotes} vote(s)
                            </Typography>
                          </div>
                          <LinearProgress variant="determinate" value={(round.whiteVotes / round.totalVotes) * 100} sx={{ width: '100%' }} />
                          <div className='number'>
                            {Math.round((round.whiteVotes / round.totalVotes) * 100)} %
                          </div>
                        </div>
                      </div>
                    </Box>}

                    <IconButton>
                      {!isRoundsDetailsVisible[roundIndex] ? <KeyboardArrowDown color="pimary" onClick={() => handleArrowClick(roundIndex)} /> :
                        <KeyboardArrowUp color="pimary" onClick={() => handleArrowClick(roundIndex)} />}
                    </IconButton>

                  </CardContent>
                </Card>
              ))
            ) : (
              <Typography>Aucun résultat de tour disponible.</Typography>
            )}
          </Box>
        </>
      )}
    </Box>
  );
}

export default ElectionResult;
