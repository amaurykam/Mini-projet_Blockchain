import React, { useEffect, useState } from "react";
import { Box, Typography, Button, Card, CardContent } from "@mui/material";
import RoundDetails from "./Round/RoundDetails";

function ElectionRounds({ election, contract, candidatesContract, normalizedAccount, owner, onBack }) {
  const [rounds, setRounds] = useState([]);
  const [selectedRound, setSelectedRound] = useState(null);
  const [roundStatuses, setRoundStatuses] = useState({});
  const [globalElectionStatus, setGlobalElectionStatus] = useState("Chargement...");

  // Chargement des rounds
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

  // Mise à jour automatique des statuts
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const statuses = {};

      let atLeastOneOpen = false;
      let allClosed = true;
      let allNotStarted = true;

      rounds.forEach((round) => {
        let status = "";
        let timeRemaining = 0;

        if (now < round.startDate) {
          status = "Pas commencé";
          timeRemaining = round.startDate - now;
          allClosed = false;
        } else if (now >= round.startDate && now <= round.endDate) {
          status = "Ouvert";
          timeRemaining = round.endDate - now;
          atLeastOneOpen = true;
          allClosed = false;
          allNotStarted = false;
        } else {
          status = "Fermé";
          allNotStarted = false;
        }

        statuses[round.roundNumber] = { status, timeRemaining };
      });

      if (atLeastOneOpen) {
        setGlobalElectionStatus("Ouverte");
      } else if (allNotStarted) {
        setGlobalElectionStatus("Pas commencée");
      } else if (allClosed) {
        setGlobalElectionStatus("Terminée");
      }

      setRoundStatuses(statuses);
    }, 1000);

    return () => clearInterval(interval);
  }, [rounds]);

  // Affichage d’un round sélectionné
  if (selectedRound) {
    return (
      <RoundDetails
        electionId={election.electionId}
        round={selectedRound}
        contract={contract}
        normalizedAccount={normalizedAccount}
        owner={owner}
        onBack={() => setSelectedRound(null)}
      />
    );
  }

  // Affichage des cards de tours
  return (
    <Box sx={{ mt: 4 }}>
      <Button variant="outlined" onClick={onBack}>
        Retour aux élections
      </Button>

      <Typography variant="h5" sx={{ mt: 2 }}>
        Tours de l'élection #{election.electionId.toString()}
      </Typography>

      <Typography variant="h6" sx={{ mb: 2 }}>
        Statut de l'élection : {globalElectionStatus}
      </Typography>

      {rounds.map((round) => {
        const { status, timeRemaining } = roundStatuses[round.roundNumber] || {
          status: "Chargement...",
          timeRemaining: 0,
        };

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
                {status !== "Ended" ? "Voir les candidats et voter" : "Voir les statistiques du tour"}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );
}

export default ElectionRounds;
