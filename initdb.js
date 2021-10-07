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

async function initCollection(data, colname) {
  // add each jobboard into database
  let collection = db.collection(colname);
  return collection.insertMany(data);
}

function mapDomains(jobboard_data) {
  var domains = {}

  // dictionary where
  // key: root_domain
  // value: job board name
  for (let i = 0; i < jobboard_data.length; i++) {
    domains[jobboard_data[i].root_domain] = jobboard_data[i].name;
  }

  return domains;
}

function findSource(domains, opportunities) {
  // regular expression to extract root domains
  var regexp = /(\b\w+\.\w+)\//;

  for (let i = 0; i < opportunities.length; i++) {
    let op = opportunities[i];
    // check for source
    if (op.url && regexp.test(op.url) && regexp.exec(op.url)[1] in domains) {
      // url from jobboard website
      let root_domain = regexp.exec(op.url)[1];
      op.source = domains[root_domain];
    } else if (op.url.includes(op.company.toLowerCase())) {
      // url from company website
      op.source = 'Company Website';
    } else {
      op.source = 'Unknown';
    }
  }

  return opportunities;
}

async function readJSON(jsonfilepath) {
  // read file specified by path
  const file = fs.readFileSync(path.resolve(jsonfilepath), 'utf8');

  // add jobboards from json file
  return JSON.parse(file).job_boards;
}

async function readCSV(csvfilepath) {
  // list to hold oppotunity listing
  var rows = [];

  // read csv file
  return new Promise((resolve, reject) => {
    fs.createReadStream(csvfilepath)
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
      // add document to list
      rows.push(row);
    })
    .on('end', () => {
      resolve(rows);
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
  initialize(async () => {
    // read data
    let jobboard_data = await readJSON(json_file);
    let opportunity_data = await readCSV(csv_file);
    let domains = mapDomains(jobboard_data);

    // find source
    opportunity_data = findSource(domains, opportunity_data);

    // initialize collections
    Promise.all([initCollection(jobboard_data, 'jobboards'), initCollection(opportunity_data, 'opportunities')])
      .then(() => {
        console.log("Collections initialized successfully");
        Promise.all([writeCSV(), writeJSON()])
          .then(() => {
            dbutils.close();
            process.exit(0);
          })
      })
  });
});

// export functions (for unit testing)
module.exports = { readJSON, readCSV, mapDomains, findSource }