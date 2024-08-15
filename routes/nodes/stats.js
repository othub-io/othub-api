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
    let network = data.network ? data.network : null;
    let blockchain = data.blockchain ? data.blockchain : null;
    let frequency = data.frequency ? data.frequency : `monthly`;
    let timeframe =
      Number.isInteger(data.timeframe)
        ? data.timeframe - 1
        : Number(data.timeframe) - 1;
    let limit = Number.isInteger(data.limit) ? data.limit : 1000;
    let grouped = data.grouped === "yes" ? "_grouped" : "";
    let order_by = "date";
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

    params = [];

    if (data.owner) {
      if (!ethers.utils.isAddress(data.owner)) {
        console.log(`Node stats request with invalid owner from ${api_key}`);

        res.status(400).json({
          success: false,
          msg: "Invalid owner (evm address) provided.",
        });
        return;
      }

      conditions.push(`nodeOwner = ?`);
      params.push(data.owner);
    }

    if (
      (network === "DKG Mainnet" ||
      network === "DKG Testnet") && (!frequency === "last1h" && !frequency === "last24h" && !frequency === "last7d" && !frequency === "last30d" && !frequency === "latest")
    ) {
      grouped = "_grouped";
    }

    if (data.nodeName) {
      conditions.push(`tokenName = ?`);
      params.push(data.nodeName);
    }

    if (!limit) {
      limit = 1000;
    }

    if (limit > 15000) {
      limit = 15000;
    }

    if (frequency === "hourly") {
      frequency = "hourly_7d";
      order_by = "datetime";

      if (timeframe > 0) {
        conditions.push(
          `datetime >= (select DATE_ADD(block_ts, interval -${timeframe} HOUR) as t from v_sys_staging_date)`
        );
      }
    }

    if (frequency === "daily") {
      if (timeframe > 0) {
        conditions.push(
          `date >= (select cast(DATE_ADD(block_ts, interval -${timeframe} DAY) as date) as t from v_sys_staging_date)`
        );
      }
    }

    if (frequency === "monthly") {
      if (timeframe > 0) {
        conditions.push(
          `date >= (select cast(DATE_ADD(block_ts, interval -${timeframe} MONTH) as date) as t from v_sys_staging_date)`
        );
      }
    }

    if (frequency === "last1h" || frequency === "last24h" || frequency === "last7d" || frequency === "last30d" || frequency === "last6m" || frequency === "last1y" || frequency === "latest") {
      order_by = "1";
    }

    ques = "";
    if (data.nodeId && grouped !== "_grouped") {
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

      conditions.push(`nodeId in (${ques})`);
    }

    query = `select * from v_nodes_stats${grouped}_${frequency}`;

    whereClause =
      conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";
    query = query + " " + whereClause + ` order by ${order_by} LIMIT ${limit}`;

    let node_data = [];
    if(!blockchain){
      let total_data = [];
      for (const blockchain of blockchains) {
        result = await queryDB
          .getData(query, params, "", blockchain.chain_name)
          .then((results) => {
            //console.log('Query results:', results);
            return results;
            // Use the results in your variable or perform further operations
          })
          .catch((error) => {
            console.error("Error retrieving data:", error);
          });
  
          for(const record of result){
            total_data.push(record)
          }

          chain_data = {
            blockchain_name: blockchain.chain_name,
            blockchain_id: blockchain.chain_id,
            data: result,
          };
    
          node_data.push(chain_data);
      }

      chain_data = {
        blockchain_name: "Total",
        blockchain_id: "99999",
        data: total_data,
      };

      node_data.unshift(chain_data);
    }else{
      for (const blockchain of blockchains) {
        result = await queryDB
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
          data: result,
        };
  
        node_data.push(chain_data);
      }
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
