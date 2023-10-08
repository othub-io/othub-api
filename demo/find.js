const axios = require("axios");
require("dotenv").config();
const api_key = process.env.DEMO_API_KEY;

const get = async (api_key) => {
  const config = {
    headers: {
      "X-API-Key": api_key,
    },
  };

  const data = {
    network: "otp::testnet",
    ual: 'did:dkg:otp/0x1A061136Ed9f5eD69395f18961a0a535EF4B3E5f/427145'
  };

  const response = await axios
    .post(`http://localhost:5575/otp_testnet/v_nodes_stats_last`, data, config)
    .then((response) => {
      // Handle the successful response here
      return response;
    })
    .catch((error) => {
      // Handle errors here
      console.error(error);
    });
  console.log(`----------GET------------`);
  console.log(response.data);

};

get(api_key);
