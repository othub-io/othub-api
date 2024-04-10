require('dotenv').config()
const express = require('express')
const router = express.Router()
const queryTypes = require('../../util/queryTypes')
const queryDB = queryTypes.queryDB()

/* GET explore page. */
router.post('/', async function (req, res, next) {
  try{
    type = ""
    api_key = req.headers["x-api-key"];
    let network = req.body.network;
    let blockchain = "othub_db"
  
    let query = `select * from blockchains where environment = ?`
    let params = [network]
  
    if (!api_key || api_key === "") {
      console.log(`Create request without authorization.`);
      res.status(401).json({
        success: false,
        msg: "Authorization key not provided.",
      });
      return;
    }
  
    apiSpamProtection = await queryTypes.apiSpamProtection();
  
    permission = await apiSpamProtection
      .getData(type, api_key)
      .then(async ({ permission }) => {
        return permission;
      })
      .catch((error) => console.log(`Error : ${error}`));
  
    if (permission == `no_app`) {
      console.log(`No app found for api key ${api_key}`);
      res.status(401).json({
        success: false,
        msg: "Unauthorized key provided.",
      });
      return;
    }
  
    if (permission == `block`) {
      console.log(`Request frequency limit hit from ${api_key}`);
      res.status(429).json({
        success: false,
        msg: "The rate limit for this api key has been reached. Please upgrade your key to increase your limit.",
      });
      return;
    }
  
    network = "";
    let blockchains = await queryDB.getData(query, params, network, blockchain)
      .then(results => {
        //console.log('Query results:', results);
        return results
        // Use the results in your variable or perform further operations
      })
      .catch(error => {
        console.error('Error retrieving data:', error)
      })
  
      res.status(200).json({
        success: true,
        blockchains: blockchains,
      });
  }catch(e){
    console.log(e);
    res.status(500).json({
      success: false,
      msg: `Oops, something went wrong! Please try again later.`,
    });
  }
})

module.exports = router