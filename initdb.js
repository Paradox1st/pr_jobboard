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

async function initialize(callback) {
  // clear documents in each collection
  let jobboards = db.collection('jobboards');
  let opportunities = db.collection('opportunities');
  await jobboards.deleteMany({});
  await opportunities.deleteMany({});
  console.log("Collections cleared");

  // further callback functions
  callback();
}

async function initJobBoard(jsonfile, callback) {
  // read file specified by path
  const file = fs.readFileSync(path.resolve(jsonfile), 'utf8');

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
        let domains = {}
        documents.forEach(jobboard => {
          domains[jobboard.root_domain] = jobboard.name
        });
        // further callback functions
        callback(domains);
      });
    }
  });
}

async function initOpportunity(csvfile, domains, callback) {
  // regular expression to extract root domains
  var regexp = /(\b\w+\.\w+)\//;

  // list to hold oppotunity listing
  var documents = [];

  // read csv file
  fs.createReadStream(csvfile)
    .pipe(csv({
      mapHeaders: ({ header }) => {
        // change headers to be shorter
        let headers = {
          "ID (primary key)": "id",
          "Job Title": "title",
          "Company Name": "company",
          "Job URL": "url"
        }
        return headers[header] || header;
      }
    }))
    .on('data', (row) => {
      // format (no newlines)
      row.title = row.title.replace(/[\r\n]/g, " ").trim();
      row.company = row.company.replace(/[\r\n]/g, " ").trim();
      // check for source
      if (row.url && regexp.test(row.url) && regexp.exec(row.url)[1] in domains) {
        // url from jobboard website
        let root_domain = regexp.exec(row.url)[1];
        row.source = domains[root_domain];
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

        // further callback functions
        callback();
      });
    });
}

async function writeJSON() {
  // for each jobsource, count opportunities
  let sources = {};
  // jobs associated with job boards
  let jobboards = await db.collection('jobboards').find({}, { sort: { name: 1 } }).toArray();
  let opportunities = db.collection('opportunities');
  await jobboards.forEach(async jobboard => {
    let count = await opportunities.find({ source: jobboard.name }).count();
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
  return new Promise((resolve, reject) => {
    fs.writeFile("./raw/result.json", data, 'utf8', (err) => {
      if (err) {
        console.log(`Error writing JSON file: ${err}`);
        reject(err)
      } else {
        console.log(`Output JSON file written successfully`);
        resolve();
      }
    });
  });
}

async function writeCSV() {
  // find all opportunities
  let opportunities = await db.collection('opportunities').find({}, { sort: { id: 1 } }).toArray();
  // write into string
  const header = ["ID (primary key),Job Title,Company Name,Job URL,Job Source"];
  const rows = opportunities.map((op) => {
    if (op.company.includes(",") || op.company == "") {
      op.company = '"' + op.company + '"';
    }
    if (op.url.includes(",") || op.url == "") {
      op.url = '"' + op.url + '"';
    }
    return `${op.id},"${op.title}",${op.company},${op.url},${op.source}`;
  });
  const data = header.concat(rows).join("\n");
  // write data into csv file
  return new Promise((resolve, reject) => {
    fs.writeFile("./raw/results.csv", data.toString(), 'utf8', (err) => {
      if (err) {
        console.log(`Error writing CSV file: ${err}`);
        reject(err);
      } else {
        console.log(`Output CSV file written successfully`);
        resolve();
      }
    });
  });
}

// connect and initialize
dbutils.connect(async function (err, client) {
  if (err) console.log(err);
  db = dbutils.getDb();
  initialize(() => {
    initJobBoard(json_file, (domains) => {
      initOpportunity(csv_file, domains, () => {
        // write to output files asynchronously
        Promise.all([writeCSV(), writeJSON()])
          .then(() => {
            // close connection
            client.close();
            process.exit(0);
          });
      })
    })
  });
});