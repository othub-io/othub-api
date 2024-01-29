const axios = require("axios");
require("dotenv").config();
const api_key = process.env.DEMO_API_KEY;

const getOwner = async (api_key) => {
  const config = {
    headers: {
      "X-API-Key": api_key,
    },
  };

  const data = {
    network: "otp:20430",
    ual: 'did:dkg:otp/0x1A061136Ed9f5eD69395f18961a0a535EF4B3E5f/427145'
  };

  const response = await axios
    .post(`https://api.othub.io/dkg/getOwner`, data, config)
    .then((response) => {
      // Handle the successful response here
      return response;
    })
    .catch((error) => {
      // Handle errors here
      console.error(error);
    });
  console.log(`----------GET OWNER------------`);
  console.log(response.data);

};

getOwner(api_key);
