require("dotenv").config();
const express = require("express");
const router = express.Router();
const web3passport = require("../../util/auth/passport");
const queryTypes = require("../../util/queryTypes");
const queryDB = queryTypes.queryDB();

router.post(
  "/",
  web3passport.authenticate("jwt", { session: false }),
  async function (req, res, next) {
    try {
      let data = req.body;
      account = req.user[0].account;
      let params = []
      let conditions = []

      console.log(`Visitor:${account} is providing sentiment.`);

      if (!data.ual || data.ual === "") {
        console.log(`Edit sentiment with no ual provided.`);
        res.status(401).json({
          success: false,
          msg: "ual not provided to edit.",
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

        conditions.push(`chain_id = ?`);
        params.push(Number(args[0].replace(/\D/g, "")));

        conditions.push(`asset_contract = ?`);
        params.push(args[1]);

        conditions.push(`token_id = ?`);
        params.push(Number(args[2]));
      }

      if (
        (!data.sentiment && data.sentiment !== 0) ||
        data.sentiment === "" ||
        Number(data.sentiment) > 1
      ) {
        console.log(`Sentiment with missing or invalid value.`);
        res.status(401).json({
          success: false,
          msg: "Sentiment not provided. Options: 0 (dislike), 1 (like).",
        });
        return;
      }

      params.push(Number(data.sentiment))
      params.push(account)
      params.push(Number(data.sentiment))

      let query = `INSERT INTO sentiment_header (chain_id, asset_contract, token_id, sentiment, account) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE sentiment = ?`;

      await queryDB.getData(
        query,
        params,
        "",
        "othub_db"
      );

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
