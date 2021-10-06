"use strict";

// import modules
const express = require("express");
const dotenv = require("dotenv");
const exphbs = require("express-handlebars");

// load env config
dotenv.config({ path: "./config/config.env" });

// initialize express app
const app = express();

// handlebars for html templates
let hbs = exphbs.create({         // default layout file
  defaultLayout: "main",
  extname: ".hbs",
});
app.engine(".hbs", hbs.engine);   // handlebars use .hbs extension
app.set("view engine", ".hbs");   // set handlebars for view engine

// routes
app.use("/", require("./routes/index"));
app.use("/jobboard", require("./routes/jobboard"));

// configure port
const PORT = process.env.PORT || 5000;

// start listening
app.listen(
  PORT,
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on http://localhost:${PORT}`
  )
);