import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

export default function VoterManagerPanel({ contract, isAdmin }) {
  const [voterAddress, setVoterAddress] = useState("");
  const [voters, setVoters] = useState([]);
  const [expanded, setExpanded] = useState(false);

  const handleAddVoter = async () => {
    try {
      const tx = await contract.addVoter(voterAddress);
      await tx.wait();
      alert("Votant ajouté !");
      setVoterAddress("");
      fetchVoters();
    } catch (error) {
      console.error(error);
      alert("Erreur lors de l'ajout du votant.");
    }
  };

  const handleRemoveVoter = async () => {
    try {
      const tx = await contract.removeVoter(voterAddress);
      await tx.wait();
      alert("Votant supprimé !");
      setVoterAddress("");
      fetchVoters();
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la suppression du votant.");
    }
  };

  const fetchVoters = React.useCallback(async () => {
    try {
      const result = await contract.getAllVoters();
      setVoters(result);
    } catch (err) {
      console.error("Erreur lors du chargement des votants :", err);
    }
  }, [contract]);

  useEffect(() => {
    if (contract) {
      fetchVoters();
    }
  }, [contract, fetchVoters]);

  return (
    <Box>
      <Typography variant="h6">Gérer les votants</Typography>

      {isAdmin && (
        <>
          <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
            <TextField
              label="Adresse du votant"
              value={voterAddress}
              onChange={(e) => setVoterAddress(e.target.value)}
              fullWidth
            />
            <Button variant="contained" onClick={handleAddVoter}>
              Ajouter
            </Button>
            <Button variant="outlined" color="error" onClick={handleRemoveVoter}>
              Supprimer
            </Button>
          </Box>
        </>
      )}

      <Accordion expanded={expanded} onChange={() => setExpanded(!expanded)} sx={{ mt: 4 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Liste des votants ({voters.length})</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {voters.length === 0 ? (
            <Typography>Aucun votant enregistré.</Typography>
          ) : (
            voters.map((voter, index) => (
              <Typography key={index}>{voter}</Typography>
            ))
          )}
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}
