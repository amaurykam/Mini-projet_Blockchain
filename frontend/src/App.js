import React, { useEffect, useState } from "react";
import "./App.css";
import { BrowserProvider, Contract } from "ethers";
import { Box, Typography, Button } from "@mui/material";
import { MenuTabs, TabPanel } from "./Components/MenuTabs";
import ElectionList from "./Components/ElectionList";
import ElectionCreator from "./Components/ElectionCreator";
import AdminManagerPanel from "./Components/AdminManagerPanel";
import CandidateList from "./Components/CandidateList";
import VoterManagerPanel from "./Components/VoterManagerPanel";
import ElectionArtifact from "./PresidentialElection.json";
import OwnershipTransferPanel from "./Components/OwnershipTransferPanel";

function App() {
  const [account, setAccount] = useState("");
  const [electionReadContract, setElectionReadContract] = useState(null);
  const [electionWriteContract, setElectionWriteContract] = useState(null);
  const [owner, setOwner] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);

  // Fonction qui simule une déconnexion en réinitialisant les états
  const handleLogout = () => {
    setAccount("");
    setElectionReadContract(null);
    setElectionWriteContract(null);
    setOwner("");
    setIsAdmin(false);
    // Vous pouvez également demander à l'utilisateur de retirer la connexion depuis les paramètres de MetaMask
    alert("Vous êtes déconnecté. Pour une déconnexion complète, retirez également l'accès à cette dApp dans MetaMask.");
  };

  useEffect(() => {
    async function init() {
      if (window.ethereum) {
        try {
          await window.ethereum.request({ method: "eth_requestAccounts" });

          const provider = new BrowserProvider(window.ethereum);

          const accounts = await provider.send("eth_accounts", []);
          setAccount(accounts[0]);

          // Adresse de votre contrat
          const electionContractAddress = "0xFa9c6Cba3fa6cE431173bF422c84a653C407e525";

          // Instanciation des contrats lecture / écriture
          const electionRead = new Contract(
            electionContractAddress,
            ElectionArtifact.abi,
            provider
          );
          const signer = await provider.getSigner();
          const electionWrite = new Contract(
            electionContractAddress,
            ElectionArtifact.abi,
            signer
          );
          console.log(signer)

          setElectionReadContract(electionRead);
          setElectionWriteContract(electionWrite);

          // Récupération de l'adresse du propriétaire via contractHolder()
          const ownerAddress = await electionRead.contractHolder();
          setOwner(ownerAddress);

          // Vérifier si l'utilisateur courant est admin
          const isUserAdmin = await electionRead.admins(accounts[0]);
          setIsAdmin(isUserAdmin);
          setLoading(false);
        } catch (error) {
          console.error("Erreur d'initialisation:", error);
          alert("Erreur lors de la connexion à MetaMask ou du contrat.");
        }
      } else {
        alert("Veuillez installer MetaMask !");
      }
    }
    init();
  }, []);

  const normalizedAccount = typeof account === "string" ? account : account?.address || "";
  const handleTabChange = (event, newValue) => setTab(newValue);

  if (loading) return <div>Chargement...</div>;

  return (
    <Box className="App">
      <header className="App-header">
        <Typography variant="h4">Élections Présidentielles</Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography variant="body2">
            Compte connecté : {normalizedAccount}{" "}
            {normalizedAccount.toLowerCase() === owner.toLowerCase() && "(Holder)"}
          </Typography>
          <Button variant="outlined" color="secondary" onClick={handleLogout}>
            Déconnexion
          </Button>
        </Box>
        <MenuTabs currentTab={tab} handleTabChange={handleTabChange} />
      </header>

      <main className="app-content">
        <TabPanel value={tab} index={0}>
          <ElectionList
            contract={electionWriteContract}
            normalizedAccount={normalizedAccount}
            owner={owner}
          />
        </TabPanel>

        <TabPanel value={tab} index={1}>
          <ElectionCreator contract={electionWriteContract} />
        </TabPanel>

        <TabPanel value={tab} index={2}>
          {normalizedAccount.toLowerCase() === owner.toLowerCase() ? (
            <AdminManagerPanel
              contract={electionWriteContract}
              owner={owner}
              normalizedAccount={normalizedAccount}
            />
          ) : (
            <Typography variant="body1">
              Accès réservé au contract holder.
            </Typography>
          )}
        </TabPanel>

        <TabPanel value={tab} index={3}>
          <CandidateList
            contract={electionWriteContract}
            normalizedAccount={normalizedAccount}
            isAdmin={isAdmin}
          />
        </TabPanel>

        <TabPanel value={tab} index={4}>
          <VoterManagerPanel contract={electionWriteContract} isAdmin={isAdmin} />
        </TabPanel>

        <TabPanel value={tab} index={5}>
          <OwnershipTransferPanel
            contract={electionWriteContract}
            normalizedAccount={normalizedAccount}
            owner={owner}
          />
        </TabPanel>
      </main>
    </Box>
  );
}

export default App;