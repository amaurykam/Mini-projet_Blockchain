import React, { useEffect, useState } from "react";
import { Box, Typography, Button } from "@mui/material";

import VoteSection from "./VoteSection";
import RoundStatusBox from "./RoundStatusBox";
import RoundResults from "./RoundResults";
import LiveVotes from "./LiveVotes";

function RoundDetails({ electionId, round, contract, normalizedAccount, owner, onBack }) {
  const [candidates, setCandidates] = useState([]);
  const [isRoundActive, setIsRoundActive] = useState(false);
  const [isRoundOver, setIsRoundOver] = useState(false);
  const [results, setResults] = useState(null);
  const [statusInfo, setStatusInfo] = useState({ status: "", timeRemaining: 0 });
  const [currentRoundData, setCurrentRoundData] = useState(null);

  // Recharger les données du round
  useEffect(() => {
    async function fetchRoundData() {
      try {
        const data = await contract.electionRounds(electionId, round.roundNumber);
        setCurrentRoundData({
          ...round,
          startDate: Number(data.startDate),
          endDate: Number(data.endDate),
          finalized: data.finalized,
          totalVotes: Number(data.totalVotes),
          winnerCandidateId: Number(data.winnerCandidateId),
        });
      } catch (err) {
        console.error("Erreur chargement du round :", err);
      }
    }

    if (contract) fetchRoundData();
  }, [contract, electionId, round.roundNumber]);

  // Charger les candidats
  useEffect(() => {
    async function fetchCandidates() {
      try {
        const candidateIds = await contract.getCandidateIdsForRound(electionId, round.roundNumber);
        const candidateDetails = await Promise.all(
          candidateIds.map(async (id) => {
            const c = await contract.candidates(id);
            return {
              id: Number(id),
              firstName: c.firstName,
              lastName: c.lastName,
              politicalParty: c.politicalParty,
            };
          })
        );
        setCandidates(candidateDetails);
      } catch (err) {
        console.error("Erreur lors du chargement des candidats :", err);
      }
    }

    if (contract) fetchCandidates();
  }, [contract, electionId, round]);

  // Lire le statut réel du round depuis le contrat
  useEffect(() => {
    if (!currentRoundData) return;

    const interval = setInterval(async () => {
      try {
        const status = await contract.getRoundStatus(electionId, round.roundNumber);
        let timeRemaining = 0;

        if (status === "NotStarted") {
          timeRemaining = currentRoundData.startDate - Math.floor(Date.now() / 1000);
          setIsRoundActive(false);
          setIsRoundOver(false);
        } else if (status === "Active") {
          timeRemaining = currentRoundData.endDate - Math.floor(Date.now() / 1000);
          setIsRoundActive(true);
          setIsRoundOver(false);
        } else if (status === "Ended") {
          timeRemaining = 0;
          setIsRoundActive(false);
          setIsRoundOver(true);
        }

        setStatusInfo({ status, timeRemaining });
      } catch (err) {
        console.error("Erreur récupération du statut du round :", err);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentRoundData, contract, electionId, round.roundNumber]);

  // Résultats une fois le tour terminé
  useEffect(() => {
    async function fetchResults() {
      try {
        const [totalVotes, candidateIds, votesPerCandidate] =
          await contract.getRoundResults(electionId, round.roundNumber);

        const mappedResults = candidateIds.map((id, index) => ({
          id: Number(id),
          votes: Number(votesPerCandidate[index]),
        }));

        setResults({ totalVotes: Number(totalVotes), candidates: mappedResults });
      } catch (err) {
        if (err?.reason?.includes("Round not over yet")) {
          console.log("Le round n'est pas encore terminé, résultats indisponibles.");
        } else {
          console.error("Erreur lors de la récupération des résultats :", err);
        }
      }
    }

    if (contract && isRoundOver && !results) {
      fetchResults();
    }
  }, [contract, electionId, round, isRoundOver]);

  // Voter pour un candidat
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

  // Forcer la fin d’un tour
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

  if (!currentRoundData) {
    return (
      <Box sx={{ mt: 4 }}>
        <Typography>Chargement des informations du tour...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 4 }}>
      <Button variant="outlined" onClick={onBack}>
        Retour aux tours
      </Button>

      <Typography variant="h5" sx={{ mt: 2 }}>
        Candidats pour le Tour #{currentRoundData.roundNumber} de l'élection #{electionId}
      </Typography>

      <RoundStatusBox round={currentRoundData} statusInfo={statusInfo} />

      {statusInfo.status === "NotStarted" && (
        <Typography sx={{ mt: 1 }} color="error">
          ⛔ Le tour n'est pas encore ouvert pour voter.
        </Typography>
      )}

      {isRoundOver && results && (
        <RoundResults results={results} candidates={candidates} />
      )}

      <VoteSection
        candidates={candidates}
        isRoundActive={isRoundActive}
        onVote={handleVote}
      />

      {isRoundActive && (
        <LiveVotes
          contract={contract}
          electionId={electionId}
          roundNumber={currentRoundData.roundNumber}
          candidates={candidates}
        />
      )}

      {owner && normalizedAccount.toLowerCase() === owner.toLowerCase() && (
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
