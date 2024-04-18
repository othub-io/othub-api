require("dotenv").config();
var express = require("express");
var router = express.Router();
const ethers = require("ethers");
const queryTypes = require("../../util/queryTypes");
const queryDB = queryTypes.queryDB();

router.post("/", async function (req, res) {
  try {
    type = "stats";
    data = req.body;
    api_key = req.headers["x-api-key"];
    let network = data.network && !data.blockchain ? data.network : null;
    let blockchain = data.blockchain ? data.blockchain : null;
    let query = `select * from v_pubs`;
    let nodeId = Number.isInteger(data.nodeId) ? data.nodeId : null;
    let limit = Number.isInteger(data.limit) ? data.limit : 100;
    let order_by = data.order_by ? data.order_by : "block_ts_hour"
    let conditions = [];
    let params = [];

    if (!api_key || api_key === "") {
      console.log(`Pub info request without authorization.`);
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

    if (
      network !== "DKG Mainnet" &&
      network !== "DKG Testnet" &&
      blockchain !== "NeuroWeb Mainnet" &&
      blockchain !== "NeuroWeb Testnet" &&
      blockchain !== "Gnosis Mainnet" &&
      blockchain !== "Chiado Testnet"
    ) {
      console.log(
        `Create request without valid network. Supported: DKG Mainnet, DKG Testnet, NeuroWeb Mainnet, NeuroWeb Testnet, Gnosis Mainnet, Chiado Testnet`
      );
      res.status(400).json({
        success: false,
        msg: "Invalid network or blockchain provided.",
      });
      return;
    }

    if (limit > 100000) {
      limit = 100000;
    }

    if (data.owner) {
      if (!ethers.utils.isAddress(data.owner)) {
        console.log(`Asset info request with invalid account from ${api_key}`);

        res.status(400).json({
          success: false,
          msg: "Invalid owner (evm address) provided.",
        });
        return;
      }

      conditions.push(`owner = ?`);
      params.push(data.owner);
    }

    if (data.publisher) {
      if (!ethers.utils.isAddress(data.publisher)) {
        console.log(`Asset info request with invalid publisher from ${api_key}`);

        res.status(400).json({
          success: false,
          msg: "Invalid publisher (evm address) provided.",
        });
        return;
      }

      conditions.push(`publisher = ?`);
      params.push(data.publisher);
    }

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

      conditions.push(`UAL = ?`);
      params.push(data.ual);
    }

    if (nodeId) {
      conditions.push(`winners like ? OR winners like ? OR winners like ?`);
  
      nodeId = `%"${nodeId},%`;
      params.push(nodeId);
  
      nodeId = `%,${nodeId},%`;
      params.push(nodeId);
  
      nodeId = `%,${nodeId}"%`;
      params.push(nodeId);
    }

    whereClause =
      conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";
    query = query + " " + whereClause + ` order by ${order_by} DESC LIMIT ${limit}`;

    result = await queryDB
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
