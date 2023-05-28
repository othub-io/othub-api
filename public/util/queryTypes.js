const apiSpamProtection = require('./apiSpamProtection')

const queryTypes = [
  {
    name: 'apiSpamProtection',
    getData: () => apiSpam(type, api_key)
  }
]

module.exports = {
  apiSpamProtection: function apiSpamProtection () {
    return queryTypes[0]
  }
}
