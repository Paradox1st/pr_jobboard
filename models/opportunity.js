"use strict";

// import modules
const mongoose = require("mongoose");

// declare schema
const OpportunitySchema = new mongoose.Schema({
  id: { type: Number, required: true },
  title: { type: String, required: true },
  company: String,
  url: String,
  jobboard: { type: mongoose.Schema.Types.ObjectId, ref: "JobBoard" },
});

// export OpportunitySchema
module.exports = mongoose.model("Opportunity", OpportunitySchema);