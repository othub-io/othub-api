require('dotenv').config()
var express = require('express')
var router = express.Router()
const purl = require('url')
const queryTypes = require('../../../../public/util/queryTypes')
const mysql = require('mysql')
const connection = mysql.createConnection({
  host: process.env.DBHOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.OTP_DB
})
const apiSpamProtection = await queryTypes.apiSpamProtection();

router.get('/', async function (req, res) {
  url_params = purl.parse(req.url, true).query
  ip = req.socket.remoteAddress
  if (process.env.SSL_KEY_PATH) {
    ip = req.headers['x-forwarded-for']
  }

  res.setHeader('Access-Control-Allow-Origin', '*')
  
  if (!url_params.api_key) {
    console.log(`v_dbg_txs_staging_check request without authorization.`)
    resp_object = {
      result: 'Authorization key not provided.'
    }
    res.send(resp_object)
    return
  }

  type = 'v_dbg_txs_staging_check'
  api_key = url_params.api_key

  permission = await apiSpamProtection
    .getData(type, api_key)
    .then(async ({ permission }) => {
      return permission
    })
    .catch(error => console.log(`Error : ${error}`))

  if (permission == `no_user`) {
    console.log(`No user found for api key ${api_key}`)
    resp_object = {
      result: 'Unauthorized key provided.'
    }
    res.send(resp_object)
    return
  }

  if (permission == `block`) {
    console.log(`Request frequency limit hit from ${api_key}`)
    resp_object = {
      result:
        'Request blocked by spam protection. Only 1 request is allow per 30 seconds without a premium authorization key.'
    }
    res.send(resp_object)
    return
  }

  limit = url_params.limit
  if(!limit){
    limit = 500
  }

  query = `SELECT * FROM OTP.v_dbg_txs_staging_check`
  conditions = []
  params = []

  if(url_params.extrinsicId){
    conditions.push(`extrinsic_id = ?`)
    params.push(url_params.extrinsicId)
  }

  if(url_params.method){
    conditions.push(`method = ?`)
    params.push(url_params.method)
  }

  if(url_params.issue){
    conditions.push(`issue = ?`)
    params.push(url_params.issue)
  }
  
  whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
  sqlQuery = query + ' ' + whereClause + `LIMIT ${limit}`;

  shardTable = []
  await connection.query(
    sqlQuery, params,
    function (error, row) {
      if (error) {
        throw error
      } else {
        setValue(row)
      }
    }
  )

  function setValue (value) {
    shardTable = value
    res.send(shardTable)
  }
})

module.exports = router
