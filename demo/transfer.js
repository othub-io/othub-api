const axios = require("axios");
require("dotenv").config();
const api_key = process.env.DEMO_API_KEY;

const transfer = async (api_key) => {
  const config = {
    headers: {
      "X-API-Key": api_key,
    },
  };

  const data = {
    network: "otp:20430",
    epochs: 2,
    approver: '0x0EFA0c78aA0E5CB851E909614c22C98E68dd882d',
    receiver: '0x0EFA0c78aA0E5CB851E909614c22C98E68dd882d',
    ual: 'did:dkg:otp/0x1A061136Ed9f5eD69395f18961a0a535EF4B3E5f/427068',
  };

  // const response = await axios
  //   .post(`https://api.othub.io/dkg/transfer`, data, config)
  //   .then((response) => {
  //     // Handle the successful response here
  //     return response;
  //   })
  //   .catch((error) => {
  //     // Handle errors here
  //     console.error(error);
  //   });

  const response = await axios
    .post(`http://localhost:5575/dkg/transfer`, data, config)
    .then((response) => {
      // Handle the successful response here
      return response;
    })
    .catch((error) => {
      // Handle errors here
      console.error(error);
    });

  console.log(`----------TRANSFER------------`);
  console.log(response.data);

};

transfer(api_key);
