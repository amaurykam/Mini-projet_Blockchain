// src/Components/OwnershipTransferPanel.js
import React, { useState } from "react";
import { Box, Typography, TextField, Button } from "@mui/material";

function OwnershipTransferPanel({ contract, normalizedAccount, owner }) {
  const [newOwner, setNewOwner] = useState("");

  const handleTransfer = async () => {
    try {
      const tx = await contract.transferOwnership(newOwner);
      await tx.wait();
      alert("Ownership transféré avec succès !");
      setNewOwner("");
    } catch (err) {
      console.error("Erreur de transfert :", err);
      alert("Échec du transfert. Vérifie l'adresse.");
    }
  };

  if (normalizedAccount.toLowerCase() !== owner.toLowerCase()) {
    return (
      <Typography color="error" sx={{ mt: 2 }}>
        Accès réservé au contract holder.
      </Typography>
    );
  }

  return (
    <Box>
      <Typography variant="h6">Transférer la propriété du contrat</Typography>
      <TextField
        label="Nouvelle adresse du contract holder"
        value={newOwner}
        onChange={(e) => setNewOwner(e.target.value)}
        fullWidth
        sx={{ mt: 2 }}
      />
      <Button
        variant="contained"
        sx={{ mt: 2 }}
        onClick={handleTransfer}
        disabled={!newOwner}
      >
        Transférer
      </Button>
    </Box>
  );
}

export default OwnershipTransferPanel;
