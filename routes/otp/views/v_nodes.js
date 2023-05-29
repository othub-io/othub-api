require('dotenv').config()
var express = require('express')
var router = express.Router()
const purl = require('url')
const queryTypes = require('../../../public/util/queryTypes')
const mysql = require('mysql')
const otp_connection = mysql.createConnection({
  host: process.env.DBHOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: 'otp'
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

  type = 'v_nodes'
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
        'Request blocked by spam protection. Only 1 request is allow per 5 minutes without a premium authorization key.'
    }
    res.send(resp_object)
    return
  }

  limit = url_params.limit
  if (!limit) {
    limit = 500
  }

  query = `SELECT nodeId,networkId,tokenName,TokenSymbol,nodeGroup,createProfile_adminWallet,addedAdminWalletsHashes,removedWalletsHashes,NodeCreaton_ts,NodeCreaton_date FROM otp.v_nodes`
  conditions = []
  params = []

  if (url_params.nodeId) {
    conditions.push(`nodeId = ?`)
    params.push(url_params.nodeId)
  }

  if (url_params.networkId) {
    conditions.push(`networkId = ?`)
    params.push(url_params.networkId)
  }

  if (url_params.tokenName) {
    conditions.push(`tokenName = ?`)
    params.push(url_params.tokenName)
  }

  if (url_params.TokenSymbol) {
    conditions.push(`TokenSymbol = ?`)
    params.push(url_params.TokenSymbol)
  }

  if (url_params.nodeGroup) {
    conditions.push(`nodeGroup = ?`)
    params.push(url_params.nodeGroup)
  }

  if (url_params.createProfile_adminWallet) {
    conditions.push(`createProfile_adminWallet = ?`)
    params.push(url_params.createProfile_adminWallet)
  }

  if (url_params.addedAdminWalletsHashes) {
    conditions.push(`addedAdminWalletsHashes = ?`)
    params.push(url_params.addedAdminWalletsHashes)
  }

  if (url_params.removedWalletsHashes) {
    conditions.push(`removedWalletsHashes = ?`)
    params.push(url_params.removedWalletsHashes)
  }

  if (url_params.NodeCreaton_ts) {
    conditions.push(`NodeCreaton_ts = ?`)
    params.push(url_params.NodeCreaton_ts)
  }

  if (url_params.NodeCreaton_date) {
    conditions.push(`NodeCreaton_date = ?`)
    params.push(url_params.NodeCreaton_date)
  }

  whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''
  sqlQuery = query + ' ' + whereClause + `LIMIT ${limit}`

  shardTable = []
  await otp_connection.query(sqlQuery, params, function (error, row) {
    if (error) {
      throw error
    } else {
      setValue(row)
    }
  })

  function setValue (value) {
    shardTable = value
    res.json(shardTable)
  }
})

module.exports = router
