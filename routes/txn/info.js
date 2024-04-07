require("dotenv").config();
const express = require("express");
const router = express.Router();
const queryTypes = require("../../util/queryTypes");
const queryDB = queryTypes.queryDB();

router.post("/", async function (req, res, next) {
  try {
    type = "txn-info"
    api_key = req.headers["x-api-key"];
    let query = `Select * FROM txn_header`;
    let data = req.body;
    let conditions = [];
    let params = [];

    console.log(`Visitor:${api_key} is getting txn info.`);

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

    if (data.ual) {
      const segments = data.ual.split(":");
      const argsString =
        segments.length === 3 ? segments[2] : segments[2] + segments[3];
      const args = argsString.split("/");

      if (args.length !== 3) {
        console.log(`Get request with invalid ual from ${api_key}`);
        res.status(400).json({
          success: false,
          msg: "Invalid UAL provided.",
        });
        return;
      }
    }

    if (data.app_name) {
      conditions.push(`app_name = ?`);
      params.push(data.app_name);
    }

    if (data.ual) {
      conditions.push(`ual = ?`);
      params.push(data.ual);
    }

    if (data.txn_id) {
      conditions.push(`txn_id = ?`);
      params.push(data.txn_id);
    }

    if (data.progress) {
      conditions.push(`progress = ?`);
      params.push(data.progress);
    }

    if (data.txn_type) {
      conditions.push(`txn_type = ?`);
      params.push(data.txn_type);
    }

    if (data.approver) {
      conditions.push(`approver = ?`);
      params.push(data.approver);
    }

    whereClause =
      conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";
    query = query + " " + whereClause + ` order by created_at desc`;

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
