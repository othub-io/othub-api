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
    let query;
    let nodeId = Number.isInteger(data.nodeId) ? data.nodeId : null;
    let limit = Number(data.limit) < 10000 ? data.limit : 100;
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
        console.log(
          `Asset info request with invalid publisher from ${api_key}`
        );

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

      conditions.push(`asset_contract = ?`);
      params.push(args[1]);

      conditions.push(`token_id = ?`);
      params.push(Number(args[2]));
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

    query = `select * from v_pubs`;

    whereClause =
      conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";
    query =
      query + " " + whereClause + ` order by block_date desc, block_ts_hour DESC LIMIT ${limit}`;

    let pub_data = [];
    if (!blockchain) {
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

        for (const record of result) {
          total_data.push(record);
        }

        chain_data = {
          blockchain_name: blockchain.chain_name,
          blockchain_id: blockchain.chain_id,
          data: result,
        };

        pub_data.push(chain_data);
      }

      chain_data = {
        blockchain_name: "Total",
        blockchain_id: "99999",
        data: total_data,
      };

      pub_data.unshift(chain_data);
    } else {
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

        pub_data.push(chain_data);
      }
    }

    res.status(200).json({
      success: true,
      result: pub_data,
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
