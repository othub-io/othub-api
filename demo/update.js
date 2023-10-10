const axios = require("axios");
require("dotenv").config();
const api_key = process.env.DEMO_API_KEY;

const update = async (api_key) => {
  const config = {
    headers: {
      "X-API-Key": api_key,
    },
  };

  const data = {
    network: "otp::testnet",
    epochs: 2,
    approver: '0x0EFA0c78aA0E5CB851E909614c22C98E68dd882d',
    ual: 'did:dkg:otp/0x1A061136Ed9f5eD69395f18961a0a535EF4B3E5f/427068',
    asset: {
      "@type": "Car",
      Make: "Toyota",
      Model: "MR2",
      Year: "2003",
    },
  };

  const response = await axios
    .post(`https://api.othub.io/dkg/update`, data, config)
    .then((response) => {
      // Handle the successful response here
      return response;
    })
    .catch((error) => {
      // Handle errors here
      console.error(error);
    });
  console.log(`----------UPDATE------------`);
  console.log(response.data);

};

update(api_key);
