import { ethers } from "hardhat";

async function main() {
  // Adresa contractului token-ului implementat - înlocuiți cu adresa obținută după implementare
  const tokenAddress = "0x9807C001b13521041aD3dbdda59e25bE074Eb63d";
  
  // Obținem conturile
  const [owner, user1, user2] = await ethers.getSigners();
  
  // Atașăm la contractul existent
  const OrionixToken = await ethers.getContractFactory("OrionixToken");
  const token = await OrionixToken.attach(tokenAddress);
  
  console.log("Interacționăm cu Orionix Token la adresa:", token.address);
  
  // Obține informații de bază
  const name = await token.name();
  const symbol = await token.symbol();
  const decimals = await token.decimals();
  const totalSupply = await token.totalSupply();
  const maxSupply = await token.maxSupply();
  const taxPercentage = await token.taxPercentage();
  
  console.log(`Informații token: ${name} (${symbol}), Decimale: ${decimals}`);
  console.log(`Cantitate totală: ${ethers.utils.formatEther(totalSupply)} din maxim ${ethers.utils.formatEther(maxSupply)}`);
  console.log(`Taxă curentă: ${taxPercentage}%`);
  
  // Verificăm soldul proprietarului
  const ownerBalance = await token.balanceOf(owner.address);
  console.log(`Sold proprietar: ${ethers.utils.formatEther(ownerBalance)} ${symbol}`);
  
  // Transferăm tokeni la user1
  const transferAmount = ethers.utils.parseEther("1000");
  console.log(`\nTransfer ${ethers.utils.formatEther(transferAmount)} ${symbol} către ${user1.address}`);
  
  await token.transfer(user1.address, transferAmount);
  console.log("Transfer realizat!");
  
  // Verificăm soldurile după transfer
  const ownerBalanceAfter = await token.balanceOf(owner.address);
  const user1Balance = await token.balanceOf(user1.address);
  
  console.log(`Sold proprietar nou: ${ethers.utils.formatEther(ownerBalanceAfter)} ${symbol}`);
  console.log(`Sold user1: ${ethers.utils.formatEther(user1Balance)} ${symbol}`);
  
  // Excludem user1 de la taxe
  console.log("\nExcludem user1 de la taxe");
  await token.excludeFromTax(user1.address, true);
  
  // Transferăm tokeni de la user1 la user2 (fără taxă)
  const user1ToUser2Amount = ethers.utils.parseEther("500");
  console.log(`\nTransfer ${ethers.utils.formatEther(user1ToUser2Amount)} ${symbol} de la user1 către user2 (fără taxă)`);
  
  await token.connect(user1).transfer(user2.address, user1ToUser2Amount);
  
  // Verificăm soldurile după al doilea transfer
  const user1BalanceAfter = await token.balanceOf(user1.address);
  const user2Balance = await token.balanceOf(user2.address);
  
  console.log(`Sold user1 nou: ${ethers.utils.formatEther(user1BalanceAfter)} ${symbol}`);
  console.log(`Sold user2: ${ethers.utils.formatEther(user2Balance)} ${symbol}`);
  
  // Demonstrăm distribuirea de recompense
  const rewardAmount = ethers.utils.parseEther("100");
  console.log(`\nDistribuire recompensă de ${ethers.utils.formatEther(rewardAmount)} ${symbol} către user2`);
  
  await token.distributeRewards(user2.address, rewardAmount);
  
  const user2BalanceAfterReward = await token.balanceOf(user2.address);
  console.log(`Sold user2 după recompensă: ${ethers.utils.formatEther(user2BalanceAfterReward)} ${symbol}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 