import React, { useEffect, useState } from "react";
import { Box, Typography, Button } from "@mui/material";

function ElectionResult({ election, contract, onBack }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchResult() {
      try {
        const winnerId = await contract.getElectionResult(election.electionId);
        setResult(Number(winnerId));
      } catch (err) {
        console.error("❌ Erreur lors de la récupération du résultat:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchResult();
  }, [contract, election.electionId]);

  return (
    <Box sx={{ mt: 4 }}>
      <Button variant="outlined" onClick={onBack}>
        Retour
      </Button>
      <Typography variant="h5" sx={{ mt: 2 }}>
        Résultat de l'élection #{election.electionId}
      </Typography>
      {loading ? (
        <Typography>Chargement du résultat...</Typography>
      ) : (
        <Typography variant="h6">
          Gagnant :{" "}
          {result === 0 ? "Vote blanc" : `Candidat ID ${result}`}
        </Typography>
      )}
    </Box>
  );
}

export default ElectionResult;
