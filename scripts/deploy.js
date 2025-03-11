async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const OrionToken = await ethers.getContractFactory("OrionToken");
  const token = await OrionToken.deploy();
  await token.deployed();

  console.log("OrionToken deployed to:", token.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
