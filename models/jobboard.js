"use strict";

// import modules
const mongoose = require("mongoose");

// declare schema
const JobBoardSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rating: { type: String, required: true },
  root_domain: { type: String, required: true },
  logo_file: String,
  description: String,
  opportunities: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Opportunity",
  }],
});

// export JobBoardSchema
module.exports = mongoose.model("JobBoard", JobBoardSchema);