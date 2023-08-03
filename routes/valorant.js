// Imports
const express = require("express");
const router = express.Router();
const fs = require("fs");
const axios = require("axios");
const { isDataExists } = require("../utils/utils");
const path = require("path");
const jwt = require("jsonwebtoken");
const knex = require("knex")(require("../knexfile.js"));

// Paths and API Key
const apiKey = process.env.API_KEY;
const filePath = path.join(__dirname, "..", "data", "leaderboard.json");
const usersPath = path.join(__dirname, "..", "data", "users.json");

// ==========================
// ====== Default path ======
// ==========================

// Default path to explain API
router.route("/").get((req, res) => {
  res.sendFile(path.join(__dirname, "..", "index.html"));
});

// ==========================
// ======= PUUID path =======
// ==========================

// Get PUUID from Riot API using riotID and tagline
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
    })
    .catch((error) => {
      res.status(404);
      res.json(`Error: ${error}`);
    });
});

// ==========================
// ====== MatchId path ======
// ==========================

// Get List of matchIds by using player PUUID
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
    })
    .catch((error) => {
      res.status(404);
      res.json(`Error: ${error}`);
    });
});

// ==========================
// ======= Match path =======
// ==========================

// Get match details using matchId
router.route("/match").get((req, res) => {
  const matchId = req.query.matchId;

  axios
    .get(
      `https://na.api.riotgames.com/val/match/v1/matches/${matchId}?api_key=${apiKey}`
    )
    .then((response) => {
      const json = JSON.stringify(response.data);
      res.send(json);
    })
    .catch((error) => {
      res.status(404);
      res.json(`Error: ${error}`);
    });
});

// ================================
// ======= Leaderboard path =======
// ================================

router
  .route("/leaderboard")

  // Post match data related to user in to server database
  .post((req, res) => {
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
      matchOutcome: req.query.matchOutcome,
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
      res.status(400).json({ error: "Something went wrong." });
    }
  })

  // Get leaderboard database pulling top kills, deaths, assists, and best KDA
  .get((req, res) => {
    knex("leaderboard")
      .then((leaderboard) => {
        // Create an object to store total kills, deaths, and assists for each puuid
        const statsByPuuid = {};

        // Calculate total kills, deaths, and assists for each puuid
        leaderboard.forEach((currentData) => {
          const puuid = currentData.puuid;
          const name = currentData.username;
          const kills = parseInt(currentData.kills);
          const deaths = parseInt(currentData.deaths);
          const assists = parseInt(currentData.assists);
          const kda = parseInt(currentData.kda);
          const acs = parseInt(currentData.acs);
          const counter = 0;

          if (!statsByPuuid[puuid]) {
            // If puuid is not in 'statsByPuuid', initialize it with kills, deaths, and assists
            statsByPuuid[puuid] = {
              name: name,
              kills: kills,
              deaths: deaths,
              assists: assists,
              kda: kda,
              acs: acs,
              counter: counter,
            };
          } else {
            // If puuid is already in 'statsByPuuid', update kills, deaths, and assists
            statsByPuuid[puuid].kills += kills;
            statsByPuuid[puuid].deaths += deaths;
            statsByPuuid[puuid].assists += assists;
            statsByPuuid[puuid].kda += kda;
            statsByPuuid[puuid].acs += acs;
            statsByPuuid[puuid].counter += 1;
          }
        });

        // Find the puuid with the highest total kills, deaths, and assists
        let highestKillsPuuid = null;
        let highestKills = -1;
        let highestDeathsPuuid = null;
        let highestDeaths = -1;
        let highestAssistsPuuid = null;
        let highestAssists = -1;

        Object.entries(statsByPuuid).forEach(
          ([puuid, { kills, deaths, assists }]) => {
            if (kills > highestKills) {
              highestKills = kills;
              highestKillsPuuid = puuid;
            }

            if (deaths > highestDeaths) {
              highestDeaths = deaths;
              highestDeathsPuuid = puuid;
            }

            if (assists > highestAssists) {
              highestAssists = assists;
              highestAssistsPuuid = puuid;
            }
          }
        );

        console.log("Puuid with the highest kills:", highestKillsPuuid);
        console.log("Total kills:", highestKills);
        console.log("Puuid with the highest deaths:", highestDeathsPuuid);
        console.log("Total deaths:", highestDeaths);
        console.log("Puuid with the highest assists:", highestAssistsPuuid);
        console.log("Total assists:", highestAssists);

        // Combine the results into one object
        const result = {
          highestKills: {
            puuid: highestKillsPuuid,
            kills: highestKills,
            name: statsByPuuid[highestKillsPuuid].name,
          },
          highestDeaths: {
            puuid: highestDeathsPuuid,
            deaths: highestDeaths,
            name: statsByPuuid[highestDeathsPuuid].name,
          },
          highestAssists: {
            puuid: highestAssistsPuuid,
            assists: highestAssists,
            name: statsByPuuid[highestAssistsPuuid].name,
          },
        };

        console.log("Combined Result:", result);

        res.json(result);
      })
      .catch((error) => {
        console.error(error);
        res
          .status(500)
          .json({ error: "An error occurred while processing the request." });
      });
  });

