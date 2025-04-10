import React, { useEffect, useState } from "react";
import { Grid } from "@mui/material";
import ElectionCard from "./ElectionCard";
import ElectionRounds from "./ElectionRounds";

function ElectionList({ contract, candidatesContract, normalizedAccount, owner }) {
  const [elections, setElections] = useState([]);
  const [selectedElection, setSelectedElection] = useState(null);

  useEffect(() => {
    async function fetchElections() {
      if (contract) {
        try {
          console.log("📡 Chargement des élections depuis le contrat...");
          const count = await contract.electionsCount();
          const electionCount = Number(count);
          console.log(`🔢 Nombre d'élections : ${electionCount}`);

          const electionArray = [];
          // On utilise ici l'heure locale en secondes
          const now = Math.floor(Date.now() / 1000);

          for (let i = 1; i <= electionCount; i++) {
            const electionData = await contract.elections(i);
            const currentRoundNumber = Number(electionData.currentRound);
            const firstRound = await contract.electionRounds(i, 1);
            const lastRound = await contract.electionRounds(i, currentRoundNumber);

            const startDate = Number(firstRound.startDate);
            const isActive = electionData.isActive;
            const isLastRoundFinalized = lastRound.finalized;

            // Déduction du statut en fonction de la date et de l'état du dernier round
            let status;
            if (now < startDate) {
              status = "Pas commencée";
            } else {
              // Si l'élection a commencé, on regarde l'état du dernier round
              if (!isLastRoundFinalized) {
                status = "Ouverte";
              } else {
                status = "Terminée";
              }
            }

            const formattedElection = {
              electionId: i,
              startDate,
              isActive,
              winnerCandidateId: Number(electionData.winnerCandidateId),
              currentRound: currentRoundNumber,
              status,
            };

            console.log(`📋 Élection #${i} (formatée):`, formattedElection);
            electionArray.push(formattedElection);
          }

          setElections(electionArray);
        } catch (error) {
          console.error("❌ Erreur lors de la récupération des élections :", error);
        }
      }
    }

    fetchElections();
  }, [contract]);

  const handleSelectElection = (election) => {
    console.log("✅ Élection sélectionnée :", election);
    setSelectedElection(election);
  };

  if (selectedElection) {
    console.log("🔍 Affichage des tours pour l'élection :", selectedElection);
    return (
      <ElectionRounds
        election={selectedElection}
        contract={contract}
        candidatesContract={candidatesContract}
        normalizedAccount={normalizedAccount}
        owner={owner}
        onBack={() => {
          console.log("↩️ Retour à la liste des élections");
          setSelectedElection(null);
        }}
      />
    );
  }

  return (
    <>
      {elections.length === 0 ? (
        <p>🕓 Aucune élection chargée.</p>
      ) : (
        <Grid container spacing={2}>
          {elections.map((election, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <ElectionCard election={election} onSelectElection={handleSelectElection} />
            </Grid>
          ))}
        </Grid>
      )}
    </>
  );
}

export default ElectionList;
