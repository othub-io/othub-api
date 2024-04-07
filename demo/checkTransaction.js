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
    receipt: "b3033346-f2b5-11ee-af86-960002220f0d"
  };

  const response = await axios
    .post(`https://api.othub.io/dkg/checkTransaction`, data, config)
    .then((response) => {
      // Handle the successful response here
      return response;
    })
    .catch((error) => {
      // Handle errors here
      console.error(error);
    });
   console.log(response.data);

};

getBidSuggestion(api_key);
