const hre = require("hardhat");

async function main() {
  console.log("Starting deployment to Arbitrum Sepolia...");

  const HarsaEscrow = await hre.ethers.getContractFactory("HarsaEscrow");
  const escrow = await HarsaEscrow.deploy();

  await escrow.waitForDeployment();

  console.log(`HarsaEscrow deployed to: ${await escrow.getAddress()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});