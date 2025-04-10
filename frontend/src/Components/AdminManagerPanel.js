// src/components/AdminManagerPanel.js
import React, { useState, useEffect, useCallback } from "react";
import { Box, Typography, TextField, Button, List, ListItem, ListItemText } from "@mui/material";

const AdminManagerPanel = ({ contract, owner, normalizedAccount }) => {
  const [adminList, setAdminList] = useState([]);
  const [newAdmin, setNewAdmin] = useState("");
  const [loadingAdmins, setLoadingAdmins] = useState(false);

  const isHolder = normalizedAccount.toLowerCase() === owner.toLowerCase();

  const fetchAdmins = useCallback(async () => {
    try {
      setLoadingAdmins(true);
      const admins = await contract.getAdmins();
      setAdminList(admins);
    } catch (error) {
      console.error("Erreur lors de la récupération des administrateurs :", error);
      alert("Erreur lors de la récupération des administrateurs.");
    } finally {
      setLoadingAdmins(false);
    }
  }, [contract]);

  useEffect(() => {
    if (contract) fetchAdmins();
  }, [contract, fetchAdmins]);

  const handleAddAdmin = async () => {
    if (!newAdmin) {
      alert("Veuillez saisir une adresse.");
      return;
    }
    try {
      const tx = await contract.addAdmin(newAdmin);
      await tx.wait();
      alert("Administrateur ajouté avec succès !");
      setNewAdmin("");
      fetchAdmins();
    } catch (error) {
      console.error("Erreur lors de l'ajout de l'administrateur :", error);
      alert("Erreur lors de l'ajout de l'administrateur.");
    }
  };

  const handleRemoveAdmin = async (admin) => {
    try {
      const tx = await contract.removeAdmin(admin);
      await tx.wait();
      alert("Administrateur supprimé avec succès !");
      fetchAdmins();
    } catch (error) {
      console.error("Erreur lors de la suppression de l'administrateur :", error);
      alert("Erreur lors de la suppression de l'administrateur.");
    }
  };

  return (
    <Box sx={{ mt: 4, p: 2, border: "1px solid #ccc", borderRadius: 2 }}>
      <Typography variant="h5" gutterBottom>
        Gestion des Administrateurs
      </Typography>

      <Typography variant="subtitle1" gutterBottom>
        Liste des administrateurs {loadingAdmins && "(Chargement...)"} :
      </Typography>

      {adminList.length > 0 ? (
        <List sx={{ justifyContent: 'center' }}>
          {adminList.map((admin) => (
            <ListItem
              key={admin}
              sx={{ justifyContent: 'space-between', width: '100%', display: 'flex' }}
              secondaryAction={
                isHolder && (
                  <Button variant="outlined" onClick={() => handleRemoveAdmin(admin)}>
                    Supprimer
                  </Button>
                )
              }
            >
              <ListItemText sx={{
                whiteSpace: 'normal',
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
                width: '100%',
              }} primary={admin} />
            </ListItem>
          ))}
        </List>
      ) : (
        <Typography variant="body2">Aucun administrateur trouvé.</Typography>
      )}

      {isHolder && (
        <>
          <Typography variant="h6" sx={{ mt: 3 }}>
            Ajouter un administrateur
          </Typography>
          <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
            <TextField
              label="Adresse"
              value={newAdmin}
              onChange={(e) => setNewAdmin(e.target.value)}
              fullWidth
            />
            <Button variant="contained" onClick={handleAddAdmin}>
              Ajouter
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
};

export default AdminManagerPanel;
