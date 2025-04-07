import React, { useEffect, useState } from "react";
import { Box, Typography, List, ListItem, ListItemText } from "@mui/material";

function LiveVotes({ contract, electionId, roundNumber, candidates }) {
  const [votes, setVotes] = useState([]);

  useEffect(() => {
    async function fetchLiveVotes() {
      try {
        const voteEvents = await contract.queryFilter(
          contract.filters.VoteCast(electionId, null, null),
        );

        const filteredVotes = voteEvents
          .map((event) => ({
            voter: event.args.voter,
            round: Number(event.args.roundNumber),
            candidateId: Number(event.args.candidateId),
          }))
          .filter((vote) => vote.round === roundNumber);

        setVotes(filteredVotes);
      } catch (err) {
        console.error("Erreur lors du chargement des votes en direct :", err);
      }
    }

    fetchLiveVotes();

    const interval = setInterval(fetchLiveVotes, 5000); // mise à jour toutes les 5 sec
    return () => clearInterval(interval);
  }, [contract, electionId, roundNumber]);

  const getCandidateName = (id) => {
    if (id === 0) return "Vote blanc";
    const candidate = candidates.find((c) => c.id === id);
    return candidate ? `${candidate.firstName} ${candidate.lastName}` : `Candidat ${id}`;
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6">🧾 Votes en direct</Typography>
      <List>
        {votes.map((vote, index) => (
          <ListItem key={index} sx={{ borderBottom: "1px solid #eee" }}>
            <ListItemText
              primary={`Adresse : ${vote.voter}`}
              secondary={`Candidat : ${getCandidateName(vote.candidateId)}`}
            />
          </ListItem>
        ))}
        {votes.length === 0 && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            Aucun vote enregistré pour le moment.
          </Typography>
        )}
      </List>
    </Box>
  );
}

export default LiveVotes;
