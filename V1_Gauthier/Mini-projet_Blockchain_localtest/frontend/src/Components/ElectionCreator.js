import React, { useCallback, useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import DatePicker from "./DatePicker";
import dayjs from 'dayjs';



function ElectionCreator({ contract }) {
  const [electionStartDate, setElectionStartDate] = useState(dayjs(null));
  const [firstRoundStartDate, setFirstRoundStartDate] = useState(dayjs(null));
  const [allCandidates, setAllCandidates] = useState([]);
  const [selectedCandidates, setSelectedCandidates] = useState([]);

  const fetchCandidates = useCallback(async () => {
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
  }, [contract]);

  useEffect(() => {
    if (contract) fetchCandidates();
  }, [contract, fetchCandidates]);

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

    try {
      console.log("🚀 Début de création d'une élection...");
      // Récupération de l'heure actuelle perçue par la blockchain
      const now = Number(await contract.getCurrentTime());
      console.log("🕒 Heure blockchain actuelle :", now);

      // Conversion avec dayjs pour obtenir le timestamp Unix (en secondes)
      const electionStartTimestamp = electionStartDate.unix(); // dayjs fournit la méthode unix()
      const firstRoundStartTimestamp = firstRoundStartDate.unix();

      console.log("📅 Timestamp élection :", electionStartTimestamp);
      console.log("🏁 Timestamp premier tour :", firstRoundStartTimestamp);
      console.log("👥 Candidats sélectionnés :", selectedCandidates);

      // Comparaison : on vérifie que la date du premier tour est dans le futur (selon l'heure blockchain)
      if (firstRoundStartTimestamp < now) {
        alert("⛔ La date de début du premier tour est déjà passée (selon l'heure blockchain).");
        return;
      }

      // Appel de la fonction de création de l'élection via le contrat
      const tx = await contract.createElection(
        electionStartTimestamp,
        firstRoundStartTimestamp,
        selectedCandidates
      );
      console.log("📤 Transaction envoyée :", tx.hash);

      const receipt = await tx.wait();
      console.log("✅ Transaction confirmée dans le bloc :", receipt.blockNumber);
      alert("✅ Élection créée avec succès !");

      // Optionnel : Affichage des événements émis
      if (receipt.events && receipt.events.length > 0) {
        console.log("📦 Événements émis :", receipt.events);
      }

      // Recharge la page ou déclenche un callback pour rafraîchir la liste
      window.location.reload();
    } catch (err) {
      console.error("❌ Erreur création élection :", err);
      alert("Erreur lors de la création de l'élection.");
    }
  };


  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6">Créer une nouvelle élection</Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
        {/* <TextField
          label="Date de début de l'élection"
          type="datetime-local"
          InputLabelProps={{ shrink: true }}
          onChange={(e) => setElectionStartDate(e.target.value)}
        /> */}
        <DatePicker label={"Date de début de l'élection"} value={electionStartDate} onChange={setElectionStartDate} />
        <DatePicker label={"Date de début du premier tour"} minDateTime={electionStartDate} value={firstRoundStartDate} onChange={setFirstRoundStartDate} />
        {/* <TextField
          label="Date de début du premier tour"
          type="datetime-local"
          InputLabelProps={{ shrink: true }}
          onChange={(e) => setFirstRoundStartDate(e.target.value)}
        /> */}

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
