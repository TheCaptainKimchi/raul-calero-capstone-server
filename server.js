const express = require("express");
const app = express();
const cors = require("cors");
const env = require("dotenv").config({ path: __dirname + "/.env" });

// Import the routes from the routes/valorant.js file
const valorantRoutes = require("./routes/valorant");

// Enable cors
app.use(cors());
// Serve static assets from server
app.use(express.static("public"));

// Route using default route to valorant.js
app.use("/", valorantRoutes);

const port = process.env.PORT ?? 8080;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
