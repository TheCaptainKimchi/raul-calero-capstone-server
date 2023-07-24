const express = require("express");
const app = express();
const cors = require("cors");
const env = require("dotenv").config({ path: __dirname + "/.env" });

app.use(cors());
app.use(express.static("public"));

app.use("/");

const port = process.env.PORT ?? 8080;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
