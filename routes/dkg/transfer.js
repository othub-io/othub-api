require("dotenv").config();
const express = require("express");
const router = express.Router();
const purl = require("url");
const ethers = require("ethers");
const queryTypes = require("../../public/util/queryTypes");
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
    url_params = purl.parse(req.url, true).query;
    ip = req.socket.remoteAddress;
    if (process.env.SSL_KEY_PATH) {
      ip = req.headers["x-forwarded-for"];
    }

    type = `Transfer`;

    res.setHeader("Access-Control-Allow-Origin", "*");

    if (!url_params.api_key || url_params.api_key === "") {
      console.log(`Get request without authorization.`);
      resp_object = {
        status: "401",
        result: "401 Unauthorized: Authorization key not provided.",
      };
      res.send(resp_object);
      return;
    }

    apiSpamProtection = await queryTypes.apiSpamProtection();

    api_key = url_params.api_key;
    permission = await apiSpamProtection
      .getData(type, url_params.api_key)
      .then(async ({ permission }) => {
        return permission;
      })
      .catch((error) => console.log(`Error : ${error}`));

    if (permission == `no_app`) {
      console.log(`No app found for api key ${url_params.api_key}`);
      resp_object = {
        status: "401",
        result: "401 Unauthorized: Unauthorized key provided.",
      };
      res.send(resp_object);
      return;
    }

    if (permission == `block`) {
      console.log(`Request frequency limit hit from ${url_params.api_key}`);
      resp_object = {
        status: "429",
        result:
          "429 Too Many Requests: The rate limit for this api key has been reached. Please upgrade your key to increase your limit.",
      };
      res.send(resp_object);
      return;
    }

    if (!url_params.ual || url_params.ual === "") {
      console.log(`Get request with no ual from ${url_params.api_key}`);
      resp_object = {
        status: "400",
        result: "400 Bad Request: No UAL provided.",
      };
      res.send(resp_object);
      return;
    }

    const segments = url_params.ual.split(":");
    const argsString =
      segments.length === 3 ? segments[2] : segments[2] + segments[3];
    const args = argsString.split("/");

    if (args.length !== 3) {
      console.log(`Get request with invalid ual from ${url_params.api_key}`);
      resp_object = {
        status: "400",
        result: "400 Bad Request: No UAL provided.",
      };
      res.send(resp_object);
      return;
    }

    if (
      !url_params.network ||
      (url_params.network !== "otp::testnet" &&
        url_params.network !== "otp::mainnet")
    ) {
      console.log(
        `Get request with invalid network from ${url_params.api_key}`
      );
      resp_object = {
        status: "400",
        result:
          "400 Bad Request: Invalid network provided. Current supported networks are: otp::testnet, otp::mainnet.",
      };
      res.send(resp_object);
      return;
    }

    if (
      !url_params.public_address ||
      !ethers.utils.isAddress(url_params.public_address)
    ) {
      console.log(
        `Publish request with invalid public_address from ${url_params.api_key}`
      );
      resp_object = {
        status: "400",
        result:
          "400 Bad Request: Invalid public_address (evm address) provided.",
      };
      res.send(resp_object);
      return;
    }

    if (!url_params.receiver || !ethers.utils.isAddress(url_params.receiver)) {
      console.log(
        `Transfer request with invalid receiver address from ${url_params.api_key}`
      );
      resp_object = {
        status: "400",
        result: "Invalid receiver (evm address) provided.",
      };
      res.send(resp_object);
      return;
    }

    if (url_params.network === "otp::testnet") {
      dkg_get_result = await testnet_dkg.asset
        .getOwner(url_params.ual, {
          validate: true,
          maxNumberOfRetries: 30,
          frequency: 1,
          blockchain: {
            name: url_params.network,
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
    }

    if (url_params.network === "otp::mainnet") {
      dkg_get_result = await mainnet_dkg.asset
        .getOwner(url_params.ual, {
          validate: true,
          maxNumberOfRetries: 30,
          frequency: 1,
          blockchain: {
            name: url_params.network,
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
    }

    if (!dkg_get_result || dkg_get_result.errorType) {
      console.log(
        `getOwner request with invalid ual from ${url_params.api_key}`
      );
      resp_object = {
        status: "504",
        result: "504 Gateway Timeout: Error occured while creating the asset.",
      };
      res.send(resp_object);
      return;
    }

    if (dkg_get_result.owner !== url_params.public_address) {
      console.log(
        `Transfer requested for an asset the public_address did not own from ${url_params.api_key}`
      );
      resp_object = {
        status: "400",
        result: "400 Bad Request: This public_address does not own this asset.",
      };
      res.send(resp_object);
      return;
    }

    receiver = {
      receiver: url_params.receiver,
    };

    epochs = url_params.epochs;
    if (!url_params.epochs || url_params.epochs === "") {
      epochs = 5;
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

    query = `select * from enabled_apps where public_address = ?`;
    params = [url_params.public_address];
    enabled_apps = await getOTHUBData(query, params)
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
      resp_object = {
        status: "403",
        result:
          "403 Forbidden: This user has not whitelisted your application.",
      };
      res.json(resp_object);
      return;
    }

    query = `INSERT INTO txn_header (txn_id, progress, public_address, api_key, request, network, app_name, txn_description, txn_data, ual, keywords, state, txn_hash, txn_fee, trac_fee, epochs) VALUES (UUID(),?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
    await othubdb_connection.query(
      query,
      [
        "PENDING",
        url_params.public_address,
        url_params.api_key,
        type,
        url_params.network,
        app[0].app_name,
        txn_description,
        JSON.stringify(receiver),
        url_params.ual,
        null,
        null,
        null,
        null,
        null,
        null,
      ],
      function (error, results, fields) {
        if (error) throw error;
      }
    );

    query = `select * from txn_header where api_key = ? and request = ? order by created_at desc`;
    params = [url_params.api_key, type];
    txn = await getOTHUBData(query, params)
      .then((results) => {
        //console.log('Query results:', results);
        return results;
        // Use the results in your variable or perform further operations
      })
      .catch((error) => {
        console.error("Error retrieving data:", error);
      });

    resp_object = {
      status: "200",
      result: "Transfer transaction queued successfully.",
      public_address: url_params.public_address,
      url: `${process.env.WEB_HOST}/portal/gateway?txn_id=${txn[0].txn_id}`,
    };

    res.json(resp_object);
  } catch (e) {
    console.log(e);
    resp_object = {
      status: "500",
      result:
        "500 Internal Server Error: Oops, something went wrong! Please try again later.",
      error: e,
    };

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.json(resp_object);
  }
});

module.exports = router;
