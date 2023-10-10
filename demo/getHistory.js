const axios = require("axios");
require("dotenv").config();
const api_key = process.env.DEMO_API_KEY;

const getHistory = async (api_key) => {
  const config = {
    headers: {
      "X-API-Key": api_key,
    },
  };

  const data = {
    ual: "did:dkg:otp/0x1A061136Ed9f5eD69395f18961a0a535EF4B3E5f/427145",
  };

  response = await axios.post(
    `https://api.othub.io/otp_testnet/assetHistory`,
    data,
    config
  );
  console.log(`----------HISTORY------------`);
  console.log(response.data);
};

getHistory(api_key);
