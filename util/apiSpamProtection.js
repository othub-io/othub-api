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

    if (api_key === process.env.NODE_OPS_KEY && type === 'stats') {
        console.log(`Request received with the node ops key.`)

        //insert a new time stamp
        time_stamp = new Date()
        time_stamp = Math.abs(time_stamp) / 1000

        query =
          'INSERT INTO request_history (request,date_stamp,api_key) VALUES (?,?,?)'
        params = [type, time_stamp, api_key]
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

  query = 'SELECT * FROM app_header WHERE api_key = ?'
  params = [api_key]
  app = await getOTHUBData(query, params)
    .then(results => {
      //console.log('Query results:', results);
      return results
      // Use the results in your variable or perform further operations
    })
    .catch(error => {
      console.error('Error retrieving data:', error)
    })

  if (app == '') {
    return {
      permission: `no_app`
    }
  }

  query = 'SELECT * FROM request_history WHERE api_key = ? AND UNIX_TIMESTAMP(NOW()) - date_stamp <= 1;'
  params = [api_key]
  request_frequency = await getOTHUBData(query, params)
    .then(results => {
      //console.log('Query results:', results);
      return results
      // Use the results in your variable or perform further operations
    })
    .catch(error => {
      console.error('Error retrieving data:', error)
    })

    console.log(request_frequency)
    rate = process.env.BASIC_RATE

    if (app[0].access === 'Super') {
        rate = process.env.SUPER_RATE
    }

    if (app[0].access === 'Turbo') {
        rate = process.env.TURBO_RATE
    }

    if (app[0].access === 'Giga') {
        rate = process.env.GIGA_RATE
    }

    console.log(`Requests last 1 second: ${request_frequency.length}`)
    console.log(`Rate limit ${rate} per 1 second.`)

    if (Number(rate) < Number(request_frequency.length)) {
        return {
            permission: `block`
        }
    }

    console.log(`Vistor:${api_key} is allow to ${type}.`)

    //insert a new time stamp
    time_stamp = new Date()
    time_stamp = Math.abs(time_stamp) / 1000

    query =
        'INSERT INTO request_history (request,date_stamp,api_key) VALUES (?,?,?)'
    params = [type, time_stamp, api_key]
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
