const axios = require("axios");
require("dotenv").config();
const api_key = process.env.DEMO_API_KEY;

const create_n_transfer = async (api_key) => {
  const config = {
    headers: {
      "X-API-Key": api_key,
    },
  };

  const data = {
    network: "otp::testnet",
    epochs: 2,
    receiver: '0x0EFA0c78aA0E5CB851E909614c22C98E68dd882d',
    asset: {
      "@type": "Car",
      Make: "Toyota",
      Model: "MR2",
      Year: "2003",
    },
  };

  const response = await axios
    .post(`http://localhost:5575/dkg/create_n_transfer`, data, config)
    .then((response) => {
      // Handle the successful response here
      return response;
    })
    .catch((error) => {
      // Handle errors here
      console.error(error);
    });
  console.log(`----------CREATE-N-TRANSFER------------`);
  console.log(response);

};

create_n_transfer(api_key);
