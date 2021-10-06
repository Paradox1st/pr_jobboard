"use strict"

// import modules
const express = require("express");
const router = express.Router();
const dbutils = require("../utils/db");

// database connection
var db = dbutils.getDb();

// index page
router.get("/", async (req, res) => {
  try {
    // set up database query
    let jobboards = db.collection('jobboards');
    let cursor = jobboards.find({});

    // find all jobboards
    await cursor.toArray((err, documents) => {
      // build arguments
      let args = {
        title: "Job Board",
        jobboards: documents
      }

      // render html template
      res.render("index", args);
    });
  } catch (err) {
    console.error(err);
  }
});

// export to let app.js use these routes
module.exports = router;