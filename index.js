const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();

const { Pool } = require("pg");
const db = new Pool({
  connectionString: process.env.DB_URI,
  ssl: {
    rejectUnauthorized: false,
  },
});

app.use(cors());
app.use(express.json());

app.get("/bajs", (req, res) => {
  db.query("SELECT * FROM test;", (err, result) => {
    if (err) {
      console.log(err);
    }
    const data = JSON.stringify(result.rows);
    res.json(JSON.parse(data));
  });
});

app.listen(process.env.PORT || 4000, () => {
  console.log("Server has started");
});
