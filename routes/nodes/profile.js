require("dotenv").config();
var express = require("express");
var router = express.Router();
const ethers = require("ethers");
const web3passport = require("../../util/auth/passport");
const queryTypes = require("../../util/queryTypes");
const queryDB = queryTypes.queryDB();
const keccak256 = require("keccak256");

router.post("/", async function (req, res) {
  try {
    type = "stats";
    data = req.body;
    api_key = req.headers["x-api-key"];
    let query = `SELECT * FROM node_header`;
    let conditions = [];
    let params = [];
    let node_id = data.node_id
    let chain_id = data.chain_id

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

    if (node_id) {
      conditions.push(`node_id = ?`);
      params.push(node_id);
    }

    if (chain_id) {
      conditions.push(`chain_id = ?`);
      params.push(chain_id);
    }

    whereClause =
      conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";
    query = query + " " + whereClause;

    let result = await queryDB
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
