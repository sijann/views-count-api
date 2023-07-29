// db.js
const mongoose = require('mongoose');
require("dotenv").config();
const MONGO_URL = process.env.MONGO_URL;

async function connectToDB() {
  try {
    await mongoose.connect(
        MONGO_URL,
        {
            useNewUrlParser: true,
            useUnifiedTopology: true
        }
    );;
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
}

module.exports = connectToDB;
