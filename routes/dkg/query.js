require("dotenv").config();
var express = require("express");
var router = express.Router();
const queryTypes = require("../../util/queryTypes");

const mysql = require("mysql");
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

    type = "Query";
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

    if (!data.query || data.query === "") {
      console.log(`Query request with no query from ${api_key}`);
      res.status(400).json({
        success: false,
        msg: "No Query provided.",
      });
      return;
    }
    sparquery = data.query;

    if (
      !data.network ||
      (data.network !== "otp::testnet" && data.network !== "otp::mainnet")
    ) {
      console.log(`Create request with invalid network from ${api_key}`);

      res.status(400).json({
        success: false,
        msg: "Invalid network provided. Current supported networks are: otp::testnet, otp::mainnet.",
      });
      return;
    }

    type = data.type;
    if (!data.type || data.type === "") {
      type = "SELECT";
    }

    if (data.network === "otp::testnet") {
      queryResult = await testnet_dkg.graph.query(sparquery, type);
    }

    if (data.network === "otp::mainnet") {
      queryResult = await mainnet_dkg.graph.query(sparquery, type);
    }

    data = JSON.stringify(queryResult.data);
    if (queryResult.status === "FAILED") {
      data = JSON.stringify("Invalid Query");
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
        "query",
        data.network,
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
      ],
      function (error, results, fields) {
        if (error) throw error;
      }
    );

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
