"use strict";

// import modules
const mongoose = require("mongoose");
const JobBoard = require("../models/jobboard");
const Opportunity = require("../models/opportunity");
const { readJSON, readCSV } = require("./raw");

// try connecting to database
async function connectDB() {
  try {
    const conn = await mongoose.connect(
      process.env.MONGO_URI || "mongodb://127.0.0.1:27017/",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });

    // initialize db
    await initDB();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

// populate database
// drops existing collection if any
async function initDB() {
  // clear collections
  await JobBoard.deleteMany({});
  await Opportunity.deleteMany({});

  // add jobboards from json file
  var jobboards = readJSON("./raw/jobBoards.json");
  // add each jobboard into database
  await jobboards.forEach(async job => {
    let jb = new JobBoard(job);
    await jb.save();
  });
  console.log("Job Board collection initialized");

  // add opportunities to database
  var opportunities = readCSV("./raw/job_opportunities.csv");
}

// export functions
module.exports = { connectDB, initDB };