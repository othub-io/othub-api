require("dotenv").config();
const express = require("express");
const router = express.Router();
const web3passport = require("../../util/auth/passport");
const queryTypes = require("../../util/queryTypes");
const queryDB = queryTypes.queryDB();
const axios = require("axios");
const tf = require("@tensorflow/tfjs-node");
const nsfw = require("nsfwjs");

async function nsfwCheck(imageData) {
  // Decode the image data into a tensor
  const image = await tf.node.decodeImage(imageData);
  // Load the NSFW model
  const model = await nsfw.load();
  // Classify the image
  const predictions = await model.classify(image);
  // Dispose of the tensor to release memory
  image.dispose();
  return predictions;
}

router.post(
  "/",
  web3passport.authenticate("jwt", { session: false }),
  async function (req, res, next) {
    try {
      data = req.body;
      account = req.user[0].account;
      let chain_id

      console.log(`Visitor:${account} is editing their node.`);

      if (data.blockchain === "NeuroWeb Mainnet") {
        chain_id = '2043'
      }
  
      if (data.blockchain === "NeuroWeb Testnet") {
        chain_id = '20430'
      }
  
      if (data.blockchain === "Gnosis Mainnet") {
        chain_id = '100'
      }
  
      if (data.blockchain === "Chiado Testnet") {
        chain_id = '10200'
      }

      if (data.node_logo && data.node_logo !== "" && (data.node_id && data.node_id !== "") && chain_id) {
        const imgBuffer = Buffer.from(data.node_logo, "base64"); // Assuming the image is sent as a base64 string
        const nsfw_rating = await nsfwCheck(imgBuffer);
        console.log("NSFW Rating:", nsfw_rating); // Log NSFW rating
        // const query = `UPDATE node_header SET node_logo = ? WHERE owner = ?`;
        // await queryDB
        //   .getData(query, [data.img, account], "", "othub_db")
        //   .then((results) => results)
        //   .catch((error) => {
        //     console.error("Error updating img:", error);
        //     throw error;
        //   });
      }

      if ((data.node_bio && data.node_bio !== "") && (data.node_id && data.node_id !== "") && chain_id) {
        query = `UPDATE node_header SET bio = ? WHERE owner = ? AND node_id = ? AND chain_id = ?`;
        await queryDB
          .getData(query, [data.node_bio, account, data.node_id, chain_id], "", "othub_db")
          .then((results) => {
            //console.log('Query results:', results);
            return results;
            // Use the results in your variable or perform further operations
          })
          .catch((error) => {
            console.error("Error retrieving data:", error);
          });
      }

      res.status(200).json({
        success: true,
        result: [],
      });
    } catch (e) {
      console.log(e);
      res.status(500).json({
        success: false,
        msg: `Oops, something went wrong! Please try again later.`,
      });
    }
  }
);

module.exports = router;
