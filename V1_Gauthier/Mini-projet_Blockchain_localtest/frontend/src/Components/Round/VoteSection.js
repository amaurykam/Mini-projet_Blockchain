import React from "react";
import {
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Button,
  Typography,
  Box,
} from "@mui/material";

function VoteSection({ candidates, isRoundActive, onVote }) {
  if (!candidates || candidates.length === 0) {
    return (
      <Typography variant="body1" sx={{ mt: 2 }}>
        Aucun candidat disponible pour ce tour.
      </Typography>
    );
  }

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6">🗳️ Votez pour un candidat</Typography>
      <List>
        {candidates.map((candidate) => (
          <Card key={candidate.id} variant="outlined" sx={{ mt: 2 }}>
            <CardContent>
              <ListItem>
                <ListItemText
                  primary={`${candidate.firstName} ${candidate.lastName}`}
                  secondary={`Parti politique : ${candidate.politicalParty}`}
                />
                <Button
                  variant="contained"
                  disabled={!isRoundActive}
                  onClick={() => onVote(candidate.id)}
                >
                  Voter
                </Button>
              </ListItem>
            </CardContent>
          </Card>
        ))}
      </List>
    </Box>
  );
}

export default VoteSection;
