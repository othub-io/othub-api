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
  web3passport.authenticate("jwt", { session: false }),
  async function (req, res, next) {
    try {
      data = req.body;
      account = req.user[0].account;

      if(!isValidGUID(data.txn_id)){
        console.log(`Get request with invalid txn id from ${account}`);
        res.status(400).json({
          success: false,
          msg: "Invalid txn_id provided.",
        });
        return;
      }

      console.log(`Visitor:${account} is completing a txn.`);

      query = `select app_name from app_header where account = ?`;
      params = [account];
      app = await queryDB
        .getData(query, params, network, blockchain)
        .then((results) => {
          //console.log('Query results:', results);
          return results;
          // Use the results in your variable or perform further operations
        })
        .catch((error) => {
          console.error("Error retrieving data:", error);
        });

      query = `UPDATE txn_header SET progress = ? WHERE app_name = ? and txn_id = ?`;
      await queryDB
        .getData(
          query,
          ["COMPLETE", app[0].app_name, data.txn_id],
          "",
          "othub_db"
        )
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
