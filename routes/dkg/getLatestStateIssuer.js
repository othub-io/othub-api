require("dotenv").config();
const express = require("express");
const router = express.Router();
const queryTypes = require("../../util/queryTypes");
const queryDB = queryTypes.queryDB();

const DKGClient = require("dkg.js");
const OT_NODE_TESTNET_PORT = process.env.OT_NODE_TESTNET_PORT;
const OT_NODE_MAINNET_PORT = process.env.OT_NODE_MAINNET_PORT;

const testnet_node_options = {
  endpoint: process.env.OT_NODE_HOSTNAME,
  port: OT_NODE_TESTNET_PORT,
  useSSL: true,
  maxNumberOfRetries: 100,
};

const mainnet_node_options = {
  endpoint: process.env.OT_NODE_HOSTNAME,
  port: OT_NODE_MAINNET_PORT,
  useSSL: true,
  maxNumberOfRetries: 100,
};

const testnet_dkg = new DKGClient(testnet_node_options);
const mainnet_dkg = new DKGClient(mainnet_node_options);

router.post("/", async function (req, res) {
  try {
    type = "getLatestStateIssuer";
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

    if (!data.ual || data.ual === "") {
      console.log(`getLatestStateIssuer request with no ual from ${api_key}`);
      res.status(400).json({
        success: false,
        msg: "No UAL provided.",
      });
      return;
    }

    const segments = data.ual.split(":");
    const argsString =
      segments.length === 3 ? segments[2] : segments[2] + segments[3];
    const args = argsString.split("/");

    if (args.length !== 3) {
      console.log(
        `getLatestStateIssuer request with invalid ual from ${api_key}`
      );
      res.status(400).json({
        success: false,
        msg: "Invalid UAL provided.",
      });
      return;
    }

    state = data.state;
    if (!data.state || data.state === "") {
      state = "LATEST_FINALIZED";
    }

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

    dkg_get_result = await dkg.asset
      .getLatestStateIssuer(data.ual, {
        environment: environment,
        validate: true,
        maxNumberOfRetries: 30,
        frequency: 1,
        state: state,
        blockchain: {
          name: data.network,
          publicKey: process.env.PUBLIC_KEY,
          privateKey: process.env.PRIVATE_KEY,
        },
      })
      .then((result) => {
        //console.log(JSON.stringify(result))
        return result;
      })
      .catch((error) => {
        console.log(error);
      });

    if (!dkg_get_result || dkg_get_result.errorType) {
      console.log(`getLatestStateIssuer request failed from ${api_key}`);
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
      null,
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

    res.status(200).json(dkg_get_result);
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      msg: `Oops, something went wrong! Please try again later.`,
    });
  }
});

module.exports = router;
