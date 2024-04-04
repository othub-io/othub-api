require("dotenv").config();
const express = require("express");
const router = express.Router();
const queryTypes = require("../../util/queryTypes");
const queryDB = queryTypes.queryDB();

/* GET explore page. */
router.post("/", async function (req, res, next) {
  try {
    api_key = req.headers["x-api-key"];
    let network = data.network ? data.network : null;
    let blockchain = data.blockchain ? data.blockchain : null;
    let params = [];
    let query;

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
      query = `select chain_name,chain_id from blockchains where environment = ? and chain_name = ?`;
      params = [network, blockchain];
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

    let stats_data = [];

    for (const blockchain of blockchains) {
      query = `select nodeStake from v_nodes where nodeStake >= 50000`;
      params = [];
      let nodes = await queryDB
        .getData(query, params, network, blockchain.chain_name)
        .then((results) => {
          //console.log('Query results:', results);
          return results;
          // Use the results in your variable or perform further operations
        })
        .catch((error) => {
          console.error("Error retrieving data:", error);
        });

      query = `select sum(totalPubs) as count from v_pubs_stats_daily`;
      let pub_count = await queryDB
        .getData(query, params, network, blockchain.chain_name)
        .then((results) => {
          //console.log('Query results:', results);
          return results;
          // Use the results in your variable or perform further operations
        })
        .catch((error) => {
          console.error("Error retrieving data:", error);
        });

      query = `select totalPubs,totalTracSpent from v_pubs_stats_last24h order by datetime`;
      let pubs_stats_last24h = await queryDB
        .getData(query, params, network, blockchain.chain_name)
        .then((results) => {
          //console.log('Query results:', results);
          return results;
          // Use the results in your variable or perform further operations
        })
        .catch((error) => {
          console.error("Error retrieving data:", error);
        });

      query = `select totalTracSpent from v_pubs_stats_total`;
      let totalTracSpent = await queryDB
        .getData(query, params, network, blockchain.chain_name)
        .then((results) => {
          //console.log('Query results:', results);
          return results;
          // Use the results in your variable or perform further operations
        })
        .catch((error) => {
          console.error("Error retrieving data:", error);
        });

      let totalStake = 0;
      for (const node of nodes) {
        totalStake = totalStake + Number(node.nodeStake);
      }

      chain_data = {
        blockchain_name: blockchain.chain_name,
        blockchain_id: blockchain.chain_id,
        nodes: nodes.length,
        pubs_stats_last24h: pubs_stats_last24h,
        pub_count: pub_count[0].count,
        totalTracSpent: totalTracSpent[0].totalTracSpent,
        totalStake: totalStake,
      };

      stats_data.push(chain_data);
    }

    res.status(200).json({
      success: true,
      result: stats_data,
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
