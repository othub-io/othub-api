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
      let botToken = req.body.botToken;
      let telegramID = req.body.telegramID;

      try{
        await axios.get(`https://api.telegram.org/bot${botToken}/getChat?chat_id=${telegramID}`);
      }catch(e){
        console.log(e)
        res.status(400).json({
            success: false,
            msg: "Invalid telegram credentials provided.",
          });
          return;
      }

      query = `select * from user_header where account = ?`;
      params = [account];
      user_header = await queryDB
        .getData(query, params, network, blockchain)
        .then((results) => {
          return results;
        })
        .catch((error) => {
          console.error("Error retrieving data:", error);
        });

      if (user_header[0].tg_id) {
        query = "UPDATE telegram_header set bot_token = ? where tg_id = ?";
        await queryDB.getData(
          query,
          [botToken, user_header[0].tg_id],
          network,
          blockchain,
          function (error, results, fields) {
            if (error) throw error;
          }
        );

        query = "UPDATE telegram_header set telegram_id = ? where tg_id = ?";
        await queryDB.getData(
          query,
          [telegramID, user_header[0].tg_id],
          network,
          blockchain,
          function (error, results, fields) {
            if (error) throw error;
          }
        );
      }

      if (!user_header[0].tg_id) {
        query = "INSERT INTO telegram_header values (UUID(),?,?)";
        await queryDB.getData(
          query,
          [botToken, telegramID],
          network,
          blockchain,
          function (error, results, fields) {
            if (error) throw error;
          }
        );

        query = `select * from telegram_header where telegram_id = ?`;
        params = [telegramID];
        telegram_header = await queryDB
          .getData(query, params, network, blockchain)
          .then((results) => {
            return results;
          })
          .catch((error) => {
            console.error("Error retrieving data:", error);
          });

        query = "UPDATE user_header set tg_id = ? where account = ?";
        await queryDB.getData(
          query,
          [telegram_header[0].tg_id, user_header[0].account],
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
