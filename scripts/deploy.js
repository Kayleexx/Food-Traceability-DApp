const { ethers } = require('hardhat');

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log('Deploying contracts with the account:', deployer.address);

  const FoodTraceability = await ethers.getContractFactory('FoodTraceability');
  const foodTraceability = await FoodTraceability.deploy();

  await foodTraceability.deployed();

  console.log('FoodTraceability deployed to:', foodTraceability.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
