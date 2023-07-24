const express = require("express");
const router = express.Router();
const fs = require("fs");
const axios = require("axios");

router.route("/").get((req, res) => {
  res.send(
    "Welcome to the SparkGG API! To get started, you can send a GET request to /match and /leaderboard."
  );
});

router.route("/puuid").get((req, res) => {
  const userName = req.query.userName;
  const tagline = req.query.tagline;

  axios
    .get(
      `https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/xstarwise/na1?api_key=RGAPI-24ec6a6b-a086-45ef-86c7-decf8a62cde3`
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
