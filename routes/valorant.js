const express = require("express");
const router = express.Router();
const fs = require("fs");
const axios = require("axios");
const env = require("dotenv").config({ path: __dirname + "/../.env" });

const apiKey = process.env.API_KEY;

router.route("/").get((req, res) => {
  console.log(apiKey);
  res.send(
    "Welcome to the SparkGG API! To get started, you can send a GET request to /match and /leaderboard."
  );
});

router.route("/puuid").get((req, res) => {
  const userName = req.query.userName;
  const tagline = req.query.tagline;

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

  axios
    .get(
      `https://na.api.riotgames.com/val/match/v1/matches/${matchId}?api_key=${apiKey}`
    )
    .then((response) => {
      const json = JSON.stringify(response.data);
      res.send(json);
    });
});

router.route("/leaderboard").get((req, res) => {
  res.send("Test2");
});

router.route("*").get((req, res) => {
  res.send(
    "Path not defined. Try a different path or refer to '/' path to start."
  );
});
module.exports = router;
