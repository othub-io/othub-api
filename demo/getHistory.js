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
    ual: "did:dkg:otp:20430/0x1a061136ed9f5ed69395f18961a0a535ef4b3e5f/1830590",
    network: "otp:20430"
  };

  response = await axios.post(
    `https://api.othub.io/assets/history`,
    data,
    config
  );
  console.log(`----------HISTORY------------`);
  console.log(response.data);
};

getHistory(api_key);
