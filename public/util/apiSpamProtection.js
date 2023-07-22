require('dotenv').config()
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

module.exports = apiSpam = async (type, api_key) => {
  console.log(`Checking if visitor:${api_key} is spamming.`)

  if (api_key == process.env.GOD_KEY) {
    console.log(`Vistor:${api_key} IS USING THE GOD KEY.`)

    //insert a new time stamp
    time_stamp = new Date()
    time_stamp = Math.abs(time_stamp)

    query =
      'INSERT INTO request_history (request,date_last_used,ip_used,api_key) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE request = ?, date_last_used = ?'
    params = [type, time_stamp, null, api_key, type, time_stamp]
    await getOTHUBData(query, params)
      .then(results => {
        //console.log('Query results:', results);
        return results
        // Use the results in your variable or perform further operations
      })
      .catch(error => {
        console.error('Error retrieving data:', error)
      })

    return {
      permission: `allow`
    }
  }

  query = 'SELECT * FROM user_header WHERE api_key = ?'
  params = [api_key]
  user = await getOTHUBData(query, params)
    .then(results => {
      //console.log('Query results:', results);
      return results
      // Use the results in your variable or perform further operations
    })
    .catch(error => {
      console.error('Error retrieving data:', error)
    })

  console.log(user)
  if (user == '') {
    return {
      permission: `no_user`
    }
  }

  query = 'SELECT * FROM request_history WHERE api_key = ?'
  params = [api_key]
  request_history = await getOTHUBData(query, params)
    .then(results => {
      //console.log('Query results:', results);
      return results
      // Use the results in your variable or perform further operations
    })
    .catch(error => {
      console.error('Error retrieving data:', error)
    })

  console.log(request_history)
  if (request_history == '') {
    console.log(`Vistor:${api_key} is allow to ${type}.`)

    //insert a new time stamp
    time_stamp = new Date()
    time_stamp = Math.abs(time_stamp)

    query =
      'INSERT INTO request_history (request,date_last_used,ip_used,api_key) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE request = ?, date_last_used = ?'
    params = [type, time_stamp, null, api_key, type, time_stamp]
    await getOTHUBData(query, params)
      .then(results => {
        //console.log('Query results:', results);
        return results
        // Use the results in your variable or perform further operations
      })
      .catch(error => {
        console.error('Error retrieving data:', error)
      })

    return {
      permission: `allow`
    }
  }

  if (request_history) {
    console.log(`Vistor:${api_key} found in request_history.`)
    cooldown = 1 * Number(process.env.BASIC_RATE) * 1000

    if(type == 'get' || type == 'getLatestStateIssuer' || type == 'getOwner' || type == 'getStateIssuer' || type == 'getStates' || type == 'publish' || type == 'query' || type == 'transfer' || type == 'update'){
      cooldown = 1 * Number(process.env.DKG_RATE) * 1000
    }
    query = 'SELECT * FROM request_history WHERE api_key = ?'
    params = [api_key]
    spam_result = await getOTHUBData(query, params)
      .then(results => {
        //console.log('Query results:', results);
        return results
        // Use the results in your variable or perform further operations
      })
      .catch(error => {
        console.error('Error retrieving data:', error)
      })

    expireDate = spam_result[0].date_last_used
    currentDate = Math.abs(new Date())
    timeDif = currentDate - expireDate

    if (timeDif > cooldown) {
      console.log(`Vistor:${api_key} is allow to ${type}.`)

      time_stamp = new Date()
      time_stamp = Math.abs(time_stamp)

      //insert a new time stamp
      query =
        'INSERT INTO request_history (request,date_last_used,ip_used,api_key) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE request = ?, date_last_used = ?'
      params = [type, time_stamp, null, api_key, type, time_stamp]
      await getOTHUBData(query, params)
        .then(results => {
          //console.log('Query results:', results);
          return results
          // Use the results in your variable or perform further operations
        })
        .catch(error => {
          console.error('Error retrieving data:', error)
        })

      return {
        permission: `allow`
      }
    }
  }

  console.log(cooldown)
  console.log(timeDif)
  remaining = cooldown - timeDif
  console.log(`Visitor:${api_key} was blocked from ${type}ing.`)
  console.log(`Time remaining: ${remaining} milliseconds.`)

  return {
    permission: `block`
  }
}
