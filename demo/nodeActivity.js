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
    network: "mainnet",
    nodeId: "",
    timeframe: "1min",
    ual: "did:dkg:otp:2043/0x5cAC41237127F94c2D21dAe0b14bFeFa99880630/104710"
  };

  // const response = await axios
  //   .post(`https://api.othub.io/dkg/query`, data, config)
  //   .then((response) => {
  //     // Handle the successful response here
  //     return response;
  //   })
  //   .catch((error) => {
  //     // Handle errors here
  //     console.error(error);
  //   });

  const response = await axios
    .post(`http://localhost:5575/nodes/activity`, data, config)
    .then((response) => {
      // Handle the successful response here
      return response;
    })
    .catch((error) => {
      // Handle errors here
      console.error(error);
    });

  console.log(`----------NODE ACTIVITY------------`);
  console.log(response.data);

};

query(api_key);
