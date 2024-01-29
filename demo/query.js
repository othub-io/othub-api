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
    network: "otp:20430",
    query: `SELECT ?subject ?predicate ?object
    WHERE {
      ?subject ?predicate ?object.
      FILTER (str(?object) = "cat")
    }
    `
  };

  const response = await axios
    .post(`https://api.othub.io/dkg/query`, data, config)
    .then((response) => {
      // Handle the successful response here
      return response;
    })
    .catch((error) => {
      // Handle errors here
      console.error(error);
    });

  console.log(`----------QUERY------------`);
  console.log(response.data);

};

query(api_key);
