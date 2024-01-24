require("dotenv").config();
const ethers = require("ethers");
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
    type = `Transfer`;
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
      console.log(`Transfer request with no ual from ${api_key}`);
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
      console.log(`Transfer request with invalid ual from ${api_key}`);
      res.status(400).json({
        success: false,
        msg: "Invalid UAL provided.",
      });
      return;
    }

    if (!data.approver || !ethers.utils.isAddress(data.approver)) {
      console.log(`Create request with invalid approver from ${api_key}`);

      res.status(400).json({
        success: false,
        msg: "Invalid approver (evm address) provided.",
      });
      return;
    }

    if (!data.receiver || !ethers.utils.isAddress(data.receiver)) {
      console.log(`Transfer request with invalid receiver from ${api_key}`);

      res.status(400).json({
        success: false,
        msg: "Invalid receiver (evm address) provided.",
      });
      return;
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
      .getOwner(data.ual, {
        environment: environment,
        validate: true,
        maxNumberOfRetries: 30,
        frequency: 1,
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
      console.log(`getOwner request with invalid ual from ${api_key}`);
      res.status(504).json({
        success: false,
        msg: `Error occured while creating the asset.`,
      });
      return;
    }

    console.log(dkg_get_result.owner)
    console.log(data.approver)
    if (dkg_get_result.owner !== data.approver) {
      console.log(
        `Transfer requested for an asset the approver did not own from ${api_key}`
      );
      res.status(400).json({
        success: false,
        msg: `The approver does not own this asset.`,
      });
      return;
    }

    epochs = data.epochs;
    if (!data.epochs || data.epochs === "") {
      epochs = 5;
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

    query = `select * from enabled_apps where public_address = ?`;
    params = [data.approver];
    enabled_apps = await queryDB
    .getData(query, params, network, blockchain)
    .then((results) => {
      //console.log('Query results:', results);
      return results;
      // Use the results in your variable or perform further operations
    })
    .catch((error) => {
      console.error("Error retrieving data:", error);
    });

    white_listed = "no";
    if (enabled_apps.some((obj) => obj.app_name === app[0].app_name)) {
      white_listed = "yes";
    }

    if (white_listed === "no") {
      res.status(403).json({
        success: false,
        msg: "This user has not whitelisted your application.",
      });
      return;
    }

    query = `INSERT INTO txn_header (txn_id, progress, approver, api_key, request, network, app_name, txn_description, txn_data, ual, keywords, state, txn_hash, txn_fee, trac_fee, epochs, receiver) VALUES (UUID(),?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
    params = [
      "PENDING",
      data.approver,
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
      null,
      null,
      data.receiver,
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

    query = `select * from txn_header where api_key = ? and request = ? order by created_at desc`;
    params = [api_key, type];
    txn = await queryDB
    .getData(query, params, network, blockchain)
    .then((results) => {
      //console.log('Query results:', results);
      return results;
      // Use the results in your variable or perform further operations
    })
    .catch((error) => {
      console.error("Error retrieving data:", error);
    });

    res.status(200).json({
      success: true,
      msg: "Transfer transaction queued successfully.",
      approver: data.approver,
      url: `${process.env.WEB_HOST}/my-othub/portal?txn_id=${txn[0].txn_id}`,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      msg: `Oops, something went wrong! Please try again later.`,
    });
  }
});

module.exports = router;
