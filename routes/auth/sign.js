require("dotenv").config();
const express = require("express");
const router = express.Router();
const ethers = require("ethers");
const ethUtil = require("ethereumjs-util");
const jwt = require("jsonwebtoken");
const queryTypes = require('../../util/queryTypes')
const queryDB = queryTypes.queryDB()

router.post("/", async function (req, res, next) {
  try{
    api_key = req.headers["x-api-key"];
    data = req.body;
    let public_address = data.public_address;
    let signature = data.signature;
    let blockchain = "othub_db"
    let network;
  
    if (!api_key || api_key === "") {
      console.log(`Create request without authorization.`);
      res.status(401).json({
        success: false,
        msg: "Authorization key not provided.",
      });
      return;
    }
  
    if (!public_address || public_address === "" || !ethers.utils.isAddress(public_address)) {
      console.log(`Register request without valid public_address.`);
      res.status(400).json({
        success: false,
        msg: "Valid public address not provided.",
      });
      return;
    }

    if (!signature || signature === "") {
      console.log(`Sign request without valid signature.`);
      res.status(400).json({
        success: false,
        msg: "Valid signature not provided.",
      });
      return;
    }
    
    
    query = `select * from user_header where public_address = ?`;
    params = [public_address];
    user_record = await queryDB
    .getData(query, params, network, blockchain)
      .then((results) => {
        return results;
      })
      .catch((error) => {
        console.error("Error retrieving data:", error);
      });
  
    // Get user from db
    if (user_record) {
      const msg = `Please sign nonce ${user_record[0].nonce} to authenticate account ownership.`;
      // Convert msg to hex string
      const msgHex = ethUtil.bufferToHex(Buffer.from(msg));
  
      // Check if signature is valid
      const msgBuffer = ethUtil.toBuffer(msgHex);
      const msgHash = ethUtil.hashPersonalMessage(msgBuffer);
      const signatureBuffer = ethUtil.toBuffer(signature);
      const signatureParams = ethUtil.fromRpcSig(signatureBuffer);
      const publicKey = ethUtil.ecrecover(
        msgHash,
        signatureParams.v,
        signatureParams.r,
        signatureParams.s
      );
      const addressBuffer = ethUtil.publicToAddress(publicKey);
      const address = ethUtil.bufferToHex(addressBuffer);
  
      // Check if address matches
      if (address.toLowerCase() === public_address.toLowerCase()) {
        // Change user nonce
        query = `UPDATE user_header SET nonce = ? where public_address = ?`;
        params = [Math.floor(Math.random() * 1000000), public_address];
        await queryDB
        .getData(query, params, network, blockchain)
          .then((results) => {
            return results;
          })
          .catch((error) => {
            console.error("Error retrieving data:", error);
          });
        // Set jwt token
        const token = jwt.sign(
          {
            _id: public_address,
            address: public_address,
          },
          process.env.JWT_SECRET,
          { expiresIn: "6h" }
        );
        res.status(200).json({
          success: true,
          token: `Bearer ${token}`,
          user_record: user_record,
          msg: "You are now logged in.",
        });
      } else {
        // User is not authenticated
        console.log(`Sign request without valid signature.`);
        res.status(400).json({
          success: false,
          msg: "Valid signature not provided.",
        });
        return;
      }
    }
  }catch(e){
    console.log(e);
    res.status(500).json({
      success: false,
      msg: `Oops, something went wrong! Please try again later.`,
    });
  }
});

module.exports = router;
