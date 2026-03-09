import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Get fee recipient address from environment or use deployer
  const feeRecipient = process.env.FEE_RECIPIENT || deployer.address;
  console.log("Fee recipient:", feeRecipient);

  // Deploy MagmaEscrow
  console.log("\n--- Deploying MagmaEscrow ---");
  const MagmaEscrow = await ethers.getContractFactory("MagmaEscrow");
  const escrow = await MagmaEscrow.deploy(feeRecipient);
  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();
  console.log("MagmaEscrow deployed to:", escrowAddress);

  // Deploy MagmaNFTMarketplace
  console.log("\n--- Deploying MagmaNFTMarketplace ---");
  const MagmaNFTMarketplace = await ethers.getContractFactory("MagmaNFTMarketplace");
  const marketplace = await MagmaNFTMarketplace.deploy(feeRecipient);
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();
  console.log("MagmaNFTMarketplace deployed to:", marketplaceAddress);

  // Log deployment summary
  console.log("\n=== Deployment Summary ===");
  console.log("Network:", (await ethers.provider.getNetwork()).name);
  console.log("Chain ID:", (await ethers.provider.getNetwork()).chainId.toString());
  console.log("MagmaEscrow:", escrowAddress);
  console.log("MagmaNFTMarketplace:", marketplaceAddress);
  console.log("Fee Recipient:", feeRecipient);
  console.log("Platform Fee: 2.5%");

  // Verify initial state
  console.log("\n=== Initial State ===");
  console.log("Escrow - Order Counter:", (await escrow.orderCounter()).toString());
  console.log("Escrow - Platform Fee:", (await escrow.platformFeePercent()).toString(), "basis points");
  console.log("Marketplace - Listing Counter:", (await marketplace.listingCounter()).toString());
  console.log("Marketplace - Platform Fee:", (await marketplace.platformFeePercent()).toString(), "basis points");

  // Output environment variables for backend
  console.log("\n=== Environment Variables ===");
  const network = (await ethers.provider.getNetwork()).chainId === 43113n ? "FUJI" : "MAINNET";
  console.log(`ESCROW_CONTRACT_${network}=${escrowAddress}`);
  console.log(`NFT_MARKETPLACE_${network}=${marketplaceAddress}`);

  return {
    escrow: escrowAddress,
    marketplace: marketplaceAddress,
    feeRecipient,
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
