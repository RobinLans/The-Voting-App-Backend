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

app.get("/get-polls", (req, res) => {
  db.query("SELECT * FROM polls;", (err, result) => {
    if (err) {
      console.log(err);
    }
    const data = JSON.stringify(result.rows);
    console.log(data[0]);
    res.json(JSON.parse(data));
  });
});

app.get("/get-poll/:id", (req, res) => {
  const pollId = req.params.id;

  db.query(
    "SELECT * FROM public.polls WHERE id = $1;",
    [pollId],
    (err, result) => {
      if (err) {
        console.log(err);
      }
      const data = JSON.stringify(result.rows);

      res.json(JSON.parse(data));
    }
  );
});

app.listen(process.env.PORT || 4000, () => {
  console.log("Server has started");
});

// let poll = {
//   id: 1,
//   question: "What is the best framework?",
//   options: ["React", "Svelte", "Vue", "Angular"],
//   pollCount: 20,
//   optionsWeight: [10, 2, 4, 4],
// };

// let user = {
//   id: 1,
//   username: "blabla",
//   password: "pwd123",
//   answers: [
//     {
//       pollId: 1,
//       pollAnswer: 2,
//     },
//     {
//       pollId: 2,
//       pollAnswer: 4,
//     },
//   ],
// };
