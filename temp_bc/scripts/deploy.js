const hre = require("hardhat");

async function main() {
  try {
    const [deployer] = await hre.ethers.getSigners();
    console.log("\n🚀 Starting deployment...");
    console.log("Deployer:", deployer.address);

    // 1. Deploy INNOVToken
    console.log("Deploying INNOVToken...");
    const INNOVToken = await hre.ethers.getContractFactory("INNOVToken");
    const innovToken = await INNOVToken.deploy();
    await innovToken.waitForDeployment();
    const innovAddr = await innovToken.getAddress();
    console.log("✅ INNOVToken:", innovAddr);

    // 2. Deploy NFTCertificate
    console.log("Deploying NFTCertificate...");
    const NFTCertificate = await hre.ethers.getContractFactory("NFTCertificate");
    const nftCert = await NFTCertificate.deploy();
    await nftCert.waitForDeployment();
    const nftAddr = await nftCert.getAddress();
    console.log("✅ NFTCertificate:", nftAddr);

    // 3. Deploy ChallengeRewards
    console.log("Deploying ChallengeRewards...");
    const ChallengeRewards = await hre.ethers.getContractFactory("ChallengeRewards");
    const rewards = await ChallengeRewards.deploy(innovAddr, nftAddr);
    await rewards.waitForDeployment();
    const rewardsAddr = await rewards.getAddress();
    console.log("✅ ChallengeRewards:", rewardsAddr);

    // 4. Deploy Governance
    console.log("Deploying Governance...");
    const Governance = await hre.ethers.getContractFactory("Governance");
    const governance = await Governance.deploy(innovAddr);
    await governance.waitForDeployment();
    const governanceAddr = await governance.getAddress();
    console.log("✅ Governance:", governanceAddr);

    console.log("\n🔗 Wiring contracts...");
    await (await innovToken.setRewardsContract(rewardsAddr)).wait();
    await (await innovToken.setGovernanceContract(governanceAddr)).wait();
    await (await nftCert.setRewardsContract(rewardsAddr)).wait();
    console.log("✅ Wiring complete");

    console.log("\n🌱 Seeding data...");
    await (await rewards.createChallenge("Propose a climate solution", "climate", "easy", 50, 100, 7)).wait();
    await (await rewards.createChallenge("ZK proofs in healthcare", "web3", "hard", 80, 150, 14)).wait();
    console.log("✅ Seeding complete");

    console.log("\nDEPLOYMENT_SUMMARY_START");
    console.log(`INNOV_TOKEN=${innovAddr}`);
    console.log(`CHALLENGE_REWARDS=${rewardsAddr}`);
    console.log(`NFT_CERTIFICATE=${nftAddr}`);
    console.log(`GOVERNANCE=${governanceAddr}`);
    console.log("DEPLOYMENT_SUMMARY_END");

  } catch (error) {
    console.error("\n❌ DEPLOYMENT FAILED:");
    console.error(error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
