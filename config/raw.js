"use strict";

// import modules
const path = require("path");
const fs = require("fs");

function readJSON(jsonpath) {
  try {
    // read file specified by path
    const data = fs.readFileSync(path.resolve(jsonpath), 'utf8');

    // parse JSON string to JSON object
    return JSON.parse(data).job_boards;
  } catch (err) {
    console.log(`Error reading file from disk: ${err}`);
  }
}

function readCSV(csvpath) {
  try {
    // read csv file specified by path
    
  } catch (err) {
    console.log(`Error reading file from disk: ${err}`);
  }
}

module.exports = { readJSON, readCSV };