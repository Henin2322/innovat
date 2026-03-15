const { ethers } = require("ethers");

async function main() {
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    const faucet = new ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", provider);
    
    console.log("Testing TX from", faucet.address);
    const nonce = await provider.getTransactionCount(faucet.address, "latest");
    console.log("Current Nonce:", nonce);
    
    try {
        const tx = await faucet.sendTransaction({
            to: faucet.address,
            value: 0,
            nonce: nonce
        });
        console.log("TX Sent:", tx.hash);
        await tx.wait();
        console.log("✅ TX Confirmed");
    } catch (e) {
        console.error("❌ TX Failed:", e.message);
        if (e.message.includes("nonce")) {
            console.log("Trying with Nonce + 1...");
            const tx2 = await faucet.sendTransaction({
                to: faucet.address,
                value: 0,
                nonce: nonce + 1
            });
            await tx2.wait();
            console.log("✅ TX Confirmed with Nonce + 1");
        }
    }
}

main().catch(console.error);
