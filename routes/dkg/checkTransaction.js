require("dotenv").config();
const express = require("express");
const router = express.Router();
const queryTypes = require("../../util/queryTypes");
const queryDB = queryTypes.queryDB();

function isValidGUID(guid) {
  const guidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  return guidRegex.test(guid);
}

router.post("/", async function (req, res) {
  try {
    type = "checkTransaction";
    data = req.body;
    api_key = req.headers["x-api-key"];
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

    if (!data.receipt || data.receipt === "") {
      console.log(`Transaction check with no receipt from ${api_key}`);
      res.status(400).json({
        success: false,
        msg: "No Receipt provided.",
      });
      return;
    }

    if (!isValidGUID(data.receipt)) {
      res.status(400).json({
        success: false,
        msg: "Invalid Receipt provided.",
      });
      return;
    }

    query = "select * from txn_header where txn_id = ? and request = 'Create-n-Transfer'";
    params = [data.receipt];
    transaction = await queryDB
    .getData(query, params, network, blockchain)
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
    if(transaction[0].ual){
      ual = transaction[0].ual
    }

    let explorer_url = 'https://dkg.origintrail.io'
    if(transaction[0].blockchain === 'otp::20430' || transaction[0].blockchain === 'gnosis::10200'){
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
