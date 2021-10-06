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
router.get("/:jobboard", async (req, res) => {
  try {
    let jobboards = dbConn.collection('jobboards');
    let collection = dbConn.collection('opportunities');
    let jobboard = await jobboards.findOne({ name: req.params.jobboard });
    let opportunities = collection.find({ jobboard: jobboard._id }, { sort: { id: 1 } });

    // find all jobboards
    await opportunities.toArray((err, documents) => {
      // build arguments
      let args = {
        title: req.params.jobboard + ": Opportunities",
        jobboard: jobboard.name,
        opportunities: documents
      }
      // render html template
      res.render("jobboard", args);
    });
  } catch (err) {
    console.error(err);
  }
});

module.exports = router;