// Get leaderboard data for specific user by PUUID
router.route("/leaderboard/:puuid").get((req, res) => {
  const puuid = req.params.puuid;

  // Read the leaderboard.json file
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      return res.status(500).json({ error: "Internal server error" });
    }

    try {
      // Parse the JSON data
      const leaderboardData = JSON.parse(data);

      // Filter the data for the given user's puuid
      const userData = leaderboardData.filter((user) => user.puuid === puuid);

      // Check if the user was found
      if (userData.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      // If found, send the data back
      return res.json(userData);
    } catch (parseError) {
      console.error("Error parsing JSON:", parseError);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
});

// ==========================
// ======= Users path =======
// ==========================

// Allow users to sign in, and get a JWT token
router.route("/login").post((req, res) => {
  const { username, password } = req.query;

  fs.readFile(usersPath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading the users.json file:", err);
      return res.status(500).json({ error: "Server error" });
    }

    try {
      // Parse the JSON data into an array of objects
      const usersData = JSON.parse(data);

      // Find the user with the matching username
      const foundUser = usersData.find((user) => user.username === username);

      if (!foundUser) {
        // User does not exist, return error response
        return res.status(404).json({ error: "User not found" });
      }

      // Validate the supplied password matches the password in the DB
      if (password !== foundUser.password) {
        return res.status(400).json({
          success: false,
          error: "Username/Password combination is incorrect",
        });
      }

      // User exists and password is correct, return success response
      const token = jwt.sign(
        {
          username: username,
          puuid: foundUser.puuid,
          riotId: foundUser.riotId,
          tagline: foundUser.tagline,
          matchOutcome: foundUser.matchOutcome,
          loginTime: Date.now(),
        },
        process.env.JWT_SECRET,
        { expiresIn: "1440m" }
      );

      // Send the JWT token to the frontend
      return res.status(200).json({ token });
    } catch (error) {
      console.error("Error parsing JSON data:", error);
      return res.status(500).json({ error: "Server error" });
    }
  });
});

// Route to handle user registration
router.route("/register").post((req, res) => {
  // Get the user submitted details from the request body
  const { username, password, riotId, tagline, email, puuid } = req.query;

  // Read the existing users data from the file
  fs.readFile(usersPath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading the users.json file:", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }

    try {
      // Parse the JSON data into an array of objects
      const usersData = JSON.parse(data);

      // Check if the user already exists in the users data
      const userExists = usersData.some((user) => user.username === username);
      if (userExists) {
        return res
          .status(400)
          .json({ success: false, message: "User already exists" });
      }

      // Add the new user to the users data
      usersData.push({ username, password, riotId, tagline, email, puuid });

      // Write the updated data back to the users.json file
      fs.writeFile(usersPath, JSON.stringify(usersData), (err) => {
        if (err) {
          console.error("Error writing to the users.json file:", err);
          return res
            .status(500)
            .json({ success: false, message: "Server error" });
        }

        return res.status(201).json({ success: true, message: "User created" });
      });
    } catch (error) {
      console.error("Error parsing JSON data:", error);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  });
});

// Middleware which checks the authorization token
const authorise = (req, res, next) => {
  // Check if the authorization header wasn't set
  if (!req.headers.authorization) {
    return res.status(401).json({
      success: false,
      message: "This route requires an authorization header",
    });
  }

  // Check if the authorization token is missing "Bearer "
  if (req.headers.authorization.indexOf("Bearer") === -1) {
    return res
      .status(401)
      .json({ success: false, message: "The authorization token is invalid!" });
  }

  // Get the token itself for the authorization header (without "Bearer ")
  const authToken = req.headers.authorization.split(" ")[1];

  jwt.verify(authToken, process.env.JWT_SECRET, (err, decoded) => {
    // Check if there was an error when verifying the JWT token
    if (err) {
      return res.status(401).json({
        success: false,
        message: "The authorization token is invalid",
      });
    }

    // Set the decoded token on the request object, for the endpoint to use
    req.jwtDecoded = decoded;

    // Move on to the next middleware function
    next();
  });
};

// Send decoded token data back
router.route("/profile").get(authorise, (req, res) => {
  res.json({
    token: req.jwtDecoded,
  });
});

// ==============================
// ======= Catch All path =======
// ==============================
router.route("*").get((req, res) => {
  res.send(
    "Path not defined. Try a different path or refer to '/' path to start."
  );
});
module.exports = router;
