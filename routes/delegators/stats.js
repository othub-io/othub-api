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
    let network = data.network ? data.network : null;
    let blockchain = data.blockchain ? data.blockchain : null;
    let frequency = data.frequency ? data.frequency : `daily`;
    let timeframe =
      Number.isInteger(data.timeframe)
        ? data.timeframe
        : null;
    let limit = Number.isInteger(data.limit) ? data.limit : 1000;
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

    if (data.delegator) {
      if (!ethers.utils.isAddress(data.owner)) {
        console.log(`Delegator stats request with invalid delegator from ${api_key}`);

        res.status(400).json({
          success: false,
          msg: "Invalid delegator (evm address) provided.",
        });
        return;
      }

      conditions.push(`delegator = ?`);
      params.push(data.delegator);
    }

    if (!limit) {
      limit = 1000;
    }

    if (limit > 2000) {
      limit = 2000;
    }

    // if (frequency === "hourly") {
    //   frequency = "hourly_7d";
    //   order_by = "datetime";

    //   if (timeframe) {
    //     conditions.push(
    //       `datetime >= (select DATE_ADD(block_ts, interval -${timeframe} HOUR) as t from v_sys_staging_date)`
    //     );
    //   }
    // }

    if (frequency === "daily") {
      if (timeframe) {
        conditions.push(
          `date >= (select cast(DATE_ADD(block_ts, interval -${timeframe} DAY) as date) as t from v_sys_staging_date)`
        );
      }
    }

    // if (frequency === "monthly") {
    //   if (timeframe) {
    //     conditions.push(
    //       `date >= (select cast(DATE_ADD(block_ts, interval -${timeframe} MONTH) as date) as t from v_sys_staging_date)`
    //     );
    //   }
    // }

    if (frequency === "latest") {
      order_by = "3";
    }

    let ques = "";
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

      conditions.push(`nodeId in (${ques})`);
    }

    query = `select * from v_delegators_stats_${frequency}`;

    whereClause =
      conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";
    query = query + " " + whereClause + ` order by ${order_by} LIMIT ${limit}`;

    let node_data = [];
    for (const blockchain of blockchains) {
      data = await queryDB
        .getData(query, params, network, blockchain.chain_name)
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
