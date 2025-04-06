import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";

function RoundDetails({ electionId, round, contract, normalizedAccount, owner, onBack }) {
  const [candidates, setCandidates] = useState([]);
  const [isRoundActive, setIsRoundActive] = useState(false);
  const [isRoundOver, setIsRoundOver] = useState(false);
  const [results, setResults] = useState(null);
  const [statusInfo, setStatusInfo] = useState({ status: "", timeRemaining: 0 });

  // Debug : Afficher round.startDate et le timestamp actuel
  useEffect(() => {
    console.log("round.startDate:", round.startDate);
    console.log("Timestamp actuel:", Math.floor(Date.now() / 1000));
  }, [round]);

  useEffect(() => {
    async function fetchData() {
      try {
        const now = Math.floor(Date.now() / 1000);
        const roundStart = Number(round.startDate);
        const roundEnd = Number(round.endDate);

        // Modification : si le round n'est pas encore commencé, le décompte correspond au temps avant le début
        let status = "";
        let timeRemaining = 0;
        if (now < roundStart) {
          status = "Pas commencé";
          timeRemaining = roundStart - now;
        } else if (now >= roundStart && now <= roundEnd) {
          status = "Ouvert";
          timeRemaining = roundEnd - now;
        } else {
          status = "Fermé";
        }
        setStatusInfo({ status, timeRemaining });
        setIsRoundActive(now >= roundStart && now <= roundEnd);
        setIsRoundOver(now > roundEnd);

        // Récupération des identifiants de candidats pour ce tour
        const candidateIds = await contract.getCandidateIdsForRound(electionId, round.roundNumber);
        const candidateDetails = [];
        for (let id of candidateIds) {
          const c = await contract.candidates(id);
          candidateDetails.push({
            id: Number(id),
            firstName: c.firstName,
            lastName: c.lastName,
            politicalParty: c.politicalParty,
          });
        }
        setCandidates(candidateDetails);

        if (now > roundEnd) {
          const [totalVotes, candidateIds, votesPerCandidate, startDate, endDate] =
            await contract.getElectionRoundResults(electionId, round.roundNumber);
          const mappedResults = candidateIds.map((id, index) => ({
            id: Number(id),
            votes: Number(votesPerCandidate[index]),
          }));
          setResults({ totalVotes: Number(totalVotes), candidates: mappedResults });
        }
      } catch (err) {
        console.error("Erreur lors du chargement des données du tour :", err);
      }
    }

    if (contract) fetchData();
  }, [contract, electionId, round]);

  const handleVote = async (candidateId) => {
    try {
      const tx = await contract.castVote(electionId, candidateId);
      await tx.wait();
      alert("Vote enregistré avec succès !");
    } catch (error) {
      console.error("Erreur lors du vote:", error);
      alert("Erreur lors du vote (avez-vous déjà voté ou êtes-vous inscrit ?)");
    }
  };

  // Fonction pour forcer la finalisation du tour (accessible uniquement au owner)
  const handleForceFinalize = async () => {
    try {
      const tx = await contract.finalizeRound(electionId, true);
      await tx.wait();
      alert("Tour finalisé manuellement !");
    } catch (error) {
      console.error("Erreur lors de la finalisation du tour :", error);
      alert("Erreur lors de la finalisation du tour");
    }
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Button variant="outlined" onClick={onBack}>
        Retour aux tours
      </Button>

      <Typography variant="h5" sx={{ mt: 2 }}>
        Candidats pour le Tour #{round.roundNumber} de l'élection #{electionId}
      </Typography>

      <Box sx={{ mt: 2, p: 2, border: "1px solid #ccc", borderRadius: 2 }}>
        <Typography variant="subtitle1">
          Date de début : {new Date(round.startDate * 1000).toLocaleString()}
        </Typography>
        <Typography variant="subtitle1">
          Date de fin : {new Date(round.endDate * 1000).toLocaleString()}
        </Typography>
        <Typography variant="subtitle1">
          Statut : {statusInfo.status}
        </Typography>
        {statusInfo.status === "Ouvert" && (
          <Typography variant="subtitle1">
            Temps restant pour voter : {Math.floor(statusInfo.timeRemaining / 3600)}h{" "}
            {Math.floor((statusInfo.timeRemaining % 3600) / 60)}m {statusInfo.timeRemaining % 60}s
          </Typography>
        )}
        {statusInfo.status === "Pas commencé" && (
          <Typography variant="subtitle1">
            Temps avant le début : {Math.floor(statusInfo.timeRemaining / 3600)}h{" "}
            {Math.floor((statusInfo.timeRemaining % 3600) / 60)}m {statusInfo.timeRemaining % 60}s
          </Typography>
        )}
      </Box>

      {isRoundActive || (!isRoundActive && !isRoundOver) ? (
        <Typography sx={{ mt: 1 }} color="error">
          ⛔ Le tour n'est pas encore ouvert pour voter.
        </Typography>
      ) : null}

      {isRoundOver && results && (
        <Box sx={{ mt: 3, p: 2, border: "1px solid #ccc", borderRadius: 2 }}>
          <Typography variant="h6">📊 Résultats du Tour</Typography>
          <Typography>Total de votes : {results.totalVotes}</Typography>
          <List>
            {results.candidates.map((res) => {
              const candidate = candidates.find((c) => c.id === res.id);
              return (
                <ListItem key={res.id}>
                  <ListItemText
                    primary={
                      candidate
                        ? `${candidate.firstName} ${candidate.lastName}`
                        : res.id === 0
                        ? "Vote blanc"
                        : `Candidat ${res.id}`
                    }
                    secondary={`Votes : ${res.votes}`}
                  />
                </ListItem>
              );
            })}
          </List>
        </Box>
      )}

      <List>
        {candidates.map((candidate) => (
          <Card key={candidate.id} variant="outlined" sx={{ mt: 2 }}>
            <CardContent>
              <ListItem>
                <ListItemText
                  primary={`${candidate.firstName} ${candidate.lastName}`}
                  secondary={`Parti politique : ${candidate.politicalParty}`}
                />
                <Button
                  variant="contained"
                  disabled={!isRoundActive}
                  onClick={() => handleVote(candidate.id)}
                >
                  Voter
                </Button>
              </ListItem>
            </CardContent>
          </Card>
        ))}
      </List>

      {/* Bouton pour forcer la fin du tour, affiché uniquement si l'utilisateur est le owner */}
      {owner &&
        normalizedAccount.toLowerCase() === owner.toLowerCase() && (
          <Box sx={{ mt: 3 }}>
            <Button variant="contained" color="secondary" onClick={handleForceFinalize}>
              Forcer la fin du tour
            </Button>
          </Box>
        )}
    </Box>
  );
}

export default RoundDetails;
