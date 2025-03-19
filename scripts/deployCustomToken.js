import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Implementarea contractului cu contul:", deployer.address);

  // Parametrii pentru moneda Orionix
  const initialSupply = 1000000; // 1 milion de tokeni inițial
  const maxSupply = 10000000; // 10 milioane maxim
  const taxPercentage = 2; // 2% taxă la transfer

  console.log(`Implementarea Orionix Token (ORNX)`);
  console.log(`Cantitate inițială: ${initialSupply}, Cantitate maximă: ${maxSupply}, Taxă: ${taxPercentage}%`);

  const OrionixToken = await ethers.getContractFactory("OrionixToken");
  const token = await OrionixToken.deploy(initialSupply, maxSupply, taxPercentage);
  await token.deployed();

  console.log("Orionix Token implementat la adresa:", token.address);
  console.log("Adresa contract:", token.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 