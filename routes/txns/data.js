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
      type = "txn-data";
      api_key = req.headers["x-api-key"];
      let data = req.body;
      let account = req.user[0].account
      let query;
      let params = [];


      query = `select dh.asset_data from data_header dh join txn_header th on th.data_id = dh.data_id where dh.data_id = ? and th.approver = ?`;

      if (isValidGUID(data.data_id)) {
        params.push(data.data_id);
      }

      params.push(account)

      console.log(query)
      console.log(params)
      let result = await queryDB
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
