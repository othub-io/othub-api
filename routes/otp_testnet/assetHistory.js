require("dotenv").config();
var express = require("express");
var router = express.Router();
const queryTypes = require("../../util/queryTypes");
const mysql = require("mysql");
const otp_connection = mysql.createConnection({
  host: process.env.DBHOST,
  user: process.env.DBUSER,
  password: process.env.DBPASSWORD,
  database: process.env.SYNC_DB_TESTNET,
});

router.post("/", async function (req, res) {
  try {
    ip = req.socket.remoteAddress;
    if (process.env.SSL_KEY_PATH) {
      ip = req.headers["x-forwarded-for"];
    }

    type = "history";
    data = req.body;
    api_key = req.headers["x-api-key"];

    if (!api_key || api_key === "") {
      console.log(`Create request without authorization.`);
      res.status(401).json({
        success: false,
        msg: "Authorization key not provided.",
      });
      return;
    }

    apiSpamProtection = await queryTypes.apiSpamProtection();

    permission = await apiSpamProtection
      .getData(type, api_key)
      .then(async ({ permission }) => {
        return permission;
      })
      .catch((error) => console.log(`Error : ${error}`));

    if (permission == `no_app`) {
      console.log(`No app found for api key ${api_key}`);
      res.status(401).json({
        success: false,
        msg: "Unauthorized key provided.",
      });
      return;
    }

    if (permission == `block`) {
      console.log(`Request frequency limit hit from ${api_key}`);
      res.status(429).json({
        success: false,
        msg: "The rate limit for this api key has been reached. Please upgrade your key to increase your limit.",
      });
      return;
    }

    if (!data.ual || data.ual === "") {
      console.log(`Get request with no ual from ${api_key}`);
      res.status(400).json({
        success: false,
        msg: "No UAL provided.",
      });
      return;
    }

    const segments = data.ual.split(":");
    const argsString =
      segments.length === 3 ? segments[2] : segments[2] + segments[3];
    const args = argsString.split("/");

    if (args.length !== 3) {
      console.log(`Get request with invalid ual from ${api_key}`);
      res.status(400).json({
        success: false,
        msg: "Invalid UAL provided.",
      });
      return;
    }

    limit = data.limit;
    if (!limit) {
      limit = 500;
    }

    query = `SELECT * FROM v_asset_history`;
    conditions = [];
    params = [];

    conditions.push(`asset_contract = ?`);
    params.push(args[1]);

    conditions.push(`token_id = ?`);
    params.push(args[2]);

    conditions.push(
      `(transfer_from != '0x0000000000000000000000000000000000000000' or transfer_from is null)`
    );

    whereClause =
      conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";
    sqlQuery = query + " " + whereClause + `LIMIT ${limit}`;

    history = [];
    await otp_connection.query(sqlQuery, params, function (error, row) {
      if (error) {
        res.status(504).json({
          success: false,
          msg: "Error occured while querying for the data.",
        });
        return;
      } else {
        setValue(row);
      }
    });

    function setValue(value) {
      res.status(200).json({
        success: true,
        data: value,
      });
    }
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      msg: `Oops, something went wrong! Please try again later.`,
    });
  }
});

module.exports = router;
