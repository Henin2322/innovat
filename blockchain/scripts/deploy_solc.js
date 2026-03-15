const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("\n🚀 Starting manual deployment from solcjs artifacts...");
    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);

    const artifactsDir = path.join(__dirname, "..", "artifacts_solc");

    const getContract = (name) => {
        const abi = JSON.parse(fs.readFileSync(path.join(artifactsDir, `contracts_${name}_sol_${name}.abi`), "utf8"));
        const bin = fs.readFileSync(path.join(artifactsDir, `contracts_${name}_sol_${name}.bin`), "utf8");
        return { abi, bin };
    };

    // 1. Deploy INNOVToken
    console.log("Deploying INNOVToken...");
    const innovData = getContract("INNOVToken");
    const INNOVToken = new ethers.ContractFactory(innovData.abi, innovData.bin, deployer);
    const innovToken = await INNOVToken.deploy();
    await innovToken.waitForDeployment();
    const innovAddr = await innovToken.getAddress();
    console.log("✅ INNOVToken:", innovAddr);

    // 2. Deploy NFTCertificate
    console.log("Deploying NFTCertificate...");
    const nftData = getContract("NFTCertificate");
    const NFTCertificate = new ethers.ContractFactory(nftData.abi, nftData.bin, deployer);
    const nftCert = await NFTCertificate.deploy();
    await nftCert.waitForDeployment();
    const nftAddr = await nftCert.getAddress();
    console.log("✅ NFTCertificate:", nftAddr);

    // 3. Deploy ChallengeRewards
    console.log("Deploying ChallengeRewards...");
    const rewardsData = getContract("ChallengeRewards");
    const ChallengeRewards = new ethers.ContractFactory(rewardsData.abi, rewardsData.bin, deployer);
    const rewards = await ChallengeRewards.deploy(innovAddr, nftAddr);
    await rewards.waitForDeployment();
    const rewardsAddr = await rewards.getAddress();
    console.log("✅ ChallengeRewards:", rewardsAddr);

    // 4. Deploy Governance
    console.log("Deploying Governance...");
    const governanceData = getContract("Governance");
    const Governance = new ethers.ContractFactory(governanceData.abi, governanceData.bin, deployer);
    const governance = await Governance.deploy(innovAddr);
    await governance.waitForDeployment();
    const governanceAddr = await governance.getAddress();
    console.log("✅ Governance:", governanceAddr);

    console.log("\n🔗 Wiring contracts...");
    // Wire using the instances
    const innovInst = new ethers.Contract(innovAddr, innovData.abi, deployer);
    const nftInst = new ethers.Contract(nftAddr, nftData.abi, deployer);
    const rewardsInst = new ethers.Contract(rewardsAddr, rewardsData.abi, deployer);

    await (await innovInst.setRewardsContract(rewardsAddr)).wait();
    await (await innovInst.setGovernanceContract(governanceAddr)).wait();
    await (await nftInst.setRewardsContract(rewardsAddr)).wait();
    console.log("✅ Wiring complete");

    console.log("\n🌱 Seeding data...");
    await (await rewardsInst.createChallenge("Propose a climate solution", "climate", "easy", 50, 100, 7)).wait();
    await (await rewardsInst.createChallenge("ZK proofs in healthcare", "web3", "hard", 80, 150, 14)).wait();
    console.log("✅ Seeding complete");

    console.log("\nDEPLOYMENT_SUMMARY_START");
    console.log(`INNOV_TOKEN=${innovAddr}`);
    console.log(`CHALLENGE_REWARDS=${rewardsAddr}`);
    console.log(`NFT_CERTIFICATE=${nftAddr}`);
    console.log(`GOVERNANCE=${governanceAddr}`);
    console.log("DEPLOYMENT_SUMMARY_END");
}

main().catch((error) => {
    console.error("\n❌ DEPLOYMENT FAILED:");
    console.error(error);
    process.exit(1);
});
