require("dotenv").config();
const express = require("express");
const router = express.Router();
const ethers = require("ethers");
const queryTypes = require("../../util/queryTypes");
const queryDB = queryTypes.queryDB();

router.post("/", async function (req, res, next) {
  try {
    data = req.body;
    public_address = data.public_address;
    api_key = req.headers["x-api-key"];
    blockchain = "othub_db";
    network = "";

    if (!api_key || api_key === "") {
      console.log(`Create request without authorization.`);
      res.status(401).json({
        success: false,
        msg: "Authorization key not provided.",
      });
      return;
    }

    if (
      !public_address ||
      public_address === "" ||
      !ethers.utils.isAddress(public_address)
    ) {
      console.log(`Register request without valid public_address.`);
      res.status(400).json({
        success: false,
        msg: "Valid public address not provided.",
      });
      return;
    }

    query = `select * from user_header where public_address = ?`;
    params = [public_address];
    user_record = await queryDB
      .getData(query, params, network, blockchain)
      .then((results) => {
        return results;
      })
      .catch((error) => {
        console.error("Error retrieving data:", error);
      });

    if (user_record == "") {
      query = "INSERT INTO user_header values (?,?)";
      nonce = Math.floor(Math.random() * 1000000);
      await queryDB
        .getData(query, [public_address, nonce], network, blockchain)
        .then((results) => {
          return results;
        })
        .catch((error) => {
          console.error("Error retrieving data:", error);
        });

      query = `select * from user_header where public_address = ?`;
      params = [public_address];
      user_record = await queryDB
        .getData(query, params, network, blockchain)
        .then((results) => {
          return results;
        })
        .catch((error) => {
          console.error("Error retrieving data:", error);
        });
    }

    res.status(200).json({
      success: true,
      user_record: user_record,
      msg: ``,
    });
    return;
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      msg: `Oops, something went wrong! Please try again later.`,
    });
  }
});

module.exports = router;
