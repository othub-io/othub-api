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

function executeOTHubQuery (query, params) {
  return new Promise((resolve, reject) => {
    othubdb_connection.query(query, params, (error, results) => {
      if (error) {
        reject(error)
      } else {
        resolve(results)
      }
    })
  })
}

async function getOTHubData (query, params) {
  try {
    const results = await executeOTHubQuery(query, params)
    return results
  } catch (error) {
    console.error('Error executing query:', error)
    throw error
  }
}


router.post("/", async function (req, res) {
  try {
    ip = req.socket.remoteAddress;
    if (process.env.SSL_KEY_PATH) {
      ip = req.headers["x-forwarded-for"];
    }

    type = "checkTransaction";
    data = req.body;
    console.log(req.headers)
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

    if (!data.receipt || data.receipt === "") {
      console.log(`Transaction check with no receipt from ${api_key}`);
      res.status(400).json({
        success: false,
        msg: "No Receipt provided.",
      });
      return;
    }

    sqlQuery = "select * from txn_header where txn_id = ? and request = 'Create-n-Transfer'";
    params = [data.receipt];
    transaction = await getOTHubData(sqlQuery, params)
        .then((results) => {
            //console.log('Query results:', results);
            return results;
            // Use the results in your variable or perform further operations
        })
        .catch((error) => {
            console.error("Error retrieving data:", error);
        });

    if(Number(transaction.length) === 0){
      res.status(200).json({
        success: false,
        status: null
      });
    }

    let ual
    if(transaction[0].progress === 'COMPLETE'){
      ual = transaction[0].ual
    }

    let explorer_url = 'https://dkg.origintrail.io'
    if(transaction[0].network === 'otp::testnet'){
      explorer_url = 'https://dkg-testnet.origintrail.io'
    }

    let othub
    let explorer
    if(ual){
      othub = `${process.env.WEB_HOST}/assets?ual=${ual}`
      explorer = `${explorer_url}/explore?ual=${ual}`
    }

    res.status(200).json({
      success: true,
      status: transaction[0].progress,
      ual: ual,
      receiver: transaction[0].receiver,
      othub: othub,
      explorer: explorer
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
