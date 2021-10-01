// import modules
import path from "path";
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
// import { connectDB, initDB } from "./config/db";

// initialize express app
const app = express();

// start listening
app.listen(
    3000,
    console.log(
        `Server running on http://localhost:3000`
    )
);