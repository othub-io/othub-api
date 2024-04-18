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
      data = req.body;
      account = req.user[0].account;

      console.log(`Visitor:${account} is editing their app.`);

      if (data.app_description && data.app_description !== "") {
        query = `UPDATE app_header SET app_description = ? WHERE account = ?`;
        await queryDB
          .getData(
            query,
            [data.app_description, account],
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
      }

      if (data.alias && data.alias !== "") {
        query = `UPDATE app_header SET alias = ? WHERE account = ?`;
        await queryDB
          .getData(query, [data.alias, account], "", "othub_db")
          .then((results) => {
            //console.log('Query results:', results);
            return results;
            // Use the results in your variable or perform further operations
          })
          .catch((error) => {
            console.error("Error retrieving data:", error);
          });
      }

      if (data.website && data.website !== "") {
        query = `UPDATE app_header SET website = ? WHERE account = ?`;
        await queryDB
          .getData(query, [data.website, account], "", "othub_db")
          .then((results) => {
            //console.log('Query results:', results);
            return results;
            // Use the results in your variable or perform further operations
          })
          .catch((error) => {
            console.error("Error retrieving data:", error);
          });
      }

      if (data.github && data.github !== "") {
        query = `UPDATE app_header SET github = ? WHERE account = ?`;
        await queryDB
          .getData(query, [data.github, account], "", "othub_db")
          .then((results) => {
            //console.log('Query results:', results);
            return results;
            // Use the results in your variable or perform further operations
          })
          .catch((error) => {
            console.error("Error retrieving data:", error);
          });
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
