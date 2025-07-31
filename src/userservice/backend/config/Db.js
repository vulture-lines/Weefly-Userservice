// Database Configuration
const db = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();
async function connectDB() {
  try {
    if (process.env.NODE_ENV === "production") {
      await db.connect(process.env.PRODDBURL);
      console.log("Connected to production database");
    } else {
      await db.connect(process.env.TESTDBURL);
      console.log("Connected to dev database");
    }
  } catch (err) {
    console.log("Database connection error:", err);
  }
}
module.exports = connectDB;
