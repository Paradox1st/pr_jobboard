"use strict";

// import modules
const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const { connectDB, initDB }  = require("./config/db");

// load env config
dotenv.config({ path: "./config/config.env" });

// initialize express app
const app = express();

// connect to database
connectDB();

// configure port
const PORT = process.env.PORT || 5000;

// start listening
app.listen(
  PORT,
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on http://localhost:${PORT}`
  )
);