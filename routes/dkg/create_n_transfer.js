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

router.get("/", async function (req, res) {
  try {
    url_params = purl.parse(req.url, true).query;
    ip = req.socket.remoteAddress;
    if (process.env.SSL_KEY_PATH) {
      ip = req.headers["x-forwarded-for"];
    }

    type = `Create-n-Transfer`;

    console.log(url_params);
    res.setHeader("Access-Control-Allow-Origin", "*");

    if (!url_params.api_key || url_params.api_key === "") {
      console.log(`Create request without authorization.`);
      resp_object = {
        result: "Authorization key not provided.",
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

    if (!url_params.txn_data || url_params.txn_data === "") {
      console.log(`Create request with no data from ${url_params.api_key}`);
      resp_object = {
        result: "No data provided.",
      };
      res.send(resp_object);
      return;
    }

    if (
      !url_params.public_address ||
      !ethers.utils.isAddress(url_params.public_address)
    ) {
      console.log(
        `Create request with invalid public_address from ${url_params.api_key}`
      );
      resp_object = {
        result: "Invalid public_address (evm address) provided.",
      };
      res.send(resp_object);
      return;
    }

    function isJsonString(str) {
      try {
        JSON.parse(str);
      } catch (e) {
        return "false";
      }
      return "true";
    }

    valid_json = await isJsonString(url_params.txn_data);
    if (valid_json == "false") {
      console.log(`Create request with bad data from ${url_params.api_key}`);
      resp_object = {
        result: "Invalid Json.",
      };
      res.send(resp_object);
      return;
    }

    if (
      !url_params.network ||
      (url_params.network !== "otp::testnet")
    ) {
      console.log(
        `Create request with invalid network from ${url_params.api_key}`
      );
      resp_object = {
        result:
          "Invalid network provided. Current supported networks are: otp::testnet.",
      };
      res.send(resp_object);
      return;
    }

    if (!url_params.keywords || url_params.keywords === "") {
      keywords = `othub-api`;
    } else {
      keywords = url_params.keywords.replace("'", "");
      keywords = keywords.replace('"', "");
      keywords = keywords + ",othub-api";
    }

    epochs = url_params.epochs;
    if (!url_params.epochs || url_params.epochs === "") {
      epochs = 5;
    }

    txn_description = url_params.txn_description;
    if (!url_params.txn_description || url_params.txn_description === "") {
      txn_description = "No description available.";
    }

    trac_fee = url_params.trac_fee;
    if (!url_params.trac_fee || url_params.trac_fee === "") {
      trac_fee = null;
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
        result: "This user has not whitelisted your application.",
      };
      res.json(resp_object);
      return;
    }
  
      receiver = {
        receiver: url_params.public_address,
      };

      dkg_txn_data = JSON.parse(url_params.txn_data);

      if (!dkg_txn_data["@context"]) {
        dkg_txn_data["@context"] = "https://schema.org";
      }

      if (url_params.network === "otp::testnet") {
        dkg_create_result = await testnet_dkg.asset
          .create({
            public: dkg_txn_data,
            }, {
            epochsNum: epochs,
            maxNumberOfRetries: 30,
            frequency: 2,
            contentType: "all",
            keywords: keywords,
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

          if(!dkg_create_result || dkg_create_result.errorType){
            console.log(`Create n Transfer request errored from ${url_params.api_key}`)
              resp_object = {
                result: 'Error occured while creating the asset.'
              }
              res.send(resp_object)
              return
          }

          console.log('Created UAL: '+ dkg_create_result.UAL)
          
          dkg_transfer_result = await testnet_dkg.asset
          .transfer(
            dkg_create_result.UAL,
            url_params.public_address, {
            epochsNum: epochs,
            maxNumberOfRetries: 30,
            frequency: 2,
            contentType: "all",
            keywords: keywords,
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

          if(!dkg_transfer_result || dkg_transfer_result.errorType){
            console.log(`Create n Transfer request errored from ${url_params.api_key}`)
              resp_object = {
                result: 'Error occured while transferring the asset.'
              }
              res.send(resp_object)
              return
          }
      }

      receiver = {
        receiver: url_params.public_address,
      };
  
    //   if (url_params.network === "otp::mainnet") {
    //     dkg_get_result = await mainnet_dkg.asset
    //       .getOwner(url_params.ual, {
    //         validate: true,
    //         maxNumberOfRetries: 30,
    //         frequency: 1,
    //         blockchain: {
    //           name: url_params.network,
    //           publicKey: process.env.PUBLIC_KEY,
    //           privateKey: process.env.PRIVATE_KEY,
    //         },
    //       })
    //       .then((result) => {
    //         //console.log(JSON.stringify(result))
    //         return result;
    //       })
    //       .catch((error) => {
    //         console.log(error);
    //       });
    //   }

    query = `INSERT INTO txn_header (txn_id, progress, public_address, api_key, request, network, app_name, txn_description, txn_data, ual, keywords, state, txn_hash, txn_fee, trac_fee, epochs) VALUES (UUID(),?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
    await othubdb_connection.query(
      query,
      [
        'COMPLETED',
        url_params.public_address,
        url_params.api_key,
        type,
        url_params.network,
        app[0].app_name,
        txn_description,
        JSON.stringify(receiver),
        dkg_create_result.UAL,
        keywords,
        dkg_create_result.publicAssertionId,
        null,
        null,
        trac_fee,
        epochs,
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
      result: `Created ${dkg_create_result.UAL} and transfered it to ${url_params.public_address} successfully.`,
      url: `${process.env.WEB_HOST}/portal/assets?ual=${dkg_create_result.UAL}`,
    };

    res.json(resp_object);
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
