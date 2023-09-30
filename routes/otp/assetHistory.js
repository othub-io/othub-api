require("dotenv").config();
var express = require("express");
var router = express.Router();
const purl = require("url");
const queryTypes = require("../../public/util/queryTypes");
const mysql = require("mysql");
const otp_connection = mysql.createConnection({
  host: process.env.DBHOST,
  user: process.env.DBUSER,
  password: process.env.DBPASSWORD,
  database: process.env.SYNC_DB,
});

router.get("/", async function (req, res) {
  try {
    url_params = purl.parse(req.url, true).query;
    ip = req.socket.remoteAddress;
    if (process.env.SSL_KEY_PATH) {
      ip = req.headers["x-forwarded-for"];
    }

    res.setHeader("Access-Control-Allow-Origin", "*");

    if (!url_params.api_key) {
      console.log(`v_nodes request without authorization.`);
      resp_object = {
        status: "401",
        result: "401 Unauthorized: Authorization key not provided.",
      };
      res.send(resp_object);
      return;
    }

    type = "history";
    api_key = url_params.api_key;

    const apiSpamProtection = await queryTypes.apiSpamProtection();
    permission = await apiSpamProtection
      .getData(type, api_key)
      .then(async ({ permission }) => {
        return permission;
      })
      .catch((error) => console.log(`Error : ${error}`));

    if (permission == `no_user`) {
      console.log(`No user found for api key ${api_key}`);
      resp_object = {
        status: "401",
        result: "401 Unauthorized: Unauthorized key provided.",
      };
      res.send(resp_object);
      return;
    }

    if (permission == `block`) {
      console.log(`Request frequency limit hit from ${api_key}`);
      resp_object = {
        status: "429",
        result:
          "429 Too Many Requests: The rate limit for this api key has been reached. Please upgrade your key to increase your limit.",
      };
      res.send(resp_object);
      return;
    }

    const segments = url_params.ual.split(":");
    const argsString =
      segments.length === 3 ? segments[2] : segments[2] + segments[3];
    const args = argsString.split("/");

    if (args.length !== 3) {
      console.log(`Get request with invalid ual from ${url_params.api_key}`);
      resp_object = {
        status: "400",
        result: "400 Bad Request: Invalid UAL provided.",
      };
      res.send(resp_object);
      return;
    }

    limit = url_params.limit;
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
        throw error;
      } else {
        setValue(row);
      }
    });

    function setValue(value) {
      resp_object = {
        status: "200",
        result: value,
      };
      res.json(resp_object);
    }
  } catch (e) {
    console.log(e);
    resp_object = {
      status: "500",
      result:
        "500 Internal Server Error: Oops, something went wrong! Please try again later.",
      error: e,
    };
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.json(resp_object);
  }
});

module.exports = router;
