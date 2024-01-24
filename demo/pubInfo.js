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
    network: "otp:20430",
    publisher: "",
    ual: "did:dkg:otp:20430/0x1A061136Ed9f5eD69395f18961a0a535EF4B3E5f/457935",
    owner: ""
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
    .post(`http://localhost:5575/pubs/info`, data, config)
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