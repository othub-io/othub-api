const axios = require("axios");
require("dotenv").config();
const api_key = process.env.DEMO_API_KEY;

const getBidSuggestion = async (api_key) => {
  const config = {
    headers: {
      "X-API-Key": api_key,
    },
  };

  const data = {
    receipt: "3f65ab68-6a49-11ee-9b45-74563c6f5022"
  };

  const response = await axios
    .post(`http://localhost:5575/dkg/checkTransaction`, data, config)
    .then((response) => {
      // Handle the successful response here
      return response;
    })
    .catch((error) => {
      // Handle errors here
      console.error(error);
    });
  console.log(`----------RECEIPT RESULT------------`);
  console.log(response.data);

};

getBidSuggestion(api_key);
