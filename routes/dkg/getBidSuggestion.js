require("dotenv").config();
const express = require("express");
const router = express.Router();
const queryTypes = require("../../util/queryTypes");
const queryDB = queryTypes.queryDB();

const DKGClient = require("dkg.js");

const testnet_node_options = {
  endpoint: process.env.OT_NODE_HOSTNAME,
  port: process.env.OT_NODE_TESTNET_PORT,
  useSSL: true,
  maxNumberOfRetries: 100
};

const mainnet_node_options = {
  endpoint: process.env.OT_NODE_HOSTNAME,
  port: process.env.OT_NODE_MAINNET_PORT,
  useSSL: true,
  maxNumberOfRetries: 100
};

const testnet_dkg = new DKGClient(testnet_node_options);
const mainnet_dkg = new DKGClient(mainnet_node_options);

router.post("/", async function (req, res) {
  try {
    type = "getBidSuggestion";
    data = req.body;
    api_key = req.headers["x-api-key"];
    network = ""
    blockchain = "othub_db"

    if (!api_key || api_key === "") {
      console.log(`Create request without authorization.`);
      res.status(401).json({
        success: false,
        msg: "Authorization key not provided.",
      });
      return;
    }

    apiSpamProtection = await queryTypes.apiSpamProtection();

    permission = await apiSpamProtection
      .getData(type, api_key)
      .then(async ({ permission }) => {
        return permission;
      })
      .catch((error) => console.log(`Error : ${error}`));

    if (permission == `no_app`) {
      console.log(`No app found for api key ${api_key}`);
      res.status(401).json({
        success: false,
        msg: "Unauthorized key provided.",
      });
      return;
    }

    if (permission == `block`) {
      console.log(`Request frequency limit hit from ${api_key}`);
      res.status(429).json({
        success: false,
        msg: "The rate limit for this api key has been reached. Please upgrade your key to increase your limit.",
      });
      return;
    }

    function isJsonString(str) {
      try {
        JSON.parse(str);
      } catch (e) {
        console.log(e);
        return "false";
      }
      return "true";
    }

    if (!data.asset || data.asset === "") {
      console.log(`Create request with no data from ${api_key}`);
      res.status(400).json({
        success: false,
        msg: "No asset provided.",
      });
      return;
    }

    valid_json = await isJsonString(JSON.stringify(data.asset));
    if (valid_json == "false") {
      console.log(`Create request with bad data from ${api_key}`);
      res.status(400).json({
        success: false,
        msg: "Invalid JSON.",
      });
      return;
    }

    epochs = data.epochs;
    if (!data.epochs || data.epochs === "") {
      epochs = 5;
    }

    txn_data = data.asset;
    if (!txn_data.hasOwnProperty("@context")) {
      txn_data["@context"] = "https://schema.org";
    }

    dkg_data = {
      public: JSON.parse(txn_data),
    };

    const environment =
      data.network === "otp:20430" || data.network === "gnosis:10200"
        ? "testnet"
        : data.network === "otp:2043" || data.network === "gnosis:100"
        ? "mainnet"
        : "";

    const dkg =
      data.network === "otp:20430" || data.network === "gnosis:10200"
        ? testnet_dkg
        : data.network === "otp:2043" || data.network === "gnosis:100"
        ? mainnet_dkg
        : "";

    if (dkg === "") {
      res.status(400).json({
        success: false,
        msg: "Invalid network provided. Current supported networks are: otp:20430, otp:2043, gnosis:10200, gnosis:100.",
      });
      return;
    }

    const publicAssertionId = await dkg.assertion.getPublicAssertionId(
      dkg_data
    );
    const publicAssertionSize = await dkg.assertion.getSizeInBytes(dkg_data);

    dkg_bid_result = await dkg.network.getBidSuggestion(
      publicAssertionId,
      publicAssertionSize,
      {
        epochsNum: epochs,
        environment: environment,
        blockchain: {
          name: data.network,
          publicKey: process.env.PUBLIC_KEY,
          privateKey: process.env.PRIVATE_KEY,
        },
      }
    );

    if (!dkg_bid_result || dkg_bid_result.errorType) {
      console.log(`getBidSuggestion request failed from ${api_key}`);
      res.status(504).json({
        success: false,
        msg: `Error occured while getting asset data.`,
      });
      return;
    }

    txn_description = data.txn_description;
    if (!data.txn_description || data.txn_description === "") {
      txn_description = "No description available.";
    }

    query = `select * from app_header where api_key = ?`;
    params = [api_key];
    app = await queryDB
    .getData(query, params, network, blockchain)
    .then((results) => {
      //console.log('Query results:', results);
      return results;
      // Use the results in your variable or perform further operations
    })
    .catch((error) => {
      console.error("Error retrieving data:", error);
    });

    query = `INSERT INTO txn_header (txn_id, progress, approver, api_key, request, network, app_name, txn_description, txn_data, ual, keywords, state, txn_hash, txn_fee, trac_fee, epochs, receiver) VALUES (UUID(),?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
    params = [
      "COMPLETE",
      null,
      api_key,
      type,
      data.network,
      app[0].app_name,
      txn_description,
      null,
      data.ual,
      null,
      dkg_bid_result.assertionId,
      null,
      null,
      0,
      null,
      null,
    ]

    await queryDB
      .getData(query, params, network, blockchain)
      .then((results) => {
        //console.log('Query results:', results);
        return results;
        // Use the results in your variable or perform further operations
      })
      .catch((error) => {
        console.error("Error retrieving data:", error);
      });

    res.status(200).json(Number(dkg_bid_result));
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      msg: `Oops, something went wrong! Please try again later.`,
    });
  }
});

module.exports = router;
