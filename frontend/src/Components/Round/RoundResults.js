import React from "react";
import { Box, Typography } from "@mui/material";

function RoundResults({ results, candidates }) {
  console.log("🔍 [RoundResults] Composant rendu");
  console.log("📦 Résultats reçus :", results);
  console.log("👥 Candidats reçus :", candidates);

  const absents = results.totalRegistered - results.totalVotes;
  const exprimés = results.totalVotes - results.whiteVotes;

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        📊 Statistiques du tour
      </Typography>
      <ul>
        <li>👥 Nombre d’inscrits : {results.totalRegistered}</li>
        <li>⚪ Votes blancs : {results.whiteVotes}</li>
        <li>❌ Absents : {absents}</li>
        <li>✅ Total des votes : {results.totalVotes}</li>
        <li>📈 Votes exprimés (hors blancs) : {exprimés}</li>
      </ul>

      <Typography variant="subtitle1" sx={{ mt: 3 }}>
        🗳️ Votes par candidat :
      </Typography>
      {candidates.map((c) => {
        const match = results.candidates.find((r) => r.id === c.id);
        console.log(`📥 Résultat pour ${c.firstName} ${c.lastName} :`, match?.votes ?? 0);
        return (
          <Typography key={c.id}>
            {c.firstName} {c.lastName} : {match?.votes ?? 0} vote(s)
          </Typography>
        );
      })}
    </Box>
  );
}

export default RoundResults;
