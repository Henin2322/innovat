"use client";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { polygonMumbai, hardhat } from "wagmi/chains";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo_project_id";
const alchemyUrl = process.env.NEXT_PUBLIC_ALCHEMY_MUMBAI_URL;

export const wagmiConfig = getDefaultConfig({
  appName: "Innovate2Earn",
  projectId,
  chains: [polygonMumbai, hardhat],
  ssr: true,
});

export { polygonMumbai, hardhat };
