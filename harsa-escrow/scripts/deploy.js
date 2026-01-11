const hre = require("hardhat");

async function main() {
  const Escrow = await hre.ethers.getContractFactory("HarsaEscrow");
  const escrow = await Escrow.deploy();

  await escrow.waitForDeployment();

  console.log("HarsaEscrow deployed to:", await escrow.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});