const axios = require("axios");
require("dotenv").config();
const api_key = process.env.DEMO_API_KEY;

const getBidSuggestion = async (api_key) => {
  const config = {
    headers: {
      "X-API-Key": api_key,
    },
  };

  const data = {
    network: "otp::testnet",
    epochs: 2,
    asset: {
      "@type": "Car",
      Make: "Toyota",
      Model: "MR2",
      Year: "2003",
    },
  };

  const response = await axios
    .post(`http://localhost:5575/dkg/getBidSuggestion`, data, config)
    .then((response) => {
      // Handle the successful response here
      return response;
    })
    .catch((error) => {
      // Handle errors here
      console.error(error);
    });
  console.log(`----------BID SUGGESTION------------`);
  console.log(response.data);

};

getBidSuggestion(api_key);
