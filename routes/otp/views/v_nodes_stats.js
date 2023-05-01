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
    console.log(`v_nodes_stats request without authorization.`)
    resp_object = {
      result: 'Authorization key not provided.'
    }
    res.send(resp_object)
    return
  }

  type = 'v_nodes_stats'
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

  query = `SELECT * FROM OTP.v_nodes_stats`
  conditions = []
  params = []

  if(url_params.nodeId){
    conditions.push(`nodeId = ?`)
    params.push(url_params.nodeId)
  }

  if(url_params.networkId){
    conditions.push(`networkId = ?`)
    params.push(url_params.networkId)
  }

  if(url_params.tokenName){
    conditions.push(`tokenName = ?`)
    params.push(url_params.tokenName)
  }

  if(url_params.TokenSymbol){
    conditions.push(`TokenSymbol = ?`)
    params.push(url_params.TokenSymbol)
  }

  if(url_params.nodeOwner){
    conditions.push(`nodeOwner = ?`)
    params.push(url_params.nodeOwner)
  }

  if(url_params.nodeGroup){
    conditions.push(`nodeGroup = ?`)
    params.push(url_params.nodeGroup)
  }

  if(url_params.date){
    conditions.push(`date = ?`)
    params.push(url_params.date)
  }

  if(url_params.nodeStake){
    conditions.push(`nodeStake = ?`)
    params.push(url_params.nodeStake)
  }

  if(url_params.pubsCommited){
    conditions.push(`pubsCommited = ?`)
    params.push(url_params.pubsCommited)
  }

  if(url_params.estimatedEarningsIfChosen){
    conditions.push(`estimatedEarningsIfChosen = ?`)
    params.push(url_params.estimatedEarningsIfChosen)
  }

  if(url_params.estimatedEarnings){
    conditions.push(`estimatedEarnings = ?`)
    params.push(url_params.estimatedEarnings)
  }

  if(url_params.txFees){
    conditions.push(`txFees = ?`)
    params.push(url_params.txFees)
  }

  if(url_params.payouts){
    conditions.push(`Payouts = ?`)
    params.push(url_params.payouts)
  }

  if(url_params.totalPayouts){
    conditions.push(`TotalPayouts = ?`)
    params.push(url_params.totalPayouts)
  }

  if(url_params.ask){
    conditions.push(`Ask = ?`)
    params.push(url_params.ask)
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
