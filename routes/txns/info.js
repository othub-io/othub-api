require("dotenv").config();
const express = require("express");
const router = express.Router();
const web3passport = require("../../util/auth/passport");
const queryTypes = require("../../util/queryTypes");
const queryDB = queryTypes.queryDB();

function isValidGUID(guid) {
  var regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return regex.test(guid);
}

router.post(
  "/",
  async function (req, res, next) {
    try {
      type = "txn-info";
      api_key = req.headers["x-api-key"];
      let query;
      let data = req.body;
      let account = data.account
      let limit = Number.isInteger(data.limit) ? data.limit : 1000;
      let conditions = [];
      let params = [];
      let key_ids;

      if (api_key && api_key !== "") {
        console.log(`Visitor:${api_key} is getting txn info.`);
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

        query = `select key_id from key_header where account in (select account from key_header where api_key = ?)`;
        key_ids = await queryDB
          .getData(query, [api_key], "", "othub_db")
          .then((results) => {
            //console.log('Query results:', results);
            return results;
            // Use the results in your variable or perform further operations
          })
          .catch((error) => {
            console.error("Error retrieving data:", error);
          });
      }

      query = `Select * FROM txn_header th`;

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
        conditions.push(`th.app_name = ?`);
        params.push(data.app_name);
      }

      if (data.ual) {
        conditions.push(`th.ual = ?`);
        params.push(data.ual);
      }

      if (isValidGUID(data.txn_id)) {
        conditions.push(`th.txn_id = ?`);
        params.push(data.txn_id);
      }

      if (data.progress) {
        conditions.push(`th.progress = ?`);
        params.push(data.progress);
      }

      if (data.txn_type) {
        conditions.push(`th.request = ?`);
        params.push(data.txn_type);
      }

      if (data.approver) {
        conditions.push(`th.approver = ?`);
        params.push(data.approver);
      }

    let ques = "";
    if (api_key) {
      for (const record of key_ids) {
        ques = ques + "?,";
        params.push(record.key_id);
      }

      ques = ques.substring(0, ques.length - 1);

      conditions.push(`th.key_id in (${ques})`);
    }

      whereClause =
        conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";
      query = query + " " + whereClause + ` order by created_at desc LIMIT ${limit}`;

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
  }
);

module.exports = router;
