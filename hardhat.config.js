require("@nomiclabs/hardhat-waffle");

module.exports = {

  solidity: {
    version: "0.8.1",
  },
  
  networks: {
    mumbai: {
      url: "https://rpc-mumbai.maticvigil.com/",
      accounts: ['24cd23a482e9ab5ec92e505539114b9bfb42aff73dde59512d095502d78cdaaa'],
    },
  },
};