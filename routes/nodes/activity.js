require("dotenv").config();
var express = require("express");
var router = express.Router();
const ethers = require("ethers");
const queryTypes = require("../../util/queryTypes");
const queryDB = queryTypes.queryDB();

router.post("/", async function (req, res) {
  try {
    type = "stats";
    let data = req.body;
    api_key = req.headers["x-api-key"];
    let network = data.network && !data.blockchain ? data.network : null;
    let blockchain = data.blockchain
    let frequency = data.frequency ? data.frequency : `1min`;
    let limit = Number.isInteger(data.limit) ? data.limit : 1000;
    let conditions = [];
    let params = [];

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

    if (
      network !== "DKG Mainnet" &&
      network !== "DKG Testnet" &&
      blockchain !== "NeuroWeb Mainnet" &&
      blockchain !== "NeuroWeb Testnet" &&
      blockchain !== "Gnosis Mainnet" &&
      blockchain !== "Chiado Testnet" &&
      blockchain !== "Base Mainnet" &&
      blockchain !== "Base Testnet"
    ) {
      console.log(
        `Create request without valid network. Supported: DKG Mainnet, DKG Testnet, NeuroWeb Mainnet, NeuroWeb Testnet, Gnosis Mainnet, Chiado Testnet, Base Mainnet, Base Testnet`
      );
      res.status(400).json({
        success: false,
        msg: "Invalid network or blockchain provided.",
      });
      return;
    }

    query = `select signer,UAL,datetime,tokenId,transactionHash,eventName,eventValue1,chain_id from v_pubs_activity_last${frequency} UNION ALL select tokenSymbol,UAL,datetime,tokenId,transactionHash,eventName,eventValue1,chain_id from v_nodes_activity_last${frequency}`;
    ques = "";

    if (data.nodeName) {
      conditions.push(`tokenName = ?`);
      params.push(data.nodeName);
    }
    
    if (data.nodeId) {
      nodeIds = !Number(data.nodeId) ? data.nodeId.split(",").map(Number) : [data.nodeId];
      for (const nodeid of nodeIds) {
        if (!Number(nodeid)) {
          console.log(`Invalid node id provided by ${api_key}`);
          res.status(400).json({
            success: false,
            msg: "Invalid node ID provided.",
          });
          return;
        }
        ques = ques + "?,";
      }

      ques = ques.substring(0, ques.length - 1);

      conditions.push(`nodeId in (${ques})`);
      params.push(nodeIds);
    }

    whereClause =
      conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";
    query =
      query + " " + whereClause + ` order by datetime desc LIMIT ${limit}`;

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
