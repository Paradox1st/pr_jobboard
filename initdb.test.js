"use strict"

// import modules
const dbutils = require("./utils/db");
const initdbfunc = require("./initdb");

describe("Source Matching Tests", () => {
  var db;
  // setup
  beforeAll(async ()=>{
    // connect to database
    await dbutils.connect(()=>{
      db = dbutils.getDb;
    });
  })

  // test
  test('adding 1 + 2 should return 3', () => {
    expect(mathOperations.sum(1, 2)).toBe(3);
  });

  // teardown
  afterAll(()=>{
    dbutils.close();
  })
 })