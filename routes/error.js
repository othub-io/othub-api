require('dotenv').config()
var express = require('express')
var router = express.Router()

router.get('/', async function (req, res) {
  obj = {
    status: "400",
    result: `404 Not Found: Invalid path.`
  }
  res.json(obj)
})

module.exports = router
