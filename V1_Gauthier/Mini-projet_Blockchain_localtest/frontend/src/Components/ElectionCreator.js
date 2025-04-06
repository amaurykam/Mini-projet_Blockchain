import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
} from "@mui/material";

function ElectionCreator({ contract }) {
  const [electionStartDate, setElectionStartDate] = useState("");
  const [firstRoundStartDate, setFirstRoundStartDate] = useState("");
  const [allCandidates, setAllCandidates] = useState([]);
  const [selectedCandidates, setSelectedCandidates] = useState([]);

  const fetchCandidates = async () => {
    try {
      const count = await contract.candidatesCount();
      const list = [];
      for (let i = 1; i <= count; i++) {
        const c = await contract.candidates(i); // appel direct sur le contrat unique
        list.push({
          id: parseInt(c.id),
          name: `${c.firstName} ${c.lastName}`,
        });
      }
      setAllCandidates(list);
    } catch (error) {
      console.error("Erreur lors de la récupération des candidats:", error);
    }
  };

  useEffect(() => {
    if (contract) fetchCandidates();
  }, [contract]);

  const handleCandidateSelect = (candidateId) => {
    setSelectedCandidates((prev) =>
      prev.includes(candidateId)
        ? prev.filter((id) => id !== candidateId)
        : [...prev, candidateId]
    );
  };

  // Conversion sans ajustement de timezone
  const convertToTimestamp = (dateStr) => {
    return Math.floor(new Date(dateStr).getTime() / 1000);
  };

  const handleCreateElection = async () => {
    if (!electionStartDate || !firstRoundStartDate || selectedCandidates.length === 0) {
      alert("Veuillez remplir tous les champs et sélectionner au moins un candidat.");
      return;
    }

    const electionStartTimestamp = convertToTimestamp(electionStartDate);
    const firstRoundStartTimestamp = convertToTimestamp(firstRoundStartDate);

    try {
      const tx = await contract.createElection(
        electionStartTimestamp,
        firstRoundStartTimestamp,
        selectedCandidates
      );
      await tx.wait();
      alert("Élection créée avec succès !");
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la création de l'élection");
    }
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6">Créer une nouvelle élection</Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
        <TextField
          label="Date de début de l'élection"
          type="datetime-local"
          InputLabelProps={{ shrink: true }}
          onChange={(e) => setElectionStartDate(e.target.value)}
        />
        <TextField
          label="Date de début du premier tour"
          type="datetime-local"
          InputLabelProps={{ shrink: true }}
          onChange={(e) => setFirstRoundStartDate(e.target.value)}
        />

        <Typography variant="subtitle1">Choisir les candidats :</Typography>
        {allCandidates.map((candidate) => (
          <FormControlLabel
            key={candidate.id}
            control={
              <Checkbox
                checked={selectedCandidates.includes(candidate.id)}
                onChange={() => handleCandidateSelect(candidate.id)}
              />
            }
            label={candidate.name}
          />
        ))}

        <Button variant="contained" onClick={handleCreateElection}>
          Créer l'élection
        </Button>
      </Box>
    </Box>
  );
}

export default ElectionCreator;
