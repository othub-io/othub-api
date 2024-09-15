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
      console.log(`Visitor:${account} is deleting an app.`);

      if (!data.api_key || data.api_key === "") {
        console.log(`Delete key with no key provided.`);
        res.status(401).json({
          success: false,
          msg: "API key not provided to delete.",
        });
        return;
      }

      query = `select ah.app_name,kh.key_id from key_header kh join app_header ah on ah.account = kh.account where kh.api_key = ?`;
      app_header = await queryDB
        .getData(query, [data.api_key], "", "othub_db")
        .then((results) => {
          //console.log('Query results:', results);
          return results;
          // Use the results in your variable or perform further operations
        })
        .catch((error) => {
          console.error("Error retrieving data:", error);
        });

      // query = `DELETE FROM txn_header WHERE app_name = ? and key_id = ?`;
      // await queryDB
      //   .getData(query, [app_header[0].app_name, app_header[0].key_id], "", "othub_db")
      //   .then((results) => {
      //     //console.log('Query results:', results);
      //     return results;
      //     // Use the results in your variable or perform further operations
      //   })
      //   .catch((error) => {
      //     console.error("Error retrieving data:", error);
      //   });

      query = `DELETE FROM key_header WHERE account = ? and key_id = ?`;
      await queryDB
        .getData(query, [account, app_header[0].key_id], "", "othub_db")
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
