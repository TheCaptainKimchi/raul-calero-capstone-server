const express = require("express");
const router = express.Router();
const fs = require("fs");
const axios = require("axios");
const env = require("dotenv").config({ path: __dirname + "/../.env" });
const { isDataExists } = require("../utils/utils");
const path = require("path");

const apiKey = process.env.API_KEY;
const cache = {};

router.route("/").get((req, res) => {
  console.log(apiKey);
  res.send(
    "Welcome to the SparkGG API! To get started, you can send a GET request to /match and /leaderboard."
  );
});

router.route("/puuid").get((req, res) => {
  const userName = req.query.userName;
  const tagline = req.query.tagline;
  console.log(userName);
  console.log(tagline);

  axios
    .get(
      `https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${userName}/${tagline}?api_key=${apiKey}`
    )
    .then((response) => {
      const json = JSON.stringify(response.data);
      res.send(json);
    });
});

router.route("/matchId").get((req, res) => {
  const puuid = req.query.puuid;
  console.log(puuid);

  axios
    .get(
      `https://na.api.riotgames.com/val/match/v1/matchlists/by-puuid/${puuid}?api_key=${apiKey}`
    )
    .then((response) => {
      const json = JSON.stringify(response.data);
      const matchId = response.data.history;
      res.send(matchId);
    });
});

router.route("/match").get((req, res) => {
  const matchId = req.query.matchId;
  console.log(matchId);

  axios
    .get(
      `https://na.api.riotgames.com/val/match/v1/matches/${matchId}?api_key=${apiKey}`
    )
    .then((response) => {
      const json = JSON.stringify(response.data);
      res.send(json);
    });
});

router.route("/leaderboard").post((req, res) => {
  const filePath = path.join(__dirname, "..", "data", "leaderboard.json");
  const obj = {
    id: req.query.id,
    userName: req.query.userName,
    tagline: req.query.tagline,
    puuid: req.query.puuid,
    kills: req.query.kills,
    deaths: req.query.deaths,
    assists: req.query.assists,
    kda: req.query.kda,
    acs: req.query.acs,
    map: req.query.map,
    agent: req.query.agent,
    mode: req.query.mode,
  };

  try {
    // Read the existing data from the JSON file (if any)
    let existingData = [];
    if (fs.existsSync(filePath)) {
      const dataString = fs.readFileSync(filePath, "utf8");
      existingData = JSON.parse(dataString);
    }

    // Check if data with the given id already exists
    if (isDataExists(existingData, obj)) {
      return res
        .status(200)
        .json({ Response: "Data already added to database." });
    }

    // Append the received data to the existing data
    existingData.push(obj);

    // Write the updated data back to the JSON file
    fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2), "utf8");

    // Respond with a success message
    res
      .status(200)
      .json({ message: "Data added to the JSON file successfully." });
  } catch (error) {
    console.error("Error processing the request:", error);
    res.status(500).json({ error: "Something went wrong." });
  }
});

router.route("*").get((req, res) => {
  res.send(
    "Path not defined. Try a different path or refer to '/' path to start."
  );
});
module.exports = router;
