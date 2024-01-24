const apiSpamProtection = require('./apiSpamProtection')
const queryDB = require("./queryDB");

const queryTypes = [
  {
    name: 'apiSpamProtection',
    getData: () => apiSpam(type, api_key)
  },
  {
    name: "queryDB",
    getData: (query, params, network, blockchain) => queryDB(query, params, network, blockchain),
  }
]

module.exports = {
  apiSpamProtection: function apiSpamProtection () {
    return queryTypes[0]
  },
  queryDB: function queryDB() {
    return queryTypes[1];
  }
}
