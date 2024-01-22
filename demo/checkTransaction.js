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
    receipt: "d9e654f3-b8be-11ee-a10d-74563c6f5022"
  };

  // const response = await axios
  //   .post(`https://api.othub.io/dkg/checkTransaction`, data, config)
  //   .then((response) => {
  //     // Handle the successful response here
  //     return response;
  //   })
  //   .catch((error) => {
  //     // Handle errors here
  //     console.error(error);
  //   });

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
  console.log(response.data);

};

getBidSuggestion(api_key);
