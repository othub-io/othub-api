require("dotenv").config();
var express = require("express");
var router = express.Router();
const purl = require("url");
const queryTypes = require("../../../public/util/queryTypes");

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

router.get("/", async function (req, res) {
  try {
    url_params = purl.parse(req.url, true).query;
    ip = req.socket.remoteAddress;
    if (process.env.SSL_KEY_PATH) {
      ip = req.headers["x-forwarded-for"];
    }

    res.setHeader("Access-Control-Allow-Origin", "*");

    type = "Query";
    if (!url_params.api_key || url_params.api_key === "") {
      console.log(`Query request without authorization.`);
      resp_object = {
        result: "Authorization key not provided.",
      };
      res.send(resp_object);
      return;
    }

    apiSpamProtection = await queryTypes.apiSpamProtection();

    api_key = url_params.api_key;
    permission = await apiSpamProtection
      .getData(type, api_key)
      .then(async ({ permission }) => {
        return permission;
      })
      .catch((error) => console.log(`Error : ${error}`));

    if (permission == `no_app`) {
      console.log(`No app found for api key ${url_params.api_key}`);
      resp_object = {
        result: "Unauthorized key provided.",
      };
      res.send(resp_object);
      return;
    }

    if (permission == `block`) {
      console.log(`Request frequency limit hit from ${url_params.api_key}`);
      resp_object = {
        result:
          "The rate limit for this api key has been reached. Please upgrade your key to increase your limit.",
      };
      res.send(resp_object);
      return;
    }

    if (!url_params.query || url_params.query === "") {
      console.log(`Query request with no query from ${url_params.api_key}`);
      resp_object = {
        result: "No query provided.",
      };
      res.send(resp_object);
      return;
    }
    sparquery = url_params.query;

    console.log(url_params.network);
    if (
      !url_params.network ||
      (url_params.network !== "otp::testnet" &&
        url_params.network !== "otp::mainnet")
    ) {
      console.log(
        `Query request with invalid network from ${url_params.api_key}`
      );
      resp_object = {
        result:
          "Invalid network provided. Current supported networks are: otp::testnet, otp::mainnet.",
      };
      res.send(resp_object);
      return;
    }

    type = url_params.type;
    if (!url_params.type || url_params.type === "") {
      type = "SELECT";
    }

    if (url_params.network === "otp::testnet") {
      queryResult = await testnet_dkg.graph.query(sparquery, type);
    }

    if (url_params.network === "otp::mainnet") {
      queryResult = await mainnet_dkg.graph.query(sparquery, type);
    }

    data = JSON.stringify(queryResult.data);
    if (queryResult.status === "FAILED") {
      data = JSON.stringify("Invalid Query");
    }

    txn_description = url_params.txn_description;
    if (!url_params.txn_description || url_params.txn_description === "") {
      txn_description = "No description available.";
    }

    query = `select * from app_header where api_key = ?`;
    params = [url_params.api_key];
    app = await getOTHUBData(query, params)
      .then((results) => {
        //console.log('Query results:', results);
        return results;
        // Use the results in your variable or perform further operations
      })
      .catch((error) => {
        console.error("Error retrieving data:", error);
      });

    query =
      "INSERT INTO txn_header (txn_id, progress, public_address, api_key, request, network, app_name, txn_description, txn_data, ual, keywords, state, txn_hash, txn_fee, trac_fee, epochs) VALUES (UUID(),?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
    await othubdb_connection.query(
      query,
      [
        "COMPLETE",
        null,
        url_params.api_key,
        "query",
        url_params.network,
        app[0].app_name,
        txn_description,
        null,
        url_params.ual,
        null,
        null,
        null,
        null,
        0,
        null,
      ],
      function (error, results, fields) {
        if (error) throw error;
      }
    );

    res.send(queryResult);
  } catch (e) {
    console.log(e);
    resp_object = {
      result: "Oops, something went wrong! Please try again later.",
    };

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.json(resp_object);
  }
});

module.exports = router;
