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
      let query = `select * from key_header`;
      let data = req.body;
      let account = req.user[0].account;
      let conditions = [];
      let params = [];

      console.log(`Visitor:${account} is getting key info.`);

      conditions.push(`account = ?`);
      params.push(account);

      whereClause =
        conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";
      query = query + " " + whereClause + ` order by 3 asc`;

      result = await queryDB
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
