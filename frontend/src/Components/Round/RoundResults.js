import React from "react";
import { Box, Divider, LinearProgress, Typography } from "@mui/material";

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
      {candidates.map((c, index) => {
        const match = results.candidates.find((r) => r.id === c.id);
        console.log(`📥 Résultat pour ${c.firstName} ${c.lastName} :`, match?.votes ?? 0);
        return (
          <div key={c.id} className='tour-candidate-container'>
            <div className='tour-candidate detailed'>
              <div className='tour-candidate-name'>
                <Typography key={c.id}>
                  {c.firstName} {c.lastName} : {match?.votes ?? 0} vote(s)
                </Typography>
              </div>
              <LinearProgress variant="determinate" value={match ? ((match.votes / results.totalVotes) * 100) : 0} sx={{ width: '100%' }} />
              <div className='number'>
                {match?.votes && Math.round((match.votes / results.totalVotes) * 100)} %
              </div>
            </div>
            {index < (candidates.length - 1) && <Divider sx={{ borderColor: '#7a7a7a' }}></Divider>}
          </div>
        );
      })}
    </Box>
  );
}

export default RoundResults;
