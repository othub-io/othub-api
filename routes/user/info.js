require("dotenv").config();
var express = require("express");
var router = express.Router();
const ethers = require("ethers");
const web3passport = require("../../util/auth/passport");
const queryTypes = require("../../util/queryTypes");
const queryDB = queryTypes.queryDB();
const keccak256 = require("keccak256");

router.post("/", web3passport.authenticate("jwt", { session: false }), async function (req, res) {
  try {
    const account = req.user[0].account;

    let query = `SELECT * FROM user_header WHERE account = ?`;

    let result = await queryDB
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
      result: result,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      msg: `Oops, something went wrong! Please try again later.`,
    });
  }
});

module.exports = router;
