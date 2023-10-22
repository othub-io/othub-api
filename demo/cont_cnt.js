const axios = require("axios");
require("dotenv").config();
const api_key = process.env.DEMO_API_KEY;

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

const config = {
  headers: {
    "X-API-Key": api_key,
  },
};

const data = {
  network: "otp::testnet",
  epochs: 1,
  receiver: "0x0EFA0c78aA0E5CB851E909614c22C98E68dd882d",
  asset: {
    "@type": "Car",
    Make: "Toyota",
    Model: "MR2",
    Year: "2000",
    Color: "Super White",
    Mileage: "62000mi",
    Transmission: "5 Spd Manual"
  },
};

const create_n_transfer = async () => {
  try {
    for (i = 0; i < 100000; i++) {
      // const response = await axios
      //   .post(`https://api.othub.io/dkg/create_n_transfer`, data, config)
      //   .then((response) => {
      //     // Handle the successful response here
      //     return response;
      //   })
      //   .catch((error) => {
      //     // Handle errors here
      //     console.error(error);
      //   });
      // console.log(`----------CREATE-N-TRANSFER------------`);
      // console.log(response);

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

      await sleep(3000);
    }
  } catch (e) {
    console.log(e);
  }
};

create_n_transfer();
