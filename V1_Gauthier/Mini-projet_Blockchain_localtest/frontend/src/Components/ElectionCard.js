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
          📅 Date de début : {new Date(election.startDate * 1000).toLocaleString()}
        </Typography>

        <Typography variant="body2">
          📌 Statut :{" "}
          <span style={{ color: election.isActive ? "green" : "red", fontWeight: 600 }}>
            {election.isActive ? "🟢 En cours" : "🔴 Terminée"}
          </span>
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
