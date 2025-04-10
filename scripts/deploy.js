// scripts/deploy.js
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Déployer PresidentialElection en passant l'adresse du CandidatesManager
  const PresidentialElection = await ethers.getContractFactory("PresidentialElection");
  const presidentialElectionContract = await PresidentialElection.deploy();
  await presidentialElectionContract.waitForDeployment();
  console.log("PresidentialElection deployed to:", presidentialElectionContract.target);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
