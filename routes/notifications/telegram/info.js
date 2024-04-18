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

      query = "Select * from telegram_header where tg_id = ?";
      result = await queryDB.getData(
        query,
        [user_header[0].tg_id],
        network,
        blockchain,
        function (error, results, fields) {
          if (error) throw error;
        }
      );

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
