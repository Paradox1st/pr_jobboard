"use strict";

// import modules
const fs = require("fs");
const path = require("path");
const mongodb = require("mongodb");
const csvtojson = require("csvtojson");

// file names
const csv = "./raw/job_opportunities.csv";
const json = "./raw/jobBoards.json";

async function initialize() {
  // start database connection
  var dbConn;
  await mongodb.MongoClient.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }).then((client) => {
    console.log('DB connected');
    dbConn = client.db("JobBoard");
  }).catch((err) => {
    console.error(err);
  });

  // clear documents in each collection
  let jobboards = dbConn.collection('jobboards');
  let opportunities = dbConn.collection('opportunities');
  await jobboards.deleteMany({});
  await opportunities.deleteMany({});
  console.log("Collections cleared");

  // initialize collections
  initJobBoard(dbConn);
}

async function initJobBoard(dbConn) {
  // read file specified by path
  const file = fs.readFileSync(path.resolve(json), 'utf8');

  // add jobboards from json file
  var data = JSON.parse(file).job_boards;

  // add each jobboard into database
  let collection = dbConn.collection('jobboards');
  collection.insertMany(data, (err, result) => {
    if (err) {
      console.log(err)
    };
    if (result) {
      console.log("Import JSON into database successful.");
      // once database is updated, find ids of jobboards
      collection.find({}).toArray((err, documents) => {
        // match ids to root domains
        let ids = {}
        documents.forEach(jobboard => {
          ids[jobboard.root_domain] = jobboard._id;
        });
        // opportunities can now refer to jobboards
        initOpportunity(dbConn, ids);
      });
    }
  });
}

async function initOpportunity(dbConn, domains) {
  // regular expression to extract root domains
  var regexp = /(\b\w+\.\w+)\//;

  // list to hold oppotunity listing
  var documents = [];
  csvtojson().fromFile(csv).then(source => {
    // Fetching the all data from each row
    for (var i = 0; i < source.length; i++) {
      // build opportunity document
      var op = {
        id: source[i]["ID (primary key)"],
        title: source[i]["Job Title"],
        company: source[i]["Company Name"],
        url: source[i]["Job URL"]
      };

      // check for source
      if (op.url && regexp.test(op.url) && regexp.exec(op.url)[1] in domains) {
        // url from jobboard website
        let root_domain = regexp.exec(op.url)[1];
        op.source = 'Job Board';
        op.jobboard = domains[root_domain];
      } else if (op.url.includes(op.company.toLowerCase())) {
        // url from company website
        op.source = 'Company Website';
      } else {
        op.source = 'Unknown';
      }

      // add document to list
      documents.push(op);
    }

    // add all opportunities to database
    var collection = dbConn.collection('opportunities');
    collection.insertMany(documents, (err, result) => {
      if (err) console.log(err);
      if (result) console.log("Import CSV into database successful.");
    });
  });
}

// export functions
module.exports = { initialize };