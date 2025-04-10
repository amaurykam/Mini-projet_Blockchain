import React, { useCallback, useEffect, useState } from "react";
import { Box, Typography, Button, Checkbox, FormControlLabel } from "@mui/material";
import DatePicker from "./DatePicker";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

// Étendre dayjs avec les plugins nécessaires
dayjs.extend(utc);
dayjs.extend(timezone);

function ElectionCreator({ contract }) {
  const [electionStartDate, setElectionStartDate] = useState(dayjs(null));
  const [firstRoundStartDate, setFirstRoundStartDate] = useState(dayjs(null));
  const [allCandidates, setAllCandidates] = useState([]);
  const [selectedCandidates, setSelectedCandidates] = useState([]);

  useEffect(() => {
    if (electionStartDate && electionStartDate.isValid()) {
      console.log("ElectionStartDate modifiée (brut) :", electionStartDate.format());
    }
  }, [electionStartDate]);

  useEffect(() => {
    if (firstRoundStartDate && firstRoundStartDate.isValid()) {
      console.log("FirstRoundStartDate modifiée (brut) :", firstRoundStartDate.format());
    }
  }, [firstRoundStartDate]);

  const fetchCandidates = useCallback(async () => {
    try {
      const count = await contract.candidatesCount();
      const list = [];
      for (let i = 1; i <= count; i++) {
        const c = await contract.candidates(i);
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

  const handleCreateElection = async () => {
    if (!electionStartDate || !firstRoundStartDate || selectedCandidates.length === 0) {
      alert("Veuillez remplir tous les champs et sélectionner au moins un candidat.");
      return;
    }

    try {
      console.log("🚀 Début de création d'une élection...");
      const now = Number(await contract.getCurrentTime());
      console.log("🕒 Heure blockchain actuelle :", now);
      console.log("🕒 Heure blockchain (lisible Europe/Paris) :", dayjs.unix(now).tz("Europe/Paris").format("DD-MM-YYYY HH:mm"));

      // Conversion de la date saisie en timestamp UTC en considérant Europe/Paris comme timezone de référence
      const electionStartTimestamp = electionStartDate.tz("Europe/Paris").unix();
      const firstRoundStartTimestamp = firstRoundStartDate.tz("Europe/Paris").unix() - 350;

      // Vérifier que la date du premier tour est postérieure à celle de l'élection
      if (firstRoundStartTimestamp < now) {
        alert("⛔ La date de début du premier tour est déjà passée (selon l'heure blockchain).");
        return;
      }

      const tx = await contract.createElection(
        electionStartTimestamp,
        firstRoundStartTimestamp,
        selectedCandidates
      );
      const receipt = await tx.wait();
      alert("✅ Élection créée avec succès !");
      if (receipt.events && receipt.events.length > 0) {
        console.log("📦 Événements émis :", receipt.events);
      }
    } catch (err) {
      console.error("❌ Erreur création élection :", err);
      alert("Erreur lors de la création de l'élection.");
    }
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6">Créer une nouvelle élection</Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
        {/* Date de début de l'élection */}
        <DatePicker label={"Date de début de l'élection"} value={electionStartDate} onChange={setElectionStartDate} />
        {electionStartDate && electionStartDate.isValid() && (
          <Typography variant="caption" sx={{ ml: 1 }}>
            Heure saisie : {electionStartDate.tz("Europe/Paris").format("DD-MM-YYYY HH:mm")}
          </Typography>
        )}

        {/* Date de début du premier tour */}
        <DatePicker label={"Date de début du premier tour"} minDateTime={electionStartDate} value={firstRoundStartDate} onChange={setFirstRoundStartDate} />
        {firstRoundStartDate && firstRoundStartDate.isValid() && (
          <Typography variant="caption" sx={{ ml: 1 }}>
            Heure saisie : {firstRoundStartDate.tz("Europe/Paris").format("DD-MM-YYYY HH:mm")}
          </Typography>
        )}

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
