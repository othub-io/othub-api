require("dotenv").config();
const express = require("express");
const router = express.Router();
const web3passport = require("../../util/auth/passport");
const queryTypes = require("../../util/queryTypes");
const { pubToAddress } = require("ethereumjs-util");
const queryDB = queryTypes.queryDB();

router.post(
  "/",
  web3passport.authenticate("jwt", { session: false }),
  async function (req, res, next) {
    try {
      let data = req.body;
      account = req.user[0].account;
      console.log(`Visitor:${account} is deleting sentiment.`);

      let params = [];
      let conditions = [];

      if (!data.ual || data.ual === "") {
        console.log(`Delete sentiment with no ual provided.`);
        res.status(401).json({
          success: false,
          msg: "ual not provided to delete.",
        });
        return;
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
        params.push(args[2]);
      }

      if (data.account) {
        conditions.push(`account = ?`);
        params.push(data.account);
      }

      let query = `DELETE FROM sentiment_header`;

      whereClause =
        conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";
      query = query + " " + whereClause;

      await queryDB
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
        result: [],
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
