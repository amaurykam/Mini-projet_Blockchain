// src/components/CandidateList.js
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  TextField,
  Button,
} from "@mui/material";

function CandidateList({ contract, normalizedAccount, isAdmin }) {
  const [candidates, setCandidates] = useState([]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [politicalParty, setPoliticalParty] = useState("");

  const fetchCandidates = async () => {
    try {
      const list = await contract.getAllCandidates();
      const formatted = list.map((c) => ({
        id: c.id.toString(),
        firstName: c.firstName,
        lastName: c.lastName,
        politicalParty: c.politicalParty,
      }));
      setCandidates(formatted);
    } catch (err) {
      console.error("Erreur lors de la récupération des candidats:", err);
    }
  };

  useEffect(() => {
    if (contract) fetchCandidates();
  }, [contract]);

  const handleAddCandidate = async () => {
    if (!firstName || !lastName || !politicalParty) {
      alert("Veuillez remplir tous les champs.");
      return;
    }

    try {
      const tx = await contract.addCandidate(firstName, lastName, politicalParty);
      await tx.wait();
      alert("Candidat ajouté avec succès !");
      setFirstName("");
      setLastName("");
      setPoliticalParty("");
      fetchCandidates();
    } catch (err) {
      console.error("Erreur lors de l'ajout du candidat:", err);
      alert("Erreur lors de l'ajout du candidat");
    }
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Liste des candidats enregistrés
      </Typography>
      <List>
        {candidates.length === 0 ? (
          <Typography>Aucun candidat disponible.</Typography>
        ) : (
          candidates.map((c) => (
            <ListItem key={c.id}>
              <ListItemText
                primary={`${c.firstName} ${c.lastName}`}
                secondary={`Parti politique : ${c.politicalParty}`}
              />
            </ListItem>
          ))
        )}
      </List>

      {isAdmin && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6">Ajouter un candidat</Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Prénom"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <TextField
              label="Nom"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
            <TextField
              label="Parti Politique"
              value={politicalParty}
              onChange={(e) => setPoliticalParty(e.target.value)}
            />
            <Button variant="contained" onClick={handleAddCandidate}>
              Ajouter le candidat
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default CandidateList;
