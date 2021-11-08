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

// Get all polls
app.get("/polls", (req, res) => {
  db.query("SELECT id, question, poll_count  FROM polls;", (err, result) => {
    if (err) {
      console.log(err);
    }
    const data = result.rows;
    res.json(data);
  });
});

// Get a specific poll with id
app.get("/poll/:id", (req, res) => {
  const pollId = req.params.id;

  db.query("SELECT * FROM polls WHERE id = $1;", [pollId], (err, result) => {
    if (err) {
      console.log(err);
    }
    const data = result.rows;

    res.json(data);
  });
});

app.get("/poll/:id/results", (req, res) => {
  const pollId = req.params.id;

  db.query(
    `SELECT poll_count, options_weight  FROM polls WHERE id = ${pollId};`,
    (err, result) => {
      if (err) {
        console.log(err);
      }
      const data = result.rows;
      res.json(data);
    }
  );
});

// when an answer is submitted
app.post("/poll/:id/submit", (req, res) => {
  const pollId = req.params.id;
  const submissionInfo = req.body;
  const choiceIndex = submissionInfo.choice;
  let resultOfSubmission = {
    success: false,
  };

  submissionInfo.pollCount += 1;

  const newOptionsWeight = JSON.stringify(
    submissionInfo.optionsWeight.map((option, index) => {
      if (index === choiceIndex) return option + 1;
      else return option;
    })
  );

  db.query(
    `UPDATE polls SET poll_count=${submissionInfo.pollCount}, options_weight=${newOptionsWeight}  WHERE id = ${pollId};`,
    (err, result) => {
      if (err) {
        console.log(err);
      }

      if (result?.rowCount) {
        resultOfSubmission.success = true;
      }

      res.json(resultOfSubmission);
    }
  );
});

app.post("/poll/create", (req, res) => {
  const question = req.body.question;
  const options = JSON.stringify(req.body.options);

  const optionsWeight = JSON.stringify(
    req.body.options.map((option) => {
      console.log(option);
      return 0;
    })
  );

  console.log(optionsWeight);

  let pollCreated = {
    success: false,
  };

  db.query(
    `INSERT INTO polls(question, options, poll_count, options_weight)
    VALUES ('${question}', '${options}', 0, '${optionsWeight}');`,
    (err, result) => {
      if (err) {
        console.log(err);
      }
      if (result?.rowCount) {
        pollCreated.success = true;
      }

      res.json(pollCreated);
    }
  );
});

app.listen(process.env.PORT || 4000, () => {
  console.log("Server has started");
});
