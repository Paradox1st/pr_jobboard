"use strict";

// import modules
const express = require("express");
const dotenv = require("dotenv");
const { initialize }  = require("./config/db");

// load env config
dotenv.config({ path: "./config/config.env" });

// initialize express app
const app = express();

// connect to database
initialize();

// configure port
const PORT = process.env.PORT || 5000;

// start listening
app.listen(
  PORT,
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on http://localhost:${PORT}`
  )
);