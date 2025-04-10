import React, { useEffect, useState } from "react";
import { Box, Typography, Button, Card, CardContent } from "@mui/material";
import RoundDetails from "./Round/RoundDetails";
import ElectionResult from "./ElectionResult";
import dayjs from "dayjs";

function ElectionRounds({ election, contract, candidatesContract, normalizedAccount, owner, onBack }) {
  const [rounds, setRounds] = useState([]);
  const [selectedRound, setSelectedRound] = useState(null);
  const [roundStatuses, setRoundStatuses] = useState({});
  const [globalElectionStatus, setGlobalElectionStatus] = useState("Chargement...");
  const [showResult, setShowResult] = useState(false);

  // Récupération des rounds de l'élection
  useEffect(() => {
    async function fetchRounds() {
      try {
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
      } catch (error) {
        console.error("❌ Erreur lors de la récupération des rounds :", error);
      }
    }
    fetchRounds();
  }, [election, contract]);

  // Mise à jour périodique du statut de chaque round avec la fonction getRoundStatusVerbose
  useEffect(() => {
    if (!rounds.length) return;

    const statusMap = {
      0: "Pas commencé",
      1: "Ouvert",
      2: "Terminé",
    };

    const interval = setInterval(async () => {
      const statuses = {};
      let hasOpen = false;
      let allEnded = true;
      let allNotStarted = true;

      for (const round of rounds) {
        try {
          // Appel de la fonction verbose du contrat
          const statusTuple = await contract.getRoundStatusVerbose(election.electionId, round.roundNumber);
          const statusCode = Number(statusTuple[0]);
          const explanation = statusTuple[1];
          console.log(
            `🔍 Round #${round.roundNumber} - statut brut: ${statusCode} | explication: ${explanation}`
          );
          const status = statusMap[statusCode] || "Inconnu";

          if (status === "Ouvert") {
            hasOpen = true;
            allEnded = false;
            allNotStarted = false;
          } else if (status === "Terminé") {
            allNotStarted = false;
          } else if (status === "Pas commencé") {
            allEnded = false;
          }
          statuses[round.roundNumber] = { status, explanation };
        } catch (err) {
          console.error(`❌ Erreur statut round ${round.roundNumber}:`, err);
        }
      }
      setRoundStatuses(statuses);
      if (hasOpen) setGlobalElectionStatus("Ouverte");
      else if (allNotStarted) setGlobalElectionStatus("Pas commencée");
      else if (allEnded) setGlobalElectionStatus("Terminée");
    }, 1000);

    return () => clearInterval(interval);
  }, [rounds, contract, election.electionId]);

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

  // Si l'utilisateur souhaite voir le résultat final, affiche le composant dédié
  if (showResult) {
    return (
      <ElectionResult
        election={election}
        contract={contract}
        onBack={() => setShowResult(false)}
      />
    );
  }

  return (
    <Box sx={{ mt: 4 }}>
      <Button variant="outlined" onClick={onBack}>
        Retour aux élections
      </Button>
      <Typography variant="h5" sx={{ mt: 2 }}>
        Tours de l'élection #{election.electionId}
      </Typography>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Statut de l'élection : {globalElectionStatus}
      </Typography>

      {rounds.map((round) => {
        const roundStatus = roundStatuses[round.roundNumber]?.status || "Chargement...";
        return (
          <Card key={round.roundNumber} sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6">Tour #{round.roundNumber}</Typography>
              <Typography>
                Date début : {dayjs(round.startDate * 1000).format("DD-MM-YYYY HH:mm")}
              </Typography>
              <Typography>
                Date fin : {dayjs(round.endDate * 1000).format("DD-MM-YYYY HH:mm")}
              </Typography>
              <Typography>Total votes : {round.totalVotes}</Typography>
              <Typography>Statut : {roundStatus}</Typography>
              <Button
                sx={{ mt: 2 }}
                variant="contained"
                onClick={() => setSelectedRound(round)}
              >
                {roundStatus === "Terminé"
                  ? "Voir les résultats du tour"
                  : "Voir les candidats et voter"}
              </Button>
            </CardContent>
          </Card>
        );
      })}

      {/* Bouton pour voir le résultat final de l'élection */}
      <Box sx={{ mt: 4 }}>
        <Button
          variant="contained"
          onClick={() => setShowResult(true)}
          disabled={globalElectionStatus !== "Terminée"}
        >
          Voir résultat final
        </Button>
        {globalElectionStatus !== "Terminée" && (
          <Typography variant="caption" sx={{ ml: 2 }}>
            Le résultat final sera affiché une fois tous les rounds terminés.
          </Typography>
        )}
      </Box>
    </Box>
  );
}

export default ElectionRounds;