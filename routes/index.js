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
    let count = await cursor.count();
    let documents = await cursor.toArray();
    res.send(documents);
  } catch (err) {
    console.error(err);
    // res.render("error/500");
  }
});

module.exports = router;