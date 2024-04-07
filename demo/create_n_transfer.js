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
    blockchain: "gnosis:10200",
    epochs: 1,
    receiver: '0x0efa0c78aa0e5cb851e909614c22c98e68dd882d',
    asset: 
    {
      "@context": "https://schema.org",
      "@type": "Person",
      "name": "Eric Jaurena",
      "description": "Big burly guy last spotted with a monster beard and tats. Possibly retarded.",
      "location": {
        "@type": "Place",
        "name": "USA"
      },
      "jobTitle": "Head of Ecosystem",
      "worksFor": {
        "@type": "Organization",
        "name": "Upshot"
      },
      "relatedTo": {
        "@type": "Person",
        "name": [
          "https://t.me/LinkedEric",
          "https://twitter.com/LinkedEric",
          "https://www.linkedin.com/in/eric-jaurena-07a1b818b/"
        ]
      }
    }
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
