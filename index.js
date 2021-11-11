const express = require("express");
const app = express();
const cors = require("cors");
const session = require("express-session");
require("dotenv").config();

const { Pool } = require("pg");
const db = new Pool({
  connectionString: process.env.DB_URI,
  ssl: {
    rejectUnauthorized: false,
  },
});

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://rickywid.github.io/voting-app-frontend",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(
  session({
    secret: "somesecretsessionkey",
    resave: false,
    saveUninitialized: false,
    cookie: {
      // sameSite: 'none'
    },
  })
);

/****************************************/
/*              ROUTES                  */
/****************************************/

// Get all polls
app.get("/polls", (req, res) => {
  db.query("SELECT id, question, total_count  FROM polls;", (err, result) => {
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
    `SELECT total_count, options_weight  FROM polls WHERE id = ${pollId};`,
    (err, result) => {
      if (err) {
        console.log(err);
      }
      const data = result.rows;
      res.json(data);
    }
  );
});

//Check to see if the user voted
app.get("/poll/:id/voted", (req, res) => {
  const userId = req.body.userId;
  const pollId = req.params.id;

  let userAlreadyVoted = {
    success: false,
  };

  db.query(
    `SELECT * FROM users_polls
    WHERE "userId" = ${userId} AND "pollId" = ${pollId}`,
    (err, result) => {
      if (err) {
        console.log(err);
      }
      const data = result.rows;

      if (data.length > 0) {
        userAlreadyVoted.success = true;
        userAlreadyVoted.message = "user already voted on this poll";
      } else {
        userAlreadyVoted.message = "user has not voted on this poll";
      }

      res.json(userAlreadyVoted);
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

  console.log('OPTIONSWEIGHT: ', JSON.parse(submissionInfo.optionsWeight))
  const results = JSON.parse(submissionInfo.optionsWeight).map((option, index) => {
    if (index === choiceIndex) return option + 1;
    else return option;
  });

  const newOptionsWeight = results;
  console.log('************************************')
  console.log('newOptionsWeight:', newOptionsWeight)
  console.log('************************************')
  
  db.query(
    `UPDATE polls SET total_count=${submissionInfo.pollCount}, options_weight=${newOptionsWeight}  WHERE id = ${pollId};`,
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

//When an answer is submitted we also need to submit which user made that answer
app.post("/poll/:id/submit-user", (req, res) => {
  const pollId = req.params.id;
  const userId = req.body.userId;

  const votesStored = {
    success: false,
  };

  db.query(
    `INSERT INTO users_polls("userId", "pollId") VALUES (${userId}, ${pollId} );`,
    (err, result) => {
      if (err) {
        console.log(err);
      }
      if (result?.rowCount) {
        votesStored.success = true;
      }

      res.json(votesStored);
    }
  );
});

// Create a new poll
app.post("/poll/create", (req, res) => {
  const question = req.body.question;
  const options = JSON.stringify(req.body.options);

  const optionsWeight = JSON.stringify(
    req.body.options.map((option) => {
      console.log(option);
      return 0;
    })
  );

  let pollCreated = {
    success: false,
  };

  db.query(
    `INSERT INTO polls(question, options, total_count, options_weight)
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

// LOGIN
app.post("/login", (req, res) => {
  const loginCredentials = req.body;

  let loginResult = {
    success: false,
  };

  db.query(
    `SELECT * FROM users WHERE username = '${loginCredentials.username}' AND password = '${loginCredentials.password}' ;`,
    (err, result) => {
      if (err) {
        console.log("err", err);
      }

      const data = result.rows;

      if (data.length > 0) {
        loginResult.success = true;
        loginResult.userId = data[0].id;
        loginResult.username = data[0].username;
        req.session.user = data[0].username;
        req.session.userId = data[0].id;
        req.session.save();
        console.log("**************************************");
        console.log("USER SESSION: ", req.session);
        console.log("**************************************");

        res.json(loginResult);
      } else {
        res.json({ success: false });
      }
    }
  );
});

//REGISTER
app.post("/signup", (req, res) => {
  const signupCredentials = req.body;

  console.log(signupCredentials);

  let signupResult = {
    success: false,
  };

  db.query(
    `INSERT INTO users(username, password)
SELECT '${signupCredentials.username}', '${signupCredentials.password}'
WHERE
NOT EXISTS (
      SELECT username FROM users WHERE username = '${signupCredentials.username}'
  );`,
    (err, result) => {
      if (err) {
        console.log("err", err);
      }

      const data = result.rowCount;

      if (data > 0) {
        signupResult.success = true;
      } else {
        signupResult.message = "user already exists";
      }

      res.json(signupResult);
    }
  );
});

app.post("/signout", (req, res) => {
  req.session.destroy();
  console.log("USER SESSION: ", req.session);
  res.status(200).json({ message: "success" });
});

// Check user auth
app.get("/auth", (req, res) => {
  console.log("USER SESSION: ", req.session);

  if (req.session.user) {
    res.status(200).json({
      user: req.session.user,
      userId: req.session.userId
    });
  } else {
    res.status(200).json({ user: null });
  }
});

var server = app.listen(process.env.PORT || 3001, function () {
  console.log("Listening on port " + server.address().port);
});
