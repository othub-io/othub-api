require('dotenv').config()
var express = require('express')
var router = express.Router()

router.get('/', async function (req, res) {
  obj = {
    result: `Invalid path.`
  }
  res.json(obj)
})

module.exports = router
