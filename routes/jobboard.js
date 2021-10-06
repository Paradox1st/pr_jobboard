"use strict"

// import modules
const express = require("express");
const router = express.Router();
const dbutils = require("../utils/db");

// database connection
var db = dbutils.getDb();

// index page
router.get("/:jobboard", async (req, res) => {
  try {
    // set up database queries
    let jobboards = db.collection('jobboards');
    let collection = db.collection('opportunities');
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

// export to let app.js use these routes
module.exports = router;