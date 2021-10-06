"use strict"

// import modules
const express = require("express");
const router = express.Router();
const mongodb = require("mongodb");

// database connection
var mongoClient;
var dbConn;
mongodb.MongoClient.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then((client) => {
  mongoClient = client;
  dbConn = mongoClient.db("JobBoard");
}).catch((err) => {
  console.error(err);
});

// index page
router.get("/", async (req, res) => {
  try {
    let jobboards = dbConn.collection('jobboards');
    let cursor = jobboards.find({});

    // find all jobboards
    await cursor.toArray((err, documents) => {
      // wait for database to be loaded
      if (documents.length == 0) {
        // redirect to same url
        res.redirect(req.url);
      } else {
        // build arguments
        let args = {
          title: "Job Board",
          jobboards: documents
        }
        // render html template
        res.render("index", args);
      }
    });
  } catch (err) {
    console.error(err);
  }
});

module.exports = router;