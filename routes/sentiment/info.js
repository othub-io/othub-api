require("dotenv").config();
var express = require("express");
var router = express.Router();
const ethers = require("ethers");
const queryTypes = require("../../util/queryTypes");
const queryDB = queryTypes.queryDB();
const keccak256 = require("keccak256");

router.post("/", async function (req, res) {
  try {
    type = "stats";
    let data = req.body;
    api_key = req.headers["x-api-key"];

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

    let query = `select * from sentiment_header`;
    let params = [];
    let conditions = [];

    if (data.ual) {
      const segments = data.ual.split(":");
      const argsString =
        segments.length === 3 ? segments[2] : segments[2] + segments[3];
      const args = argsString.split("/");

      if (args.length !== 3) {
        console.log(`Asset Info request with invalid ual from ${api_key}`);
        res.status(400).json({
          success: false,
          msg: "Invalid UAL provided.",
        });
        return;
      }

      conditions.push(`asset_contract = ?`);
      params.push(args[1]);

      conditions.push(`token_id = ?`);
      params.push(Number(args[2]));
    }

    if (data.blockchain === "NeuroWeb Mainnet") {
      conditions.push(`chain_id = ?`);
      params.push("2043");
    }

    if (data.blockchain === "NeuroWeb Testnet") {
      conditions.push(`chain_id = ?`);
      params.push("20430");
    }

    if (data.blockchain === "Gnosis Mainnet") {
      conditions.push(`chain_id = ?`);
      params.push("100");
    }

    if (data.blockchain === "Chiado Testnet") {
      conditions.push(`chain_id = ?`);
      params.push("10200");
    }

    if (!data.blockchain && data.network === "DKG Mainnet") {
      conditions.push(`chain_id = ? OR chain_id = ?`);
      params.push("2043");
      params.push("100");
    }

    if (!data.blockchain && data.network === "DKG Testnet") {
      conditions.push(`chain_id = ? OR chain_id = ?`);
      params.push("20430");
      params.push("10200");
    }

    if (data.account) {
      conditions.push(`account = ?`);
      params.push(data.account);
    }

    if (data.frequency === "last1h") {
      conditions.push(`updated_at>= date_add(now(), interval -1 HOUR)`);
    }

    if (data.frequency === "last24h") {
      conditions.push(`updated_at>= date_add(now(), interval -1 DAY)`);
    }

    if (data.frequency === "last7d") {
      conditions.push(`updated_at>= date_add(now(), interval -7 DAY)`);
    }

    if (data.frequency === "last30d") {
      conditions.push(`updated_at>= date_add(now(), interval -30 HOUR)`);
    }
    if (data.frequency === "last6m") {
      conditions.push(`updated_at>= date_add(now(), interval -6 MONTH)`);
    }
    if (data.frequency === "last1y") {
      conditions.push(`updated_at>= date_add(now(), interval -12 MONTH)`);
    }

    whereClause =
      conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";
    query = query + " " + whereClause + ` order by created_at desc`;

    result = await queryDB
      .getData(query, params, "", "othub_db")
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
      result: result,
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
