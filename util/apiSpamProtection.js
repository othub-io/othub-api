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

  query = `select * from key_header where api_key = ?`;
  params = [api_key]
  key = await getOTHUBData(query, params)
    .then(results => {
      //console.log('Query results:', results);
      return results
      // Use the results in your variable or perform further operations
    })
    .catch(error => {
      console.error('Error retrieving data:', error)
    })

  if (key == '') {
    return {
      permission: `no_app`
    }
  }

  query = 'SELECT * FROM request_header WHERE key_id = ? AND UNIX_TIMESTAMP(NOW()) - date_stamp <= 1;'
  params = [key[0].key_id]
  request_frequency = await getOTHUBData(query, params)
    .then(results => {
      //console.log('Query results:', results);
      return results
      // Use the results in your variable or perform further operations
    })
    .catch(error => {
      console.error('Error retrieving data:', error)
    })

    rate = process.env.BASIC_RATE

    if (key[0].access === 'Super') {
        rate = process.env.SUPER_RATE
    }

    if (key[0].access === 'Turbo') {
        rate = process.env.TURBO_RATE
    }

    if (key[0].access === 'Giga') {
        rate = process.env.GIGA_RATE
    }

    if (key === 'Create-n-Transfer') {
      rate = process.env.CNT_RATE
    }

    console.log(`Requests last 1 second: ${request_frequency.length}`)
    console.log(`Rate limit ${rate} per 1 second.`)

    if (Number(rate) < Number(request_frequency.length)) {
        return {
            permission: `block`
        }
    }

    if(type === 'Create-n-Transfer'){
      query = 'SELECT * FROM txn_header WHERE request = ? AND key_id = ? AND approver is null AND progress = ?'
      params = [type,key[0].key_id,"PENDING"]
      queue_count = await getOTHUBData(query, params)
        .then(results => {
          //console.log('Query results:', results);
          return results
          // Use the results in your variable or perform further operations
        })
        .catch(error => {
          console.error('Error retrieving data:', error)
        })

        console.log(queue_count.length)
        if (50 <= Number(queue_count.length)) {
          console.log(`Create-n-Transfer rate limit has been reached.`)
          return {
              permission: `block`
          }
      }
    }

    console.log(`Vistor:${api_key} is allowed to ${type}.`)

    //insert a new time stamp
    time_stamp = new Date()
    time_stamp = Math.abs(time_stamp) / 1000

    query =
        'INSERT INTO request_header (request,date_stamp,key_id) VALUES (?,?,?)'
    params = [type, time_stamp, key[0].key_id]
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
