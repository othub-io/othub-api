require("dotenv").config();
const express = require("express");
const router = express.Router();
const web3passport = require("../../util/auth/passport");
const queryTypes = require("../../util/queryTypes");
const queryDB = queryTypes.queryDB();

function randomWord(length) {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;

  for (let i = 0; i < length; ++i) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}

router.post(
  "/",
  web3passport.authenticate("jwt", { session: false }),
  async function (req, res, next) {
    try {
      data = req.body;
      account = req.user[0].account;
      access = data.access;
      rights_holder = data.rights_holder;
      msg = ``;

      console.log(`Visitor:${account} is creating a key.`);

      query = `SELECT * FROM key_header WHERE account = ?`;
      params = [account];
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

      if (result.length >= 3) {
        console.log(`Keys already exists from ${account}`);
        res.status(400).json({
          success: false,
          result: result[0],
          msg: "Keys already exists.",
        });
        return;
      }

      api_key = await randomWord(Math.floor(25) + 5);
      query = `INSERT INTO key_header values (UUID(),?,?,?,?,?)`;
      await queryDB
        .getData(
          query,
          [api_key, account, "Basic", data.rights_holder],
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
