require("dotenv").config();
const express = require("express");
const router = express.Router();
const queryTypes = require("../../util/queryTypes");
const queryDB = queryTypes.queryDB();

/* GET explore page. */
router.post("/", async function (req, res, next) {
  try {
    api_key = req.headers["x-api-key"];
    let sync = [];
    let chains = [];
    let network = "";
    let blockchain = "othubdb"

    let query = `select chain_name from blockchains`;
    let params = [];
    chains = await queryDB
        .getData(query, params, network, blockchain)
        .then((results) => {
          //console.log('Query results:', results);
          return results;
          // Use the results in your variable or perform further operations
        })
        .catch((error) => {
          console.error("Error retrieving data:", error);
        });

    if (!api_key || api_key === "") {
      console.log(`Create request without authorization.`);
      res.status(401).json({
        success: false,
        msg: "Authorization key not provided.",
      });
      return;
    }

    query = `select val from v_sys_sync_status where parameter = 'sync_to_reality_delay_mins' OR parameter = 'last_synced_block_timestamp'`;
    params = [];
    for (const chain of chains) {
      let sync_status;
      let blockchain = chain;
      sync_info = await queryDB
        .getData(query, params, network, blockchain)
        .then((results) => {
          //console.log('Query results:', results);
          return results;
          // Use the results in your variable or perform further operations
        })
        .catch((error) => {
          console.error("Error retrieving data:", error);
        });

      if (sync_info[1].val > 30) {
        sync_status = false;
      }

      record = {
        status: sync_status,
        blockchain: blockchain,
        last_sync: sync_info[0].val,
      };
      sync.push(record);
    }

    res.status(200).json({
      success: true,
      sync: sync,
      msg: ``,
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
