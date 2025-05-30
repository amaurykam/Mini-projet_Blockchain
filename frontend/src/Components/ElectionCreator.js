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
  const [blockchainNow, setBlockchainNow] = useState(null);

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
    const blockchainNow = Number(await contract.getCurrentTime());
    setBlockchainNow(blockchainNow);
    if (!electionStartDate || !firstRoundStartDate || selectedCandidates.length === 0) {
      alert("Veuillez remplir tous les champs et sélectionner au moins un candidat.");
      return;
    }

    try {
      const blockchainNow = Number(await contract.getCurrentTime());
      const localNow = Math.floor(Date.now() / 1000);
      const offset = localNow - blockchainNow;

      console.log("🕒 Heure blockchain actuelle :", blockchainNow);
      console.log("🕒 Heure blockchain (lisible Europe/Paris) :", dayjs.unix(blockchainNow).tz("Europe/Paris").format("DD-MM-YYYY HH:mm"));

      // Conversion des dates choisies en timestamp UTC
      const electionStartTimestamp = electionStartDate.tz("Europe/Paris").unix() - offset;
      const userChosenFirstRoundTimestamp = firstRoundStartDate.tz("Europe/Paris").unix();
      const firstRoundStartTimestamp = userChosenFirstRoundTimestamp - offset;

      // Correction du timestamp du premier tour pour l'aligner avec l'heure blockchain

      // Vérifier que la date du premier tour est postérieure à l’heure actuelle blockchain
      if (firstRoundStartTimestamp < blockchainNow) {
        alert("⛔ La date de début du premier tour est déjà passée (selon l'heure blockchain).");
        return;
      }

      console.log("📌 Date de début premier tour (corrigée) :", dayjs.unix(firstRoundStartTimestamp).tz("Europe/Paris").format("DD-MM-YYYY HH:mm"));

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
      {firstRoundStartDate?.isValid() && blockchainNow !== null && (
        <Box sx={{ mt: 1, p: 1, border: "1px solid #ccc", borderRadius: 2 }}>
          <Typography variant="body2">
            🕒 <strong>Heure actuelle de la blockchain</strong> :{" "}
            {dayjs.unix(blockchainNow).tz("Europe/Paris").format("DD-MM-YYYY HH:mm:ss")}
          </Typography>
          <Typography variant="body2">
            📌 <strong>Début du 1er tour (heure blockchain prévue)</strong> :{" "}
            {dayjs.unix(firstRoundStartDate.tz("Europe/Paris").unix() - (Math.floor(Date.now() / 1000) - blockchainNow)).tz("Europe/Paris").format("DD-MM-YYYY HH:mm:ss")}
          </Typography>
        </Box>
      )}
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
