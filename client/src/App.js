import React, { useState, useEffect } from 'react';
import { Form, Button, Table } from 'react-bootstrap';
import Web3 from 'web3';
import FoodTraceabilityContract from './FoodTraceability.json';
import Styles from './App.css';

const App = () => {
  const [web3, setWeb3] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [contract, setContract] = useState(null);
  const [productName, setProductName] = useState('');
  const [producer, setProducer] = useState('');
  const [platforms, setPlatforms] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [vendorAddress, setVendorAddress] = useState('');
  const [traceabilityData, setTraceabilityData] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [networkError, setNetworkError] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const initWeb3 = async () => {
      if (typeof window.ethereum === 'undefined') {
        console.log('Web3 not available.');
        return;
      }

      try {
        const web3Instance = new Web3(window.ethereum);
        const accounts = await web3Instance.eth.getAccounts();
        const networkId = await web3Instance.eth.net.getId();

        const parsedNetworkId = parseInt(networkId, 10);

        if (parsedNetworkId === 80001) {
          const contractInstance = new web3Instance.eth.Contract(
            FoodTraceabilityContract.abi,
            '0x114503Fe5517A9cBb691090B14685cCA67477AFd' // Replace with the actual contract address
          );

          setWeb3(web3Instance);
          setAccounts(accounts);
          setContract(contractInstance);
          setNetworkError(false);
        } else {
          console.error('Not connected to the Mumbai testnet.');
          setNetworkError(true);
        }
      } catch (error) {
        console.error('Error initializing Web3:', error);
      }
    };

    initWeb3();
  }, []);

  useEffect(() => {
    if (contract && accounts.length > 0){
      fetchTraceabilityData();
      fetchVendors();

      const productAddedEvent = contract.events.ProductAdded();
      const vendorRegisteredEvent = contract.events.VendorRegistered();
      const vendorVerifiedEvent = contract.events.VendorVerified();

      const handleProductAddedEvent = event => {
        try {
          console.log('Product Added Event:', event.returnValues);
          fetchTraceabilityData();
        } catch (error) {
          console.error('Error handling ProductAdded event:', error);
        }
      };

      const handleVendorRegisteredEvent = event => {
        try {
          console.log('Vendor Registered Event:', event.returnValues);
          fetchVendors();
        } catch (error) {
          console.error('Error handling VendorRegistered event:', error);
        }
      };

      const handleVendorVerifiedEvent = event => {
        try {
          console.log('Vendor Verified Event:', event.returnValues);
          fetchVendors();
        } catch (error) {
          console.error('Error handling VendorVerified event:', error);
        }
      };

      productAddedEvent.on('data', handleProductAddedEvent);
      vendorRegisteredEvent.on('data', handleVendorRegisteredEvent);
      vendorVerifiedEvent.on('data', handleVendorVerifiedEvent);

      return () => {
        productAddedEvent.unsubscribe();
        vendorRegisteredEvent.unsubscribe();
        vendorVerifiedEvent.unsubscribe();
      };
    }
  }, [contract]);

  const handleAddProduct = async () => {
    try {
      if (!contract) {
        console.error('Contract not initialized.');
        return;
      }

      if (!productName || !producer || !platforms) {
        console.error('Please fill in all fields.');
        return;
      }

      const platformArray = platforms.split(',').map(platform => platform.trim());

      const formattedProducer = web3.utils.toChecksumAddress(producer);
      const formattedPlatforms = platformArray.map(address => web3.utils.toChecksumAddress(address));

      await contract.methods.addFoodProduct(productName, formattedProducer, formattedPlatforms).send({ from: accounts[0] });

      setSuccessMessage('Product added successfully!');

      await fetchTraceabilityData();
    } catch (error) {
      console.error('Error adding product:', error);
    }
  };

  const handleRegisterVendor = async () => {
    try {
      if (!contract) {
        console.error('Contract not initialized.');
        return;
      }

      if (!vendorName || !vendorAddress) {
        console.error('Please fill in all fields.');
        return;
      }

      await contract.methods.registerVendor(vendorName, vendorAddress).send({ from: accounts[0] });

      await fetchVendors();
    } catch (error) {
      console.error('Error registering vendor:', error);
    }
  };

  const handleVerifyVendor = async () => {
    try {
      if (!contract) {
        console.error('Contract not initialized.');
        return;
      }

      if (!vendorAddress) {
        console.error('Please enter a vendor address.');
        return;
      }

      await contract.methods.verifyVendor(vendorAddress).send({ from: accounts[0] });

      await fetchVendors();
    } catch (error) {
      console.error('Error verifying vendor:', error);
    }
  };

  const fetchTraceabilityData = async () => {
    try {
      if (!contract) {
        console.error('Contract not initialized.');
        return;
      }

      const dataCount = await contract.methods.getFoodProductCount().call();
      const data = [];

      for (let i = 0; i < dataCount; i++) {
        const traceData = await contract.methods.getFoodProduct(i).call();
        data.push([
          traceData[0], // Product Name
          traceData[1], // Producer
          Number(traceData[2]), // Convert timestamp to a number
          traceData[3], // Platforms
        ]);
      }

      setTraceabilityData(data);
    } catch (error) {
      console.error('Error fetching traceability data:', error);
    }
  };

  const fetchVendors = async () => {
    try {
      if (!contract) {
        console.error('Contract not initialized.');
        return;
      }
  
      const vendorCount = await contract.methods.getVendorCount().call();
      const vendorList = [];
  
      for (let i = 0; i < vendorCount; i++) {
        try {
          const vendor = await contract.methods.getVendor(i).call();
          vendorList.push([
            vendor[0], // Vendor Name
            vendor[1], // Address
            Boolean(vendor[2]), // Convert to boolean
          ]);
        } catch (error) {
          console.error('Error fetching vendor data for index', i, ':', error);
        }
      }
  
      setVendors(vendorList);
    } catch (error) {
      console.error('Error fetching vendor data:', error);
    }
  };
  

  return (
    <div className="App">
      <header className="header animated fadeIn"> 
        <h1>Food Traceability App</h1>
      </header>
      <div className="container">
        <section>
          <h2>Add Food Product</h2>
          <Form>
            <Form.Group controlId="productName">
              <Form.Label>Product Name</Form.Label>
              <Form.Control type="text" value={productName} onChange={(e) => setProductName(e.target.value)} />
            </Form.Group>
            <Form.Group controlId="producer">
              <Form.Label>Producer</Form.Label>
              <Form.Control type="text" value={producer} onChange={(e) => setProducer(e.target.value)} />
            </Form.Group>
            <Form.Group controlId="platforms">
              <Form.Label>Platforms (comma-separated)</Form.Label>
              <Form.Control type="text" value={platforms} onChange={(e) => setPlatforms(e.target.value)} />
            </Form.Group>
            <Button variant="primary" onClick={handleAddProduct}>Add Product</Button>
            {successMessage && <p className="success-message">{successMessage}</p>}
          </Form>
        </section>

        <section>
          <h2>Register Vendor</h2>
          <Form>
            <Form.Group controlId="vendorName">
              <Form.Label>Vendor Name</Form.Label>
              <Form.Control type="text" value={vendorName} onChange={(e) => setVendorName(e.target.value)} />
            </Form.Group>
            <Form.Group controlId="vendorAddress">
              <Form.Label>Vendor Ethereum Address</Form.Label>
              <Form.Control type="text" value={vendorAddress} onChange={(e) => setVendorAddress(e.target.value)} />
            </Form.Group>
            <Button variant="primary" onClick={handleRegisterVendor}>Register Vendor</Button>
          </Form>
        </section>

        <section>
          <h2>Verify Vendor</h2>
          <Form>
            <Form.Group controlId="verifyVendorAddress">
              <Form.Label>Vendor Ethereum Address</Form.Label>
              <Form.Control type="text" value={vendorAddress} onChange={(e) => setVendorAddress(e.target.value)} />
            </Form.Group>
            <Button variant="primary" onClick={handleVerifyVendor}>Verify Vendor</Button>
          </Form>
        </section>

        <section>
          <h2>Traceability Data</h2>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Producer</th>
                <th>Timestamp</th>
                <th>Platforms</th>
              </tr>
            </thead>
            <tbody>
              {traceabilityData.map((product, index) => (
                <tr key={index}>
                  <td>{product[0]}</td>
                  <td>{product[1]}</td>
                  <td>{new Date(product[2] * 1000).toLocaleString()}</td>
                  <td>{product[3].join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </section>

        <section>
          <h2>Vendor Information</h2>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Vendor Name</th>
                <th>Address</th>
                <th>Verified</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((vendor, index) => (
                <tr key={index}>
                  <td>{vendor[0]}</td>
                  <td>{vendor[1]}</td>
                  <td>{vendor[2] ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </section>

        <section className="about-me">
          <h2>About Me</h2>
          <p>
            Hi there! I'm passionate about blockchain technology and its applications in the food industry.
            This app is designed to showcase the traceability of food products using Ethereum smart contracts.
            Feel free to explore and learn more about how blockchain can enhance food supply chains.
          </p>
        </section>

        <section className="contact">
          <h2>Contact Details</h2>
          <p>
            Have questions or want to get in touch? Reach out to me at:
            <br />
            Email: kaylee@hotmail.com
            <br />
            Twitter: @web3withkaylee
          </p>
        </section>

      </div>
    </div>
  );
};

export default App;
