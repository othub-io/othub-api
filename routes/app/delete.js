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
      data = req.body;
      account = req.user[0].account;
      console.log(`Visitor:${account} is deleting an app.`);

      query = `Select * FROM app_header WHERE account = ?`;
      result = await queryDB
        .getData(query, [account], "", "othub_db")
        .then((results) => {
          //console.log('Query results:', results);
          return results;
          // Use the results in your variable or perform further operations
        })
        .catch((error) => {
          console.error("Error retrieving data:", error);
        });

      query = `DELETE FROM txn_header WHERE app_name = ?`;
      await queryDB
        .getData(query, [result[0].app_name], "", "othub_db")
        .then((results) => {
          //console.log('Query results:', results);
          return results;
          // Use the results in your variable or perform further operations
        })
        .catch((error) => {
          console.error("Error retrieving data:", error);
        });

      query = `DELETE FROM app_header WHERE account = ?`;
      await queryDB
        .getData(query, [account], "", "othub_db")
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
