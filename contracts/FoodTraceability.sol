// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract FoodTraceability {
    struct FoodProduct {
        string productName;
        string producer;
        uint256 timestamp;
        address[] platforms; // List of blockchain platforms where data is recorded
    }

    struct Vendor {
        string name;
        address ethAddress;
        bool isVerified;
    }

    mapping(address => Vendor) public vendors;
    address[] public vendorAddresses;

    FoodProduct[] public foodProducts;
    address public owner;

    event ProductAdded(string productName, string producer, uint256 timestamp);
    event VendorRegistered(string name, address ethAddress);
    event VendorVerified(address ethAddress);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can perform this action");
        _;
    }

    function addFoodProduct(
        string memory _productName,
        string memory _producer,
        address[] memory _platforms
    ) public onlyOwner {
        FoodProduct memory newProduct = FoodProduct({
            productName: _productName,
            producer: _producer,
            timestamp: block.timestamp,
            platforms: _platforms
        });

        foodProducts.push(newProduct);

        emit ProductAdded(_productName, _producer, block.timestamp);
    }

    function registerVendor(string memory _name, address _ethAddress) public {
        Vendor memory newVendor = Vendor({
            name: _name,
            ethAddress: _ethAddress,
            isVerified: false
        });

        vendors[_ethAddress] = newVendor;
        vendorAddresses.push(_ethAddress);

        emit VendorRegistered(_name, _ethAddress);
    }

    function verifyVendor(address _ethAddress) public onlyOwner {
        require(vendors[_ethAddress].ethAddress != address(0), "Vendor not registered");
        vendors[_ethAddress].isVerified = true;

        emit VendorVerified(_ethAddress);
    }

    function getVendorCount() public view returns (uint256) {
        return vendorAddresses.length;
    }

    function getVendor(address _ethAddress) public view returns (string memory, address, bool) {
        return (vendors[_ethAddress].name, vendors[_ethAddress].ethAddress, vendors[_ethAddress].isVerified);
    }

    function getFoodProductCount() public view returns (uint256) {
        return foodProducts.length;
    }

    function getFoodProduct(uint256 index) public view returns (string memory, string memory, uint256, address[] memory) {
        require(index < foodProducts.length, "Invalid index");
    
        FoodProduct storage product = foodProducts[index];
        return (product.productName, product.producer, product.timestamp, product.platforms);
    }
    
    
}
