require('dotenv').config()
var express = require('express')
var router = express.Router()
const purl = require('url')
const queryTypes = require("../../util/queryTypes");
const queryDB = queryTypes.queryDB();

/* GET explore page. */
router.get('/', async function (req, res, next) {
  try{
    let url_params = purl.parse(req.url, true).query
    let src = url_params.src
    res.sendFile(`${__dirname}/img/${src}`);
  }catch(e){
    console.log(e)
    res.end('Image Unavailable');
  }
})

module.exports = router
