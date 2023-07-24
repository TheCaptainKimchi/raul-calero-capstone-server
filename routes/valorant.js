const express = require("express");
const router = express.Router();
const fs = require("fs");

router.route("/").get((req, res) => {
  res.send(
    "Welcome to the API! You may obtain list of videos from GET /videos, upload a video from POST /videos by passing query params `title` and `description`, and you may get the specific video details from GET videos/:videoId"
  );
});

router.route("/match").get((req, res) => {
  res.send("test");
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
