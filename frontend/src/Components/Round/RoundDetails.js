import React, { useEffect, useState } from "react";
import { Box, Typography, Button } from "@mui/material";

import VoteSection from "./VoteSection";
import RoundStatusBox from "./RoundStatusBox";
import RoundResults from "./RoundResults";

function RoundDetails({ electionId, round, contract, normalizedAccount, owner, onBack }) {
  const [candidates, setCandidates] = useState([]);
  const [isRoundActive, setIsRoundActive] = useState(false);
  const [isRoundOver, setIsRoundOver] = useState(false);
  const [results, setResults] = useState(null);
  const [statusInfo, setStatusInfo] = useState({ status: "", timeRemaining: 0 });
  const [currentRoundData, setCurrentRoundData] = useState(null);
  const [isFetchingResults, setIsFetchingResults] = useState(false);
  const [nextRoundCandidates, setNextRoundCandidates] = useState([]);
  const [simulatedBlockchainNow, setSimulatedBlockchainNow] = useState(null);

  // Debug : fonction pour afficher l'heure de la blockchain
  async function debugBlockchainTime() {
    try {
      const currentTime = await contract.getCurrentTime();
      console.log("⏱️ getCurrentTime() retourne :", Number(currentTime));
      console.log("Tour commence", currentRoundData.startDate);
      const localTime = Math.floor(Date.now() / 1000);
      console.log("⏱️ Heure locale :", localTime);
      console.log("⏱️ Différence (local - blockchain) :", localTime - Number(currentTime));
    } catch (err) {
      console.error("❌ Erreur lors de l'appel de getCurrentTime :", err);
    }
  }

  useEffect(() => {
    async function initBlockchainClock() {
      try {
        const now = Number(await contract.getCurrentTime());
        setSimulatedBlockchainNow(now);
      } catch (err) {
        console.error("❌ Erreur init horloge blockchain :", err);
      }
    }
    if (contract) initBlockchainClock();
  }, [contract]);

  useEffect(() => {
    if (simulatedBlockchainNow === null) return;
    const interval = setInterval(() => {
      setSimulatedBlockchainNow((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [simulatedBlockchainNow]);

  // Récupération des données du round
  useEffect(() => {
    async function fetchRoundData() {
      try {
        const data = await contract.electionRounds(electionId, round.roundNumber);
        console.log("✅ Données du round :", data);
        setCurrentRoundData({
          ...round,
          startDate: Number(data.startDate),
          endDate: Number(data.endDate),
          finalized: data.finalized,
          totalVotes: Number(data.totalVotes),
          winnerCandidateId: Number(data.winnerCandidateId),
        });
      } catch (err) {
        console.error("❌ Erreur chargement du round :", err);
      }
    }
    if (contract) fetchRoundData();
  }, [contract, electionId, round.roundNumber, round]);

  // Récupération des candidats pour le round
  useEffect(() => {
    async function fetchCandidates() {
      try {
        console.log("📦 fetchCandidates: Récupération des candidats pour le round", round.roundNumber);
        const candidateIds = await contract.getCandidateIdsForRound(electionId, round.roundNumber);
        console.log("🆔 IDs des candidats :", candidateIds);
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
        console.log("✅ Candidats chargés :", candidateDetails);
        setCandidates(candidateDetails);
      } catch (err) {
        console.error("❌ Erreur lors du chargement des candidats :", err);
      }
    }
    if (contract) fetchCandidates();
  }, [contract, electionId, round]);

  useEffect(() => {
    if (!currentRoundData || simulatedBlockchainNow === null) return;

    const statusMap = {
      0: "NotStarted",
      1: "Active",
      2: "Ended",
    };

    const now = simulatedBlockchainNow;
    let status = "Unknown";
    let timeRemaining = 0;

    if (currentRoundData.finalized || now >= currentRoundData.endDate) {
      status = "Ended";
      timeRemaining = 0;
      setIsRoundActive(false);
      setIsRoundOver(true);
    } else if (now >= currentRoundData.startDate) {
      status = "Active";
      timeRemaining = currentRoundData.endDate - now;
      setIsRoundActive(true);
      setIsRoundOver(false);
    } else {
      status = "NotStarted";
      timeRemaining = currentRoundData.startDate - now;
      setIsRoundActive(false);
      setIsRoundOver(false);
    }

    setStatusInfo({ status, timeRemaining });
  }, [currentRoundData, simulatedBlockchainNow]);
  // Récupération des résultats une fois le round terminé
  useEffect(() => {
    async function fetchResults() {
      try {
        setIsFetchingResults(true);
        console.log("🎯 Appel getRoundResults pour :", electionId, round.roundNumber);
        const [totalVotes, candidateIds, votesPerCandidate] = await contract.getRoundResults(electionId, round.roundNumber);
        // Récupération globale du nombre d'inscrits
        const totalRegistered = await contract.getRegisteredVotersCount();
        // Pour les votes blancs (optionnels selon implémentation)
        const whiteVotes = await contract.roundCandidateVotes(electionId, round.roundNumber, 0);
        const mappedResults = candidateIds
          .map((id, index) => ({
            id: Number(id),
            votes: Number(votesPerCandidate[index]),
          }))
          .filter((c) => c.id !== 0); // 👈 exclut les votes blancs
        console.log("📊 Résultats :", { totalVotes, mappedResults, totalRegistered, whiteVotes });
        setResults({
          totalVotes: Number(totalVotes),
          candidates: mappedResults,
          totalRegistered: Number(totalRegistered),
          whiteVotes: Number(whiteVotes),
        });
      } catch (err) {
        if (err?.reason?.includes("Round not over yet")) {
          console.log("ℹ️ Le round n'est pas encore terminé, résultats indisponibles.");
        } else {
          console.error("❌ Erreur lors de la récupération des résultats :", err);
        }
      } finally {
        setIsFetchingResults(false);
      }
    }
    if (contract && isRoundOver && !results) {
      fetchResults();
    }
  }, [contract, electionId, round, isRoundOver, results]);

  useEffect(() => {
    async function fetchNextRoundCandidates() {
      try {
        const nextRoundNumber = round.roundNumber + 1;
        const nextRoundData = await contract.electionRounds(electionId, nextRoundNumber);

        if (nextRoundData && Number(nextRoundData.startDate) > 0) {
          console.log("🔍 Prochain tour détecté :", nextRoundNumber);
          const candidateIds = await contract.getCandidateIdsForRound(electionId, nextRoundNumber);
          const filteredIds = candidateIds.filter((id) => Number(id) !== 0); // 👈 exclure le vote blanc
          const candidateDetails = await Promise.all(
            filteredIds.map(async (id) => {
              const c = await contract.candidates(id);
              return {
                id: Number(id),
                firstName: c.firstName,
                lastName: c.lastName,
                politicalParty: c.politicalParty,
              };
            })
          );
          setNextRoundCandidates(candidateDetails);
        }
      } catch (err) {
        console.log("ℹ️ Aucun prochain tour détecté ou erreur :", err.message);
      }
    }

    if (contract && isRoundOver) {
      fetchNextRoundCandidates();
    }
  }, [contract, electionId, round.roundNumber, isRoundOver]);

  const handleVote = async (candidateId) => {
    try {
      console.log(`🗳️ Tentative de vote pour le candidat ${candidateId}...`);
      const tx = await contract.castVote(electionId, candidateId);
      console.log("🕒 Transaction envoyée :", tx.hash);
      await tx.wait();
      console.log("✅ Transaction confirmée !");
      alert("Vote enregistré avec succès !");
    } catch (error) {
      console.error("❌ Erreur lors du vote:", error);
      alert("Erreur lors du vote (avez-vous déjà voté ou êtes-vous inscrit ?)");
    }
  };

  const handleForceFinalize = async () => {
    try {
      console.log("🛑 Finalisation manuelle du round...");
      const tx = await contract.finalizeRound(electionId, true);
      console.log("🕒 Transaction envoyée :", tx.hash);
      await tx.wait();
      alert("Tour finalisé manuellement !");
      // Recharger les infos du round après finalisation
      const updatedData = await contract.electionRounds(electionId, round.roundNumber);
      setCurrentRoundData((prev) => ({
        ...prev,
        finalized: updatedData.finalized,
        totalVotes: Number(updatedData.totalVotes),
        winnerCandidateId: Number(updatedData.winnerCandidateId),
      }));
    } catch (error) {
      console.error("❌ Erreur lors de la finalisation du tour :", error);
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
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          🏁 Candidats qualifiés pour le prochain tour :
        </Typography>
        {nextRoundCandidates.map((c) => (
          <Box key={c.id} sx={{ ml: 2 }}>
            <Typography>
              - {c.firstName} {c.lastName} ({c.politicalParty})
            </Typography>
          </Box>
        ))}
      </Box>
      <Typography variant="h5" sx={{ mt: 2 }}>
        Candidats pour le Tour #{currentRoundData.roundNumber} de l'élection #{electionId}
      </Typography>
      <RoundStatusBox round={currentRoundData} statusInfo={statusInfo} />
      {statusInfo.status === "NotStarted" && (
        <Box sx={{ mt: 2 }}>
          <Typography color="error">
            ⏳ Le tour n'est pas encore ouvert pour voter.
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            🕒 Début dans : {Math.floor(statusInfo.timeRemaining / 60)} min {statusInfo.timeRemaining % 60} sec
          </Typography>
        </Box>
      )}
      {isRoundOver && results ? (
        <RoundResults results={results} candidates={candidates} />
      ) : isRoundOver && isFetchingResults ? (
        <Typography sx={{ mt: 2 }}>📊 Chargement des résultats du tour...</Typography>
      ) : statusInfo.status !== "NotStarted" && (
        <VoteSection candidates={candidates} isRoundActive={isRoundActive} onVote={handleVote} />
      )}
      {statusInfo.status === "Active" && owner && normalizedAccount.toLowerCase() === owner.toLowerCase() && (
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
