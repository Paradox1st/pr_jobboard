"use strict"

// import modules
const express = require("express");
const router = express.Router();
const mongodb = require("mongodb");

// index page
router.get("/", async (req, res) => {
  try {
    var mongoClient;
    var dbConn;
    await mongodb.MongoClient.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }).then((client) => {
      console.log('DB connected');
      mongoClient = client;
      dbConn = mongoClient.db("JobBoard");
    }).catch((err) => {
      console.error(err);
    });

    // res.render("index", args);
  } catch (err) {
    console.error(err);
    // res.render("error/500");
  }
});