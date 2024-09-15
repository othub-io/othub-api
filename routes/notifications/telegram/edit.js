require("dotenv").config();
var express = require("express");
var router = express.Router();
const keccak256 = require("keccak256");
const { Telegraf } = require("telegraf");
const axios = require("axios");
const web3passport = require("../../../util/auth/passport");
const queryTypes = require("../../../util/queryTypes");
const queryDB = queryTypes.queryDB();

/* GET explore page. */
router.post(
  "/",
  web3passport.authenticate("jwt", { session: false }),
  async function (req, res, next) {
    try {
      account = req.user[0].account;
      network = "";
      blockchain = "othub_db";
      let bot_token = req.body.bot_token;
      let telegram_id = req.body.telegram_id;
      let node_id = req.body.node_id;
      let chain_id = req.body.chain_id;
      let daily_report = req.body.daily_report;
      let total_shares = req.body.total_shares;
      let operator_fee = req.body.operator_fee;
      let node_ask = req.body.node_ask;
      let active_status = req.body.active_status;

      try {
        await axios.get(
          `https://api.telegram.org/bot${bot_token}/getChat?chat_id=${telegram_id}`
        );
      } catch (e) {
        res.status(400).json({
          success: false,
          msg: "Invalid telegram credentials provided.",
        });
        return;
      }

      query = `select * from telegram_header where account = ? and node_id = ? and chain_id = ?`;
      params = [account, node_id, chain_id];
      telegram_header = await queryDB
        .getData(query, params, network, blockchain)
        .then((results) => {
          return results;
        })
        .catch((error) => {
          console.error("Error retrieving data:", error);
        });

      if (telegram_header) {
        query =
          "UPDATE telegram_header set bot_token = ?, telegram_id = ?, daily_report = ?, total_shares = ?, operator_fee = ?, node_ask = ?, active_status = ? where account = ? and node_id = ? and chain_id = ?";
        await queryDB.getData(
          query,
          [
            bot_token,
            telegram_id,
            daily_report,
            total_shares,
            operator_fee,
            node_ask,
            active_status,
            account,
            node_id,
            chain_id
          ],
          network,
          blockchain,
          function (error, results, fields) {
            if (error) throw error;
          }
        );
      }

      if (telegram_header.length === 0) {
        query = "INSERT INTO telegram_header values (?,?,?,?,?,?,?,?,?,?)";
        await queryDB.getData(
          query,
          [account, bot_token, telegram_id, daily_report, total_shares, operator_fee, node_ask, active_status, chain_id, node_id],
          network,
          blockchain,
          function (error, results, fields) {
            if (error) throw error;
          }
        );
      }

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
