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
    network: "otp:2043",
    nodeId: "",
    owner: "0x840AF7A83c5fEfA87A360FB98c027a40E7e58F1b"
  };

  const response = await axios
    .post(`https://api.othub.io/nodes/info`, data, config)
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
