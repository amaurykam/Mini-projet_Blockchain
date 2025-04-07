import React from "react";
import { Box, Typography, List, ListItem, ListItemText } from "@mui/material";

function FinalResults({ results, candidates }) {
  const getCandidateName = (id) => {
    if (id === 0) return "Vote blanc";
    const candidate = candidates.find((c) => c.id === id);
    return candidate ? `${candidate.firstName} ${candidate.lastName}` : `Candidat ${id}`;
  };

  return (
    <Box sx={{ mt: 3, p: 2, border: "1px solid #ccc", borderRadius: 2 }}>
      <Typography variant="h6">📊 Résultats du Tour</Typography>
      <Typography>Total de votes : {results.totalVotes}</Typography>
      <List>
        {results.candidates.map((res) => (
          <ListItem key={res.id}>
            <ListItemText
              primary={getCandidateName(res.id)}
              secondary={`Votes : ${res.votes}`}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
}

export default FinalResults;
