require('dotenv').config()
const express = require('express')
const router = express.Router()
const purl = require('url')
const ethers = require('ethers')
const queryTypes = require('../../../public/util/queryTypes')
const mysql = require('mysql')
const othubdb_connection = mysql.createConnection({
  host: process.env.DBHOST,
  user: process.env.DBUSER,
  password: process.env.DBPASSWORD,
  database: process.env.OTHUB_DB
})

function executeOTHUBQuery (query, params) {
  return new Promise((resolve, reject) => {
    othubdb_connection.query(query, params, (error, results) => {
      if (error) {
        reject(error)
      } else {
        resolve(results)
      }
    })
  })
}

async function getOTHUBData (query, params) {
  try {
    const results = await executeOTHUBQuery(query, params)
    return results
  } catch (error) {
    console.error('Error executing query:', error)
    throw error
  }
}

const DKGClient = require('dkg.js')
const OT_NODE_TESTNET_PORT = process.env.OT_NODE_TESTNET_PORT
const OT_NODE_MAINNET_PORT = process.env.OT_NODE_MAINNET_PORT

const testnet_node_options = {
  endpoint: process.env.OT_NODE_HOSTNAME,
  port: OT_NODE_TESTNET_PORT,
  useSSL: true,
  maxNumberOfRetries: 100
}

const mainnet_node_options = {
  endpoint: process.env.OT_NODE_HOSTNAME,
  port: OT_NODE_MAINNET_PORT,
  useSSL: true,
  maxNumberOfRetries: 100
}

const testnet_dkg = new DKGClient(testnet_node_options)
const mainnet_dkg = new DKGClient(mainnet_node_options)

router.get('/', async function (req, res) {
  try{
    url_params = purl.parse(req.url, true).query
    ip = req.socket.remoteAddress
    if (process.env.SSL_KEY_PATH) {
      ip = req.headers['x-forwarded-for']
    }

    type = `publish`

    console.log(url_params)
    res.setHeader('Access-Control-Allow-Origin', '*')

    if (!url_params.api_key) {
      console.log(`Publish request without authorization.`)
      resp_object = {
        result: 'Authorization key not provided.'
      }
      res.send(resp_object)
      return
    }

    apiSpamProtection = await queryTypes.apiSpamProtection()

    api_key = url_params.api_key
    permission = await apiSpamProtection
      .getData(type, url_params.api_key)
      .then(async ({ permission }) => {
        return permission
      })
      .catch(error => console.log(`Error : ${error}`))

    if (permission == `no_user`) {
      console.log(`No user found for api key ${url_params.api_key}`)
      resp_object = {
        result: 'Unauthorized key provided.'
      }
      res.send(resp_object)
      return
    }

    if (permission == `block`) {
      console.log(`Request frequency limit hit from ${url_params.api_key}`)
      resp_object = {
        result:
          'Request blocked by spam protection. Only 1 request is allow per 10 seconds.'
      }
      res.send(resp_object)
      return
    }

    if (!url_params.txn_data) {
      console.log(`Publish request with no data from ${url_params.api_key}`)
      resp_object = {
        result: 'No data provided.'
      }
      res.send(resp_object)
      return
    }

    function isJsonString (str) {
      try {
        JSON.parse(str)
      } catch (e) {
        return 'false'
      }
      return 'true'
    }

    valid_json = await isJsonString(url_params.txn_data)
    if (valid_json == 'false') {
      console.log(`Get request with bad data from ${url_params.api_key}`)
      resp_object = {
        result: 'Invalid Json.'
      }
      res.send(resp_object)
      return
    }

    if (!url_params.network || (url_params.network !== 'otp::testnet' && url_params.network !== 'otp::mainnet')) {
      console.log(`Publish request with invalid network from ${url_params.api_key}`)
      resp_object = {
        result:
          'Invalid network provided. Current supported networks are: otp::testnet, otp::mainnet.'
      }
      res.send(resp_object)
      return
    }

    if(!url_params.keywords){
      keywords = `othub-api`
    }else{
      keywords = url_params.keywords.replace("'", "");
      keywords = keywords.replace('"', "");
      keywords = keywords + ",othub-api";
    }

    epochs = url_params.epochs
    if(!url_params.epochs){
      epochs = 5
    }

    if(!url_params.trac_fee || !Number(url_params.trac_fee)){
      publishOptions= {
          epochsNum: epochs,
          maxNumberOfRetries: 30,
          frequency: 1,
          keywords: keywords,
          blockchain : {
              name: url_params.network,
          }
      }
    }else{
      publishOptions= {
          epochsNum: epochs,
          maxNumberOfRetries: 30,
          frequency: 1,
          tokenAmount: ethers.utils.parseEther(url_params.trac_fee),
          keywords: keywords,
          blockchain : {
              name: url_params.network,
          }
      }
    }

    query = `select * from user_header where api_key = ?`
      params = [url_params.api_key]
      user = await getOTHUBData(query, params)
        .then(results => {
          //console.log('Query results:', results);
          return results
          // Use the results in your variable or perform further operations
        })
        .catch(error => {
          console.error('Error retrieving data:', error)
        })

        query =
          `INSERT INTO txn_header (txn_id, status, admin_key, api_key, request, network, app_group, txn_description, txn_data, ual, keywords, state, txn_hash, txn_fee, trac_fee, epochs) VALUES (UUID(),?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
        await othubdb_connection.query(
          query,
          ['PENDING',user[0].admin_key, url_params.api_key, type, url_params.network, url_params.app_group, url_params.txn_description, url_params.txn_data, null, keywords, null, null, null, url_params.trac_fee, epochs],
          function (error, results, fields) {
            if (error) throw error
          }
        )

        query = `select * from txn_header where api_key = ? and request = ? order by created_at asc`
        params = [url_params.api_key,type]
        txn = await getOTHUBData(query, params)
          .then(results => {
            //console.log('Query results:', results);
            return results
            // Use the results in your variable or perform further operations
          })
          .catch(error => {
            console.error('Error retrieving data:', error)
          })

    resp_object = {
      result: 'Publish transaction queued successfully.',
      admin_key: user[0].admin_key,
      publish_url: `https://api.othub.io/portal?txn_id=${txn[0].txn_id}`
    }

    res.json(resp_object)
  }catch(e){
    console.log(e)
        resp_object = {
            result: 'Oops, something went wrong! Please try again later.'
        }

        res.setHeader('Access-Control-Allow-Origin', '*')
        res.json(resp_object)
  }
})

module.exports = router
