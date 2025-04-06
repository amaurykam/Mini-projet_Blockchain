import React, { useEffect, useState } from "react";
import { Box, Typography, Button, Card, CardContent } from "@mui/material";
import RoundDetails from "./RoundDetails";

function ElectionRounds({ election, contract, candidatesContract, normalizedAccount, owner, onBack }) {
  const [rounds, setRounds] = useState([]);
  const [selectedRound, setSelectedRound] = useState(null);

  useEffect(() => {
    async function fetchRounds() {
      const currentRound = Number(election.currentRound);
      const roundsArray = [];

      for (let roundNumber = 1; roundNumber <= currentRound; roundNumber++) {
        const roundData = await contract.electionRounds(election.electionId, roundNumber);
        roundsArray.push({
          roundNumber,
          startDate: Number(roundData.startDate),
          endDate: Number(roundData.endDate),
          finalized: roundData.finalized,
          totalVotes: Number(roundData.totalVotes),
          winnerCandidateId: Number(roundData.winnerCandidateId),
        });
      }
      setRounds(roundsArray);
    }

    fetchRounds();
  }, [election, contract]);

  // Modification : Si le round n'est pas commencé, le décompte correspond au temps restant avant le début.
  const renderRoundStatus = (round) => {
    const now = Math.floor(Date.now() / 1000);
    let status = "";
    let timeRemaining = 0;
    if (now < round.startDate) {
      status = "Pas commencé";
      timeRemaining = round.startDate - now;
    } else if (now >= round.startDate && now <= round.endDate) {
      status = "Ouvert";
      timeRemaining = round.endDate - now;
    } else {
      status = "Fermé";
    }
    return { status, timeRemaining };
  };

  if (selectedRound) {
    return (
      <RoundDetails
        electionId={election.electionId}
        round={selectedRound}
        contract={contract} // contrat en écriture
        normalizedAccount={normalizedAccount}
        owner={owner}
        onBack={() => setSelectedRound(null)}
      />
    );
  }

  return (
    <Box sx={{ mt: 4 }}>
      <Button variant="outlined" onClick={onBack}>
        Retour aux élections
      </Button>
      <Typography variant="h5" sx={{ mt: 2 }}>
        Tours de l'élection #{election.electionId.toString()}
      </Typography>

      {rounds.map((round) => {
        const { status, timeRemaining } = renderRoundStatus(round);
        return (
          <Card key={round.roundNumber} sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6">Tour #{round.roundNumber}</Typography>
              <Typography>
                Date début : {new Date(round.startDate * 1000).toLocaleString()}
              </Typography>
              <Typography>
                Date fin : {new Date(round.endDate * 1000).toLocaleString()}
              </Typography>
              <Typography>Total votes : {round.totalVotes}</Typography>
              <Typography>Statut : {status}</Typography>
              {status === "Ouvert" && (
                <Typography>
                  Temps restant pour voter : {Math.floor(timeRemaining / 3600)}h{" "}
                  {Math.floor((timeRemaining % 3600) / 60)}m {timeRemaining % 60}s
                </Typography>
              )}
              {status === "Pas commencé" && (
                <Typography>
                  Temps avant le début : {Math.floor(timeRemaining / 3600)}h{" "}
                  {Math.floor((timeRemaining % 3600) / 60)}m {timeRemaining % 60}s
                </Typography>
              )}
              <Button
                sx={{ mt: 2 }}
                variant="contained"
                onClick={() => setSelectedRound(round)}
              >
                Voir les candidats et voter
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );
}

export default ElectionRounds;
