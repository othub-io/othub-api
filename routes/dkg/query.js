require("dotenv").config();
const express = require("express");
const router = express.Router();
const queryTypes = require("../../util/queryTypes");
const queryDB = queryTypes.queryDB();

const DKGClient = require("dkg.js");
const OT_NODE_TESTNET_PORT = process.env.OT_NODE_TESTNET_PORT;
const OT_NODE_MAINNET_PORT = process.env.OT_NODE_MAINNET_PORT;

const testnet_node_options = {
  endpoint: process.env.OT_NODE_TESTNET_HOSTNAME,
  port: OT_NODE_TESTNET_PORT,
  useSSL: true,
  maxNumberOfRetries: 100,
};

const mainnet_node_options = {
  endpoint: process.env.OT_NODE_MAINNET_HOSTNAME,
  port: OT_NODE_MAINNET_PORT,
  useSSL: true,
  maxNumberOfRetries: 100,
};

const testnet_dkg = new DKGClient(testnet_node_options);
const mainnet_dkg = new DKGClient(mainnet_node_options);

router.post("/", async function (req, res) {
  try {
    type = "Query";
    let data = req.body;
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

    if (!data.query || data.query === "") {
      console.log(`Query request with no query from ${api_key}`);
      res.status(400).json({
        success: false,
        msg: "No Query provided.",
      });
      return;
    }
    sparquery = data.query;
        
    const environment =
      data.blockchain === "otp:20430" || data.blockchain === "gnosis:10200" || data.blockchain === "base:84532"
        ? "testnet"
        : data.blockchain === "otp:2043" || data.blockchain === "gnosis:100" || data.blockchain === "base:8453"
        ? "mainnet"
        : "";

    const dkg =
      data.blockchain === "otp:20430" || data.blockchain === "gnosis:10200" || data.blockchain === "base:84532"
        ? testnet_dkg
        : data.blockchain === "otp:2043" || data.blockchain === "gnosis:100" || data.blockchain === "base:8453"
        ? mainnet_dkg
        : "";

    if (dkg === "") {
      res.status(400).json({
        success: false,
        msg: "Invalid blockchain provided. Current supported blockchains are: otp:20430, otp:2043, gnosis:10200, gnosis:100, base:85432, base:8543.",
      });
      return;
    }

    type = data.type;
    if (!data.type || data.type === "") {
      type = "SELECT";
    }

    graphState = data.graphState;
    if (!data.graphState || data.graphState === "") {
      graphState = "CURRENT";
    }

    queryResult = await dkg.graph.query(sparquery, type, {graphState: graphState});

    data = JSON.stringify(queryResult.data);
    if (queryResult.status === "FAILED") {
      data = JSON.stringify("Invalid Query");
    }

    txn_description = data.txn_description;
    if (!data.txn_description || data.txn_description === "") {
      txn_description = "No description available.";
    }

    query = `select ah.app_name,kh.key_id from key_header kh join app_header ah on ah.account = kh.account where kh.api_key = ?`;
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

    query = `INSERT INTO txn_header (txn_id, progress, approver, key_id, request, blockchain, app_name, txn_description, data_id, ual, keywords, state, txn_hash, txn_fee, trac_fee, epochs, receiver, paranet_name) VALUES (UUID(),?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
    params = [
      "COMPLETE",
      null,
      app[0].key_id,
      "query",
      data.blockchain,
      app[0].app_name,
      txn_description,
      null,
      null,
      null,
      null,
      null,
      null,
      0,
      null,
      null,
      null
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

    res.status(200).send(queryResult);
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      msg: `Oops, something went wrong! Please try again later.`,
    });
  }
});

module.exports = router;
