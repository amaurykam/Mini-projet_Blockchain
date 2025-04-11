import React, { useState } from "react";
import { Box, Card, CardContent, Divider, IconButton, LinearProgress, Typography } from "@mui/material";
import { KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";

function RoundResults({ results, candidates, nextRoundCandidates }) {
  const [isDetailed, setIsDetailed] = useState(false);
  console.log("🔍 [RoundResults] Composant rendu");
  console.log("📦 Résultats reçus :", results);
  console.log("👥 Candidats reçus :", candidates);

  const absents = results.totalRegistered - results.totalVotes;
  const exprimés = results.totalVotes - results.whiteVotes;

  return (
    <Box sx={{ mt: 4, marginTop: "1.5rem" }}>
      <Card>
        <CardContent>
          <>
            <Typography variant="h6" sx={{ mb: 2 }}>
              📊 Statistiques du tour
            </Typography>
            <ul className="list-stats">
              <li>
                <Typography>👥 Nombre d’inscrits : </Typography>
                <Typography className="value"> {results.totalRegistered}  </Typography>
              </li>
              <Divider></Divider>
              <li>
                <Typography>
                  ⚪ Votes blancs :
                </Typography>
                <Typography className="value">
                  {results.whiteVotes}
                </Typography>
              </li>
              <Divider></Divider>
              <li>
                <Typography>
                  ❌ Absents :
                </Typography>
                <Typography className="value">
                  {results.absent}
                </Typography>
              </li>
              <Divider></Divider>
              <li>
                <Typography>
                  ✅ Total des votes :
                </Typography>
                <Typography className="value">
                  {results.totalVotes}
                </Typography>
              </li>
              <Divider></Divider>
              <li>
                <Typography>
                  📈 Votes exprimés (hors blancs) :
                </Typography>
                <Typography className="value">
                  {exprimés}
                </Typography>
              </li>
            </ul>
          </>
          <Typography variant="subtitle1" sx={{ mt: 3 }}>
            🗳️ Votes par candidat :
          </Typography>
          {nextRoundCandidates.length > 0 && !isDetailed ?
            <>
              {nextRoundCandidates.map((c) => {
                const match = results.candidates.find((r) => r.id === c.id);
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
                  </div>
                )
              })}
            </>
            // }
            // {
            :
            candidates.map((c, index) => {
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
          <IconButton>
            {!isDetailed ?
              <KeyboardArrowDown color="primary" onClick={() => setIsDetailed(true)} /> :
              <KeyboardArrowUp color="primary" onClick={() => setIsDetailed(false)} />
            }
          </IconButton>
        </CardContent>
      </Card>

    </Box>
  );
}

export default RoundResults;
