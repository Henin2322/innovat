const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
    console.log("\n🚀 Starting standalone deployment with manual nonce control...");
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    
    // Hardhat Account #0
    const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
    const wallet = new ethers.Wallet(privateKey, provider);
    
    console.log("Deployer:", wallet.address);

    const artifactsDir = path.join(__dirname, "..", "artifacts_solc");

    const getContract = (name) => {
        const abiPath = path.join(artifactsDir, `contracts_${name}_sol_${name}.abi`);
        const binPath = path.join(artifactsDir, `contracts_${name}_sol_${name}.bin`);
        const abi = JSON.parse(fs.readFileSync(abiPath, "utf8"));
        const bin = "0x" + fs.readFileSync(binPath, "utf8").trim();
        return { abi, bin };
    };

    let nonce = await provider.getTransactionCount(wallet.address, "latest");
    console.log("Starting Nonce:", nonce);

    const deployContract = async (name, args = []) => {
        const data = getContract(name);
        const factory = new ethers.ContractFactory(data.abi, data.bin, wallet);
        console.log(`Deploying ${name} (nonce: ${nonce})...`);
        const contract = await factory.deploy(...args, { nonce: nonce++ });
        await contract.waitForDeployment();
        const addr = await contract.getAddress();
        console.log(`✅ ${name}:`, addr);
        await sleep(1000); // 1s buffer
        return { addr, abi: data.abi };
    };

    // 1. Deploy INNOVToken
    const innov = await deployContract("INNOVToken");

    // 2. Deploy NFTCertificate
    const nft = await deployContract("NFTCertificate");

    // 3. Deploy ChallengeRewards
    const rewards = await deployContract("ChallengeRewards", [innov.addr, nft.addr]);

    // 4. Deploy Governance
    const governance = await deployContract("Governance", [innov.addr]);

    console.log("\n🔗 Wiring contracts...");
    const innovInst = new ethers.Contract(innov.addr, innov.abi, wallet);
    const nftInst = new ethers.Contract(nft.addr, nft.abi, wallet);
    
    console.log(`Wiring INNOVToken (nonce: ${nonce})...`);
    await (await innovInst.setRewardsContract(rewards.addr, { nonce: nonce++ })).wait();
    await sleep(500);
    
    console.log(`Wiring INNOVToken for Governance (nonce: ${nonce})...`);
    await (await innovInst.setGovernanceContract(governance.addr, { nonce: nonce++ })).wait();
    await sleep(500);

    console.log(`Wiring NFTCertificate (nonce: ${nonce})...`);
    await (await nftInst.setRewardsContract(rewards.addr, { nonce: nonce++ })).wait();
    await sleep(500);
    console.log("✅ Wiring complete");

    console.log("\n🌱 Seeding data...");
    const rewardsInst = new ethers.Contract(rewards.addr, rewards.abi, wallet);
    console.log(`Creating Challenge 1 (nonce: ${nonce})...`);
    await (await rewardsInst.createChallenge("Propose a climate solution", "climate", "easy", 50, 100, 7, { nonce: nonce++ })).wait();
    await sleep(500);

    console.log(`Creating Challenge 2 (nonce: ${nonce})...`);
    await (await rewardsInst.createChallenge("ZK proofs in healthcare", "web3", "hard", 80, 150, 14, { nonce: nonce++ })).wait();
    console.log("✅ Seeding complete");

    console.log("\nDEPLOYMENT_SUMMARY_START");
    console.log(`INNOV_TOKEN=${innov.addr}`);
    console.log(`CHALLENGE_REWARDS=${rewards.addr}`);
    console.log(`NFT_CERTIFICATE=${nft.addr}`);
    console.log(`GOVERNANCE=${governance.addr}`);
    console.log("DEPLOYMENT_SUMMARY_END");
}

main().catch((error) => {
    console.error("\n❌ DEPLOYMENT FAILED:");
    console.error(error);
    process.exit(1);
});
