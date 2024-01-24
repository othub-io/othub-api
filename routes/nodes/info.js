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
    data = req.body;
    api_key = req.headers["x-api-key"];
    let blockchain;

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

    network = "";
    if (
      data.network !== "mainnet" &&
      data.network !== "testnet" &&
      data.network !== "otp:2043" &&
      data.network !== "otp:20430" &&
      data.network !== "gnosis:100" &&
      data.network !== "gnosis:10200"
    ) {
      console.log(
        `Create request without valid network. Supported: mainnet, testnet, otp:20430, otp:2043, gnosis:10200, gnosis:100`
      );
      res.status(400).json({
        success: false,
        msg: "Invalid network provided.",
      });
      return;
    }

    if (data.network === "mainnet") {
      network = "DKG Mainnet";
    }

    if (data.network === "testnet") {
      network = "DKG Testnet";
    }

    if (data.network === "otp:2043") {
      blockchain = "NeuroWeb Mainnet";
    }

    if (data.network === "otp:20430") {
      blockchain = "NeuroWeb Testnet";
    }

    if (data.network === "gnosis:100") {
      blockchain = "Gnosis Mainnet";
    }

    if (data.network === "gnosis:10200") {
      blockchain = "Chiado Testnet";
    }

    limit = data.limit;
    if (!limit) {
      limit = 1000;
    }

    if (limit > 2000) {
      limit = 2000;
    }

    query = `select * from v_nodes`;

    conditions = [];
    params = [];
    ques = "";

    if (data.nodeId) {
      nodeIds = data.nodeId.split(",").map(Number);
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
      params = nodeIds;
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

    whereClause =
      conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";
    query =
      query +
      " " +
      whereClause +
      ` order by createProfile_ts desc LIMIT ${limit}`;

    value = await queryDB
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
      data: value,
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
