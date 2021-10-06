"use strict";

// import modules
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const mongodb = require("mongodb");
const csv = require("csv-parser");

// load env config
dotenv.config({ path: "./config/config.env" });

// file names
const csv_file = "./raw/job_opportunities.csv";
const json_file = "./raw/jobBoards.json";

async function initialize() {
  // start database connection
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

  // clear documents in each collection
  let jobboards = dbConn.collection('jobboards');
  let opportunities = dbConn.collection('opportunities');
  await jobboards.deleteMany({});
  await opportunities.deleteMany({});
  console.log("Collections cleared");

  // initialize collections
  initJobBoard(mongoClient, dbConn);
}

async function initJobBoard(client, dbConn) {
  // read file specified by path
  const file = fs.readFileSync(path.resolve(json_file), 'utf8');

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
        initOpportunity(client, dbConn, ids);
      });
    }
  });
}

async function initOpportunity(client, dbConn, domains) {
  // regular expression to extract root domains
  var regexp = /(\b\w+\.\w+)\//;

  // list to hold oppotunity listing
  var documents = [];

  fs.createReadStream(csv_file)
    .pipe(csv({
      mapHeaders: ({ header }) => {
        let headers = {
          "ID (primary key)": "id",
          "Job Title": "title",
          "Company Name": "company",
          "Job URL": "url"
        }
        return headers[header];
      }
    }))
    .on('data', (row) => {
      // check for source
      if (row.url && regexp.test(row.url) && regexp.exec(row.url)[1] in domains) {
        // url from jobboard website
        let root_domain = regexp.exec(row.url)[1];
        row.source = 'Job Board';
        row.jobboard = domains[root_domain];
      } else if (row.url.includes(row.company.toLowerCase())) {
        // url from company website
        row.source = 'Company Website';
      } else {
        row.source = 'Unknown';
      }
      // add document to list
      documents.push(row);
    })
    .on('end', () => {
      // add all opportunities to database
      var collection = dbConn.collection('opportunities');
      collection.insertMany(documents, (err, result) => {
        if (err) console.log(err);
        if (result) console.log("Import CSV into database successful.");
        client.close();
      });
    });
}

// run functions
initialize();