require("dotenv").config();
var express = require("express");
var router = express.Router();
const mysql = require("mysql");
const queryTypes = require("../../util/queryTypes");
const othubdb_connection = mysql.createConnection({
  host: process.env.DBHOST,
  user: process.env.DBUSER,
  password: process.env.DBPASSWORD,
  database: process.env.OTHUB_DB,
});

function executeOTHUBQuery(query, params) {
  return new Promise((resolve, reject) => {
    othubdb_connection.query(query, params, (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}

async function getOTHUBData(query, params) {
  try {
    const results = await executeOTHUBQuery(query, params);
    return results;
  } catch (error) {
    console.error("Error executing query:", error);
    throw error;
  }
}

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
    ip = req.socket.remoteAddress;
    if (process.env.SSL_KEY_PATH) {
      ip = req.headers["x-forwarded-for"];
    }

    type = "getStates";
    data = req.body;
    api_key = req.headers["x-api-key"];

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
      console.log(`getStates request with no ual from ${api_key}`);
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
      console.log(`getStates request with invalid ual from ${api_key}`);
      res.status(400).json({
        success: false,
        msg: "Invalid UAL provided.",
      });
      return;
    }

    const hubContract =
      data.network === "otp::20430" 
        ? "0xBbfF7Ea6b2Addc1f38A0798329e12C08f03750A6" :
      data.network === "gnosis::10200"
        ? "0xC06210312C9217A0EdF67453618F5eB96668679A" :
      data.network === "otp::2043" 
        ? "0x5fA7916c48Fe6D5F1738d12Ad234b78c90B4cAdA" : 
      data.network === "gnosis::100"
        ? "0xbEF14fc04F870c2dD65c13Df4faB6ba01A9c746b"
        : "";


    const environment =
      data.network === "otp::20430" || data.network === "gnosis::10200"
        ? "testnet"
        : data.network === "otp::2043" || data.network === "gnosis::100"
        ? "mainnet"
        : "";

    const dkg =
      data.network === "otp::20430" || data.network === "gnosis::10200"
        ? testnet_dkg
        : data.network === "otp::2043" || data.network === "gnosis::100"
        ? mainnet_dkg
        : "";

    if (dkg === "") {
      res.status(400).json({
        success: false,
        msg: "Invalid network provided. Current supported networks are: otp::20430, otp::2043, gnosis::10200, gnosis::100.",
      });
      return;
    }

    dkg_get_result = await dkg.asset
      .getStates(data.ual, {
        environment: environment,
        validate: true,
        maxNumberOfRetries: 30,
        frequency: 1,
        blockchain: {
          name: data.network,
          publicKey: process.env.PUBLIC_KEY,
          privateKey: process.env.PRIVATE_KEY,
          hubContract: hubContract
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
      console.log(`getStates request failed from ${api_key}`);
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
    app = await getOTHUBData(query, params)
      .then((results) => {
        //console.log('Query results:', results);
        return results;
        // Use the results in your variable or perform further operations
      })
      .catch((error) => {
        console.error("Error retrieving data:", error);
      });

    query = `INSERT INTO txn_header (txn_id, progress, approver, api_key, request, network, app_name, txn_description, txn_data, ual, keywords, state, txn_hash, txn_fee, trac_fee, epochs, receiver) VALUES (UUID(),?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
    await othubdb_connection.query(
      query,
      [
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
      ],
      function (error, results, fields) {
        if (error) throw error;
      }
    );

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
