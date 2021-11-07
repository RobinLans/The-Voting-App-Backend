const express = require("express");
const app = express();
const cors = require("cors");

app.use(cors());
app.use(express.json());

app.listen(process.env.PORT || 4000, () => {
  console.log("Server has started");
});
