const axios = require("axios");
require("dotenv").config();
const api_key = process.env.DEMO_API_KEY;

const query = async (api_key) => {
  const config = {
    headers: {
      "X-API-Key": api_key,
    },
  };

  const data = {
    network: "DKG Mainnet",
    blockchain: "Gnosis Mainnet",
    frequency: "monthly",
    timeframe: "12"
  };

  const response = await axios
    .post(`http://localhost:5575/pubs/stats`, data, config)
    .then((response) => {
      // Handle the successful response here
      return response;
    })
    .catch((error) => {
      // Handle errors here
      console.error(error);
    });

  console.log(`----------NODE ACTIVITY------------`);
  console.log(response.data.result);

};

query(api_key);
