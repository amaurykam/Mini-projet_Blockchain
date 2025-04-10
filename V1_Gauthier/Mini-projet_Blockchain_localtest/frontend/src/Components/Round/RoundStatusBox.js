import React, { useEffect } from "react";
import { Box, Typography } from "@mui/material";

function RoundStatusBox({ round, statusInfo }) {
  const formatTime = (seconds) => {
    const positiveSeconds = Math.max(0, seconds);
    const h = Math.floor(positiveSeconds / 3600);
    const m = Math.floor((positiveSeconds % 3600) / 60);
    const s = positiveSeconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  const getStatusLabel = () => {
    switch (statusInfo.status) {
      case "NotStarted":
        return "Pas commencé";
      case "Active":
        return "Ouvert";
      case "Ended":
        return "Terminé";
      default:
        return "Inconnu";
    }
  };

  // Log de debug automatique à chaque rendu
  useEffect(() => {
    const now = Math.floor(Date.now() / 1000);
  }, [round, statusInfo]);

  return (
    <Box sx={{ mt: 2, p: 2, border: "1px solid #ccc", borderRadius: 2 }}>
      <Typography variant="subtitle1">
        📅 Date de début : {new Date(round.startDate * 1000).toLocaleString()}
      </Typography>
      <Typography variant="subtitle1">
        ⏰ Date de fin : {new Date(round.endDate * 1000).toLocaleString()}
      </Typography>
      <Typography variant="subtitle1">📌 Statut : {getStatusLabel()}</Typography>

      {statusInfo.status === "Active" && (
        <Typography variant="subtitle1">
          🕒 Temps restant pour voter : {formatTime(statusInfo.timeRemaining)}
        </Typography>
      )}
      {statusInfo.status === "NotStarted" && (
        <Typography variant="subtitle1">
          ⏳ Temps avant le début : {formatTime(statusInfo.timeRemaining)}
        </Typography>
      )}
      {statusInfo.status === "Ended" && (
        <Typography variant="subtitle1" color="error">
          🚫 Ce tour est terminé.
        </Typography>
      )}
    </Box>
  );
}

export default RoundStatusBox;
