// ElectionCard.js
import React from "react";
import { Card, CardContent, Typography, Button } from "@mui/material";

function ElectionCard({ election, onSelectElection }) {
  return (
    <Card variant="outlined" sx={{ margin: 2 }}>
      <CardContent>
        <Typography variant="h6">
          Élection ID : {election.electionId.toString()}
        </Typography>
        <Typography variant="body2">
          Date de début :{" "}
          {new Date(Number(election.electionStartDate) * 1000).toLocaleString()}
        </Typography>
        <Typography variant="body2">
          Statut : {election.isActive ? "Active" : "Terminée"}
        </Typography>
        <Button 
          variant="contained" 
          sx={{ mt: 2 }}
          onClick={() => onSelectElection(election)}
        >
          Voir les tours
        </Button>
      </CardContent>
    </Card>
  );
}

export default ElectionCard;
