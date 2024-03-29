require("dotenv").config();
const ethers = require("ethers");
const express = require("express");
const router = express.Router();
const queryTypes = require("../../util/queryTypes");
const queryDB = queryTypes.queryDB();

function isJsonString(str) {
  try {
    JSON.parse(str);
    return "true";
  } catch (e) {
    return "false";
  }
}

router.post("/", async function (req, res) {
  try {
    type = `Create`;
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

    if (!data.asset || data.asset === "") {
      console.log(`Create request with no data from ${api_key}`);
      res.status(400).json({
        success: false,
        msg: "No asset provided.",
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

    const valid_json = await isJsonString(typeof data.asset === 'string' || data.asset instanceof String ? (data.asset) : (JSON.stringify(data.asset)));
    if (valid_json === "false") {
      console.log(`Create request with bad data from ${api_key}`);
      res.status(400).json({
        success: false,
        msg: "Invalid JSON.",
      });
      return;
    }

    if (
      data.network !== "otp:20430" && data.network !== "otp:2043" && data.network !== "gnosis:100" && data.network !== "gnosis:10200"
    ) {
      console.log(`Create request with invalid network from ${api_key}`);

      res.status(400).json({
        success: false,
        msg: "Invalid network provided. Current supported networks are: otp:20430, otp:2043, gnosis:100, gnosis:10200.",
      });
      return;
    }

    if (!data.keywords || data.keywords === "") {
      keywords = `othub-api`;
    } else {
      keywords = data.keywords.replace("'", "");
      keywords = keywords.replace('"', "");
      keywords = keywords + ",othub-api";
    }

    epochs = data.epochs;
    if (!data.epochs || data.epochs === "") {
      epochs = 5;
    }

    txn_description = data.txn_description;
    if (!data.txn_description || data.txn_description === "") {
      txn_description = "No description available.";
    }

    trac_fee = data.trac_fee;
    if (!data.trac_fee || data.trac_fee === "") {
      trac_fee = null;
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

    // query = `select * from enabled_apps where public_address = ?`;
    // params = [data.approver];
    // enabled_apps = await queryDB
    // .getData(query, params, network, blockchain)
    // .then((results) => {
    //   //console.log('Query results:', results);
    //   return results;
    //   // Use the results in your variable or perform further operations
    // })
    // .catch((error) => {
    //   console.error("Error retrieving data:", error);
    // });

    // white_listed = "no";
    // if (enabled_apps.some((obj) => obj.app_name === app[0].app_name)) {
    //   white_listed = "yes";
    // }

    // if (white_listed === "no") {
    //   res.status(403).json({
    //     success: false,
    //     msg: "This user has not whitelisted your application.",
    //   });
    //   return;
    // }

    query = `INSERT INTO txn_header (txn_id, progress, approver, api_key, request, network, app_name, txn_description, txn_data, ual, keywords, state, txn_hash, txn_fee, trac_fee, epochs, receiver) VALUES (UUID(),?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
    params = [
      "PENDING",
      data.approver,
      api_key,
      type,
      data.network,
      app[0].app_name,
      txn_description,
      typeof data.asset === 'string' || data.asset instanceof String ? (data.asset) : (JSON.stringify(data.asset)),
      null,
      keywords,
      null,
      null,
      null,
      trac_fee,
      epochs,
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
      msg: "Create transaction queued successfully.",
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
