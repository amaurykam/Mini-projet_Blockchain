import React from "react";
import { Box, Typography } from "@mui/material";

function RoundStatusBox({ round, statusInfo }) {
  const formatTime = (seconds) => {
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m ${seconds % 60}s`;
  };

  return (
    <Box sx={{ mt: 2, p: 2, border: "1px solid #ccc", borderRadius: 2 }}>
      <Typography variant="subtitle1">
        Date de début : {new Date(round.startDate * 1000).toLocaleString()}
      </Typography>
      <Typography variant="subtitle1">
        Date de fin : {new Date(round.endDate * 1000).toLocaleString()}
      </Typography>
      <Typography variant="subtitle1">Statut : {statusInfo.status}</Typography>

      {statusInfo.status === "Ouvert" && (
        <Typography variant="subtitle1">
          Temps restant pour voter : {formatTime(statusInfo.timeRemaining)}
        </Typography>
      )}
      {statusInfo.status === "Pas commencé" && (
        <Typography variant="subtitle1">
          Temps avant le début : {formatTime(statusInfo.timeRemaining)}
        </Typography>
      )}
    </Box>
  );
}

export default RoundStatusBox;
