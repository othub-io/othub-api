require("dotenv").config();
var express = require("express");
var router = express.Router();
const ethers = require("ethers");
const web3passport = require("../../util/auth/passport");
const queryTypes = require("../../util/queryTypes");
const queryDB = queryTypes.queryDB();
const keccak256 = require("keccak256");

router.post(
  "/",
  web3passport.authenticate("jwt", { session: false }),
  async function (req, res) {
    try {
      const data = req.body;
      const account = req.user[0].account;

      console.log(`Visitor:${account} is editing their app.`);

      if (data.img && data.img !== "") {
        console.log(data.img);
        // const query = `UPDATE user_header SET img = ? WHERE account = ?`;
        // await queryDB
        //   .getData(query, [data.img, account], "", "othub_db")
        //   .then((results) => results)
        //   .catch((error) => {
        //     console.error("Error updating img:", error);
        //     throw error;
        //   });
      }

      if (data.alias && data.alias !== "") {
        const query = `UPDATE user_header SET alias = ? WHERE account = ?`;
        await queryDB
          .getData(query, [data.alias, account], "", "othub_db")
          .then((results) => {
            //console.log('Query results:', results);
            return results;
            // Use the results in your variable or perform further operations
          })
          .catch((error) => {
            console.error("Error updating alias:", error);
          });
      }

      if (data.twitter && data.twitter !== "") {
        const query = `UPDATE user_header SET twitter = ? WHERE account = ?`;
        await queryDB
          .getData(query, [data.twitter, account], "", "othub_db")
          .then((results) => {
            //console.log('Query results:', results);
            return results;
            // Use the results in your variable or perform further operations
          })
          .catch((error) => {
            console.error("Error updating twitter:", error);
          });
      }

      if (data.bio && data.bio !== "") {
        const query = `UPDATE user_header SET bio = ? WHERE account = ?`;
        await queryDB
          .getData(query, [data.bio, account], "", "othub_db")
          .then((results) => {
            //console.log('Query results:', results);
            return results;
            // Use the results in your variable or perform further operations
          })
          .catch((error) => {
            console.error("Error updating bio:", error);
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
