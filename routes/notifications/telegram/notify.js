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
      data = req.body
      network = "";
      blockchain = "othub_db";
      nodeId = data.nodeId

      if (data.nodeId) {
        nodeIds = !Number(data.nodeId) ? data.nodeId.split(",").map(Number) : [data.nodeId];
        for (const nodeid of nodeIds) {
          if (!Number(nodeid)) {
            console.log(`Invalid node id provided by ${account}`);
            res.status(400).json({
              success: false,
              msg: "Invalid node ID provided.",
            });
            return;
          }
        }
      }

      query = `select tg.bot_token,tg.telegram_id from telegram_header tg join user_header uh on uh.tg_id = tg.tg_id where uh.account = ?`;
      params = [account];
      user_header = await queryDB
        .getData(query, params, network, blockchain)
        .then((results) => {
          return results;
        })
        .catch((error) => {
          console.error("Error retrieving data:", error);
        });

      if (
        user_header[0].telegram_id &&
        user_header[0].bot_token
      ) {
        msg = `
            Greetings from OThub.
            
    Looks like you've added or changed your Telegram ID. Here are commands to run to install/update the othub node monitoring script on your node(s):`;

        for (const node of nodeId) {
          msg =
            msg +
            `
    
    <-------Run this for Node ID ${node}------->
    wget -O /etc/cron.hourly/node-hourly-monitor https://raw.githubusercontent.com/othub-io/othub-runtime/master/public/scripts/node-monitor-hourly.sh &&
    chmod +x /etc/cron.hourly/node-hourly-monitor &&
    mkdir -p /etc/othub &&
    echo -e "CHAT_ID="${user_header[0].telegram_id}" \nBOT_ID="${user_header[0].bot_token}" \nNODE_ID="${node}" \nAPI_KEY="${process.env.FREEPI}" \nMAX_STORAGE_PERCENT="90"" > /etc/othub/config
    
              `;
        }

        try {
          bot = new Telegraf(user_header[0].bot_token);
          await bot.telegram.sendMessage(user_header[0].telegram_id, msg);
        } catch (e) {
          console.log(e);
        }
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
