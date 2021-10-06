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
    if (err) console.log(err);
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
      // format (no newlines)
      row.title = row.title.replace(/[\r\n]/g,"");
      row.company = row.company.replace(/[\r\n]/g,"");
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
      collection.insertMany(documents, async (err, result) => {
        if (err) console.log(err);
        if (result) console.log("Import CSV into database successful.");

        // write output files
        writeJSON();
      });
    });
}

async function writeJSON() {
  // for each jobsource, count opportunities
  let sources = {};
  // jobs associated with job boards
  let jobboards = await db.collection('jobboards').find({});
  let opportunities = db.collection('opportunities');
  await jobboards.forEach(async jobboard => {
    let count = await opportunities.find({ jobboard: jobboard._id }).count();
    sources[jobboard.name] = count;
  });
  // job associated with company websites
  let company_opportunities = await opportunities.find({ source: "Company Website" }).count();
  sources["Company Website"] = company_opportunities;
  // jobs with unknown sources
  let unknown_opportunities = await opportunities.find({ source: "Unknown" }).count();
  sources["Unknown"] = unknown_opportunities;

  // write to json file
  let data = JSON.stringify(sources, null, 4);
  fs.writeFile("./raw/result.json", data, 'utf8', (err) => {
    if (err) {
      console.log(`Error writing JSON file: ${err}`);
    } else {
      console.log(`Output JSON file written successfully`);
      
      writeCSV();
    }
  });
}

async function writeCSV() {
  // find all opportunities
  let opportunities = await db.collection('opportunities').find({}, { sort: { id: 1 } }).toArray();
  // write into string
  const header = ["ID (primary key),Job Title,Company Name,Job URL,Job Source"];
  const rows = opportunities.map((op) => {
    if(op.company.includes(",") || op.company == ""){
      op.company = '"'+op.company+'"';
    }
    if(op.url.includes(",") || op.url == ""){
      op.url = '"'+op.url+'"';
    }
    return `${op.id},"${op.title}",${op.company},${op.url},${op.source}`;
  });
  const data = header.concat(rows).join("\n");
  // write data into csv file
  fs.writeFile("./raw/results.csv", data.toString(), (err) => {
    if (err) {
      console.log(`Error writing CSV file: ${err}`);
    } else {
      console.log(`Output CSV file written successfully`);

      // wrap up
      dbutils.close();
      process.exit(0);
    }
  })
}

// connect and initialize
dbutils.connect(async function (err, client) {
  if (err) console.log(err);
  db = dbutils.getDb();
  initialize();
});