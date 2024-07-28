require("dotenv").config();
const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const web3passport = require("../../util/auth/passport");
const queryTypes = require("../../util/queryTypes");
const queryDB = queryTypes.queryDB();
const axios = require("axios");

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, process.env.IMAGE_DIRECTORY);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

router.post(
  "/",
  web3passport.authenticate("jwt", { session: false }),
  upload.single("image"),
  async function (req, res, next) {
    try {
      data = req.body;
      account = req.user[0].account;
      let blockchain = data.blockchain ? data.blockchain : "Gnosis Mainnet";
      let network = data.network ? data.network : "DKG Mainnet";
      let chain_id = data.chain_id;
      let node_id = data.node_id;
      let imageFileName = req.file.filename;
      let bio = data.bio;

      console.log(`Visitor:${account} is editing their node.`);

      if (blockchain === "NeuroWeb Mainnet" && !chain_id) {
        chain_id = "2043";
      }

      if (blockchain === "NeuroWeb Testnet" && !chain_id) {
        chain_id = "20430";
      }

      if (blockchain === "Gnosis Mainnet" && !chain_id) {
        chain_id = "100";
      }

      if (blockchain === "Chiado Testnet" && !chain_id) {
        chain_id = "10200";
      }

      // let query = `SELECT * FROM v_nodes WHERE nodeOwner = ? AND nodeId = ? AND chainId = ?`;
      // let node_record = await queryDB
      //   .getData(query, [account, node_id, chain_id], network, blockchain)
      //   .then((results) => results)
      //   .catch((error) => {
      //     console.error("Error retrieving current image:", error);
      //     throw error;
      //   });

      // if (node_record.length === 0) {
      //   console.log(`Request to update node from non owner from ${api_key}`);
      //   res.status(429).json({
      //     success: false,
      //     msg: "Node id not found on chain or owned by requestor.",
      //   });
      //   return;
      // }

      console.log(node_id)
      query = `SELECT * FROM node_header WHERE node_id = ? AND chain_id = ?`;
      profile_record = await queryDB
        .getData(query, [node_id, chain_id], "", "othub_db")
        .then((results) => results)
        .catch((error) => {
          console.error("Error retrieving current image:", error);
          throw error;
        });

        console.log(profile_record)
      if (profile_record.length === 0) {
        query = `INSERT INTO node_header VALUES (?,?,?,?,?)`;
        await queryDB
          .getData(
            query,
            [chain_id, node_id, account, imageFileName, bio],
            "",
            "othub_db"
          )
          .then((results) => results)
          .catch((error) => {
            console.error("Error updating img:", error);
            throw error;
          });
      } else {
        if (imageFileName && imageFileName !== "") {
          query = `SELECT node_logo FROM node_header WHERE node_id = ? and chain_id = ?`;
          let img = await queryDB
            .getData(query, [node_id, chain_id], "", "othub_db")
            .then((results) => results)
            .catch((error) => {
              console.error("Error retrieving current image:", error);
              throw error;
            });

          // If an image exists, delete it from the directory
          if (img.length > 0 && img[0].img) {
            const currentImagePath = `${process.env.IMAGE_DIRECTORY}/${img[0].img}`;
            fs.unlink(currentImagePath, (err) => {
              if (err) {
                console.error("Error deleting current image:", err);
              } else {
                console.log("Successfully deleted current image");
              }
            });
          }

          query = `UPDATE node_header SET node_logo = ? WHERE node_id = ? and chain_id = ?`;
          await queryDB
            .getData(query, [imageFileName, node_id, chain_id], "", "othub_db")
            .then((results) => results)
            .catch((error) => {
              console.error("Error updating img:", error);
              throw error;
            });
        }

        if (bio && bio !== "") {
          query = `UPDATE node_header SET bio = ? WHERE node_id = ? AND chain_id = ?`;
          await queryDB
            .getData(query, [bio, node_id, chain_id], "", "othub_db")
            .then((results) => {
              //console.log('Query results:', results);
              return results;
              // Use the results in your variable or perform further operations
            })
            .catch((error) => {
              console.error("Error retrieving data:", error);
            });
        }
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
