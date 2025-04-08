import React, { useEffect, useState } from "react";
import { Grid } from "@mui/material";
import ElectionCard from "./ElectionCard";
import ElectionRounds from "./ElectionRounds";

function ElectionList({ contract, candidatesContract, normalizedAccount, owner }) {
  const [elections, setElections] = useState([]);
  const [selectedElection, setSelectedElection] = useState(null);

  useEffect(() => {
    async function fetchElections() {
      if (contract) {
        try {
          const count = await contract.electionsCount();
          const electionCount = Number(count);
          const electionArray = [];
          for (let i = 1; i <= electionCount; i++) {
            const electionData = await contract.elections(i);
            electionArray.push(electionData);
          }
          setElections(electionArray);
        } catch (error) {
          console.error("Erreur lors de la récupération des élections", error);
        }
      }
    }
    fetchElections();
  }, [contract]);

  if (selectedElection) {
    return (
      <ElectionRounds
        election={selectedElection}
        contract={contract}
        candidatesContract={candidatesContract}
        normalizedAccount={normalizedAccount}
        owner={owner}
        onBack={() => setSelectedElection(null)}
      />
    );
  }

  return (
    <>
      {elections.length === 0 ?
        <></>
        :
        <Grid container spacing={2}>
          {elections.map((election, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <ElectionCard election={election} onSelectElection={setSelectedElection} />
            </Grid>
          ))}
        </Grid>}
    </>
  );
}

export default ElectionList;
