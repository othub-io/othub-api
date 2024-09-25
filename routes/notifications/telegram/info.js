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
      let node_id = req.body.node_id;
      let chain_id = req.body.chain_id;
      let conditions = []
      let params = []

      conditions.push(`account = ?`);
      params.push(account);

      if (node_id && node_id !== "") {
        conditions.push(`node_id = ?`);
        params.push(Number(node_id));
      }

      if (chain_id && chain_id !== "") {
        conditions.push(`chain_id = ?`);
        params.push(Number(chain_id));
      }

      query = "Select * from telegram_header";
      whereClause =
        conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";
      query =
        query +
        " " +
        whereClause

      result = await queryDB.getData(
        query,
        params,
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
