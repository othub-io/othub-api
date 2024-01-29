const axios = require("axios");
require("dotenv").config();
const api_key = process.env.DEMO_API_KEY;

const assetInventory = async (api_key) => {
  const config = {
    headers: {
      "X-API-Key": api_key,
    },
  };

  const data = {
    owner: "0x0EFA0c78aA0E5CB851E909614c22C98E68dd882d",
    network: "otp:20430"
  };

  response = await axios.post(
    `https://api.othub.io/assets/inventory`,
    data,
    config
  );
  console.log(`----------INVENTORY------------`);
  console.log(response.data);
};

assetInventory(api_key);
