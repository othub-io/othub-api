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
    console.log(`v_sys_events_failed_tx request without authorization.`)
    resp_object = {
      result: 'Authorization key not provided.'
    }
    res.send(resp_object)
    return
  }

  type = 'v_sys_events_failed_tx'
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

  query = `SELECT * FROM OTP.v_sys_events_failed_tx`
  conditions = []
  params = []

  if(url_params.blockNum){
    conditions.push(`block_num = ?`)
    params.push(url_params.blockNum)
  }

  if(url_params.hash){
    conditions.push(`hash = ?`)
    params.push(url_params.hash)
  }

  if(url_params.method){
    conditions.push(`method = ?`)
    params.push(url_params.method)
  }

  if(url_params.extrinsicId){
    conditions.push(`extrinsic_id = ?`)
    params.push(url_params.extrinsicId)
  }

  if(url_params.extrinsicIdStr){
    conditions.push(`extrinsic_id_str = ?`)
    params.push(url_params.extrinsicIdStr)
  }

  if(url_params.module){
    conditions.push(`module = ?`)
    params.push(url_params.module)
  }

  if(url_params.eventId){
    conditions.push(`event_id = ?`)
    params.push(url_params.eventId)
  }

  if(url_params.eventIdx){
    conditions.push(`event_idx = ?`)
    params.push(url_params.eventIdx)
  }

  if(url_params.type){
    conditions.push(`type = ?`)
    params.push(url_params.type)
  }

  if(url_params.typeName){
    conditions.push(`type_name = ?`)
    params.push(url_params.typeName)
  }

  if(url_params.valueAddress){
    conditions.push(`value_address = ?`)
    params.push(url_params.valueAddress)
  }

  if(url_params.valueData){
    conditions.push(`value_data = ?`)
    params.push(url_params.valueData)
  }

  if(url_params.valueTopics){
    conditions.push(`value_topics = ?`)
    params.push(url_params.valueTopics)
  }

  if(url_params.createdAt){
    conditions.push(`created_at = ?`)
    params.push(url_params.createdAt)
  }

  if(url_params.updatedAt){
    conditions.push(`updated_at = ?`)
    params.push(url_params.updatedAt)
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
