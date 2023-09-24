require('dotenv').config()
var express = require('express')
var router = express.Router()
const purl = require('url')
const queryTypes = require('../../public/util/queryTypes')
const mysql = require('mysql')
const otp_connection = mysql.createConnection({
  host: process.env.DBHOST,
  user: process.env.DBUSER,
  password: process.env.DBPASSWORD,
  database: process.env.SYNC_DB_TESTNET
})

router.get('/', async function (req, res) {
  url_params = purl.parse(req.url, true).query
  ip = req.socket.remoteAddress
  if (process.env.SSL_KEY_PATH) {
    ip = req.headers['x-forwarded-for']
  }

  res.setHeader('Access-Control-Allow-Origin', '*')

  if (!url_params.api_key) {
    console.log(`v_nodes request without authorization.`)
    resp_object = {
      result: 'Authorization key not provided.'
    }
    res.send(resp_object)
    return
  }

  type = 'stats'
  api_key = url_params.api_key

  const apiSpamProtection = await queryTypes.apiSpamProtection()
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
            'The rate limit for this api key has been reached. Please upgrade your key to increase your limit.'
    }
    res.send(resp_object)
    return
  }

  limit = url_params.limit
  if (!limit) {
    limit = 500
  }

  query = `SELECT nodeId,networkId,tokenName,TokenSymbol,nodeGroup,createProfile_adminWallet,createProfile_adminWallet_hash,current_adminWallet_hashes, createProfile_blockNumber, createProfile_txHash, createProfile_ts, createProfile_date, nodeStake, nodeAsk FROM v_nodes`
  conditions = []
  params = []

  if (url_params.nodeId) {
    conditions.push(`nodeId = ?`)
    params.push(url_params.nodeId)
  }

  whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''
  sqlQuery = query + ' ' + whereClause + `LIMIT ${limit}`

  v_nodes = []
  await otp_connection.query(sqlQuery, params, function (error, row) {
    if (error) {
      throw error
    } else {
      setValue(row)
    }
  })

  function setValue (value) {
    v_nodes = value
    res.json(v_nodes)
  }
})

module.exports = router
