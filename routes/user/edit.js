require("dotenv").config();
var express = require("express");
var router = express.Router();
const multer = require("multer");
const fs = require("fs");
const ethers = require("ethers");
const web3passport = require("../../util/auth/passport");
const queryTypes = require("../../util/queryTypes");
const queryDB = queryTypes.queryDB();
const keccak256 = require("keccak256");

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, process.env.IMAGE_DIRECTORY);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

router.post(
  "/",
  web3passport.authenticate("jwt", { session: false }),
  upload.single('image'),
  async function (req, res) {
    try {
      const data = req.body;
      const account = req.user[0].account;

      console.log(`Visitor:${account} is editing their app.`);

      let imageFileName = null;

      if (req.file) {
        imageFileName = req.file.filename;

        // Query the current image from the database
        let query = `SELECT img FROM user_header WHERE account = ?`;
        let img = await queryDB
          .getData(query, [account], "", "othub_db")
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

        // Update the database with the new image
        query = `UPDATE user_header SET img = ? WHERE account = ?`;
        await queryDB
          .getData(query, [imageFileName, account], "", "othub_db")
          .then((results) => results)
          .catch((error) => {
            console.error("Error updating img:", error);
            throw error;
          });
      }

      if (data.alias && data.alias !== "") {
        const query = `UPDATE user_header SET alias = ? WHERE account = ?`;
        await queryDB
          .getData(query, [data.alias, account], "", "othub_db")
          .then((results) => {
            return results;
          })
          .catch((error) => {
            console.error("Error updating alias:", error);
          });
      }

      if (data.twitter && data.twitter !== "") {
        const query = `UPDATE user_header SET twitter = ? WHERE account = ?`;
        await queryDB
          .getData(query, [data.twitter, account], "", "othub_db")
          .then((results) => {
            return results;
          })
          .catch((error) => {
            console.error("Error updating twitter:", error);
          });
      }

      if (data.bio && data.bio !== "") {
        const query = `UPDATE user_header SET bio = ? WHERE account = ?`;
        await queryDB
          .getData(query, [data.bio, account], "", "othub_db")
          .then((results) => {
            return results;
          })
          .catch((error) => {
            console.error("Error updating bio:", error);
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
