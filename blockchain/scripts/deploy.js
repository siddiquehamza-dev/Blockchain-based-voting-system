// scripts/deploy.js
// Run: npx hardhat run scripts/deploy.js --network localhost

const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying Voting contract...\n");

  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📋 Deploying with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Deploy the contract
  const Voting = await hre.ethers.getContractFactory("Voting");
  const voting = await Voting.deploy();
  await voting.waitForDeployment();

  const contractAddress = await voting.getAddress();
  console.log("✅ Voting contract deployed to:", contractAddress);
  console.log("\n📝 UPDATE THIS ADDRESS IN:");
  console.log("   frontend/src/utils/config.js  → CONTRACT_ADDRESS");
  console.log("   backend/.env                  → CONTRACT_ADDRESS\n");

  // Save deployment info to a file for reference
  const fs = require("fs");
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: contractAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
  };

  fs.writeFileSync(
    "./deployment.json",
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("💾 Deployment info saved to blockchain/deployment.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
