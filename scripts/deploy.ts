import { ethers } from "hardhat";

async function main() {
  const ContractFactory = await ethers.getContractFactory("PresidentialElection");

  const contract = await ContractFactory.deploy(); // ✅ c'est ici qu'on crée une instance
  await contract.waitForDeployment();

  console.log("Contrat déployé à :", await contract.getAddress());
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
