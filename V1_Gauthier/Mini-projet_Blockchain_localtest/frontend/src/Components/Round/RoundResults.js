import React from "react";
import { Box, Typography, List, ListItem, ListItemText, LinearProgress } from "@mui/material";

function RoundResults({ results, candidates }) {
  const getCandidateName = (id) => {
    if (id === 0) return "Vote blanc";
    const candidate = candidates.find((c) => c.id === id);
    return candidate ? `${candidate.firstName} ${candidate.lastName}` : `Candidat ${id}`;
  };

  return (
    <Box sx={{ mt: 3, p: 2, border: "1px solid #ccc", borderRadius: 2 }}>
      <Typography variant="h6">Résultats du Tour</Typography>
      <Typography>Total de votes : {results.totalVotes}</Typography>
      <List>
        {results.candidates.map((res) => (
          <ListItem key={res.id}>
            <ListItemText
              primary={getCandidateName(res.id)}
              secondary={`Votes : ${res.votes}`}
            />
            <LinearProgress variant="determinate" value={(res.votes / results.totalVotes) * 100} sx={{ width: '100%' }} />
            <Typography variant="body2" color="text.secondary">
              {Math.round((res.votes / results.totalVotes) * 100)} %
            </Typography>
          </ListItem>
        ))}
      </List>
    </Box>
  );
}

export default RoundResults;
