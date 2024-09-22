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
    let network = data.network ? data.network : null;
    let blockchain = data.blockchain ? data.blockchain : null;
    let limit = Number.isInteger(data.limit) ? data.limit : 1000;
    let conditions = [];
    let params = [];
    let query;

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

    if (!blockchain) {
      query = `select chain_name,chain_id from blockchains where environment = ?`;
      params = [network];
      blockchains = await queryDB
        .getData(query, params, "", "othub_db")
        .then((results) => {
          //console.log('Query results:', results);
          return results;
          // Use the results in your variable or perform further operations
        })
        .catch((error) => {
          console.error("Error retrieving data:", error);
        });
    } else {
      query = `select chain_name,chain_id from blockchains where chain_name = ?`;
      params = [blockchain];
      blockchains = await queryDB
        .getData(query, params, "", "othub_db")
        .then((results) => {
          //console.log('Query results:', results);
          return results;
          // Use the results in your variable or perform further operations
        })
        .catch((error) => {
          console.error("Error retrieving data:", error);
        });
    }

    query = `select vn.*,vns.pubsCommited1stEpochOnly as pubs24h,vns.estimatedEarnings1stEpochOnly as earnings24h from v_nodes vn join v_nodes_stats_last24h vns on vn.nodeId = vns.nodeId`;
    ques = "";

    params = []
    if (data.nodeId) {
      nodeIds = !Number(data.nodeId)
        ? data.nodeId.split(",").map(Number)
        : [data.nodeId];
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
        params.push(Number(nodeid));
      }

      ques = ques.substring(0, ques.length - 1);

      conditions.push(`vn.nodeId in (${ques})`);
    }
    
    if (data.nodeName && data.nodeName !== "") {
      conditions.push(`vn.tokenName = ?`);
      params.push(data.nodeName);
    }

    if (data.owner) {
      if (!ethers.utils.isAddress(data.owner)) {
        console.log(`Node info request with invalid owner from ${api_key}`);

        res.status(400).json({
          success: false,
          msg: "Invalid owner (evm address) provided.",
        });
        return;
      }

      keccak256hash = keccak256(data.owner).toString("hex");
      keccak256hash = "0x" + keccak256hash;
      like_keccak256hash = "%" + keccak256hash + "%";

      conditions.push(`current_adminWallet_hashes like ?`);
      params.push(like_keccak256hash);
    }

    conditions.push(`vn.nodeId != ?`);
    params.push(0);

    whereClause =
      conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";
    query =
      query +
      " " +
      whereClause +
      ` order by chainName,nodeId asc LIMIT ${limit}`;

    let node_data = [];
    for (const blockchain of blockchains) {
      data = await queryDB
        .getData(query, params, "", blockchain.chain_name)
        .then((results) => {
          //console.log('Query results:', results);
          return results;
          // Use the results in your variable or perform further operations
        })
        .catch((error) => {
          console.error("Error retrieving data:", error);
        });

      chain_data = {
        blockchain_name: blockchain.chain_name,
        blockchain_id: blockchain.chain_id,
        data: data,
      };

      node_data.push(chain_data);
    }

    res.status(200).json({
      success: true,
      result: node_data,
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
