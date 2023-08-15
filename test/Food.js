const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('FoodTraceability', function () {
  it('Should add and retrieve a food product', async function () {
    const FoodTraceability = await ethers.getContractFactory('FoodTraceability');
    const foodTraceability = await FoodTraceability.deploy();

    await foodTraceability.deployed();

    const productName = 'Apple';
    const producer = 'FarmCo';
    const platforms = [ethers.constants.AddressZero]; // Replace with actual address

    await foodTraceability.addFoodProduct(productName, producer, platforms);

    const product = await foodTraceability.getFoodProduct(0);

    expect(product.productName).to.equal(productName);
    expect(product.producer).to.equal(producer);
    expect(product.platforms).to.deep.equal(platforms);
  });
});
