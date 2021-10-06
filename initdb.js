"use strict";

// import modules
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const dbutils = require("./utils/db");

// file names
const csv_file = "./raw/job_opportunities.csv";
const json_file = "./raw/jobBoards.json";

// db connection
var db;

async function initialize() {
  // clear documents in each collection
  let jobboards = db.collection('jobboards');
  let opportunities = db.collection('opportunities');
  await jobboards.deleteMany({});
  await opportunities.deleteMany({});
  console.log("Collections cleared");

  // initialize collections
  initJobBoard();
}

async function initJobBoard() {
  // read file specified by path
  const file = fs.readFileSync(path.resolve(json_file), 'utf8');

  // add jobboards from json file
  var data = JSON.parse(file).job_boards;

  // add each jobboard into database
  let collection = db.collection('jobboards');
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
        initOpportunity(ids);
      });
    }
  });
}

async function initOpportunity(domains) {
  // regular expression to extract root domains
  var regexp = /(\b\w+\.\w+)\//;

  // list to hold oppotunity listing
  var documents = [];

  // read csv file
  fs.createReadStream(csv_file)
    .pipe(csv({
      mapHeaders: ({ header }) => {
        // change headers to be shorter
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
      var collection = db.collection('opportunities');
      collection.insertMany(documents, (err, result) => {
        if (err) console.log(err);
        if (result) console.log("Import CSV into database successful.");
        // close db connection when done
        dbutils.close();
      });
    });
}

// connect and initialize
dbutils.connect( function( err, client ) {
  if (err) console.log(err);
  db = dbutils.getDb();
  initialize();
} );