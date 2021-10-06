"use strict";

// import modules
const MongoClient = require('mongodb').MongoClient;
const dotenv = require("dotenv");

// load env config
dotenv.config({ path: "./config/config.env" });

var db;
var conn;

module.exports = {

  connect: async function (callback) {
    MongoClient.connect(
      process.env.MONGO_URI,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true
      },
      (err, client) => {
        conn = client;
        db = client.db('JobBoard');
        return callback(err, client);
      });
  },

  getDb: function () {
    return db;
  },

  close: function () {
    conn.close();
  }
};