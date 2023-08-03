// Imports
const express = require("express");
const router = express.Router();
const fs = require("fs");
const axios = require("axios");
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
      matchId: req.query.id,
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

    knex("leaderboard")
      .where({ matchId: obj.matchId }) // Check if the matchId exists
      .then((matches) => {
        if (matches.length > 0) {
          // If there's a match, the data already exists
          return res
            .status(200)
            .json({ Response: "Data already added to database." });
        } else {
          // If there's no match, insert the data into the database
          res.status(201).json("Data inserted successfully!");
          return knex("leaderboard").insert(obj);
        }
      })
      .catch((error) => {
        res.status(400).json("An error occurred while inserting data.");
      });
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

          if (!statsByPuuid[puuid]) {
            // If puuid is not in 'statsByPuuid', initialize it with kills, deaths, and assists
            statsByPuuid[puuid] = {
              name: name,
              kills: kills,
              deaths: deaths,
              assists: assists,
              kda: kda,
              acs: acs,
            };
          } else {
            // If puuid is already in 'statsByPuuid', update kills, deaths, and assists
            statsByPuuid[puuid].kills += kills;
            statsByPuuid[puuid].deaths += deaths;
            statsByPuuid[puuid].assists += assists;
            statsByPuuid[puuid].kda += kda;
            statsByPuuid[puuid].acs += acs;
          }
        });

        // Find the puuid with the highest total kills, deaths, and assists
        let highestKillsPuuid = null;
        let highestKills = 0;
        let highestDeathsPuuid = null;
        let highestDeaths = 0;
        let highestAssistsPuuid = null;
        let highestAssists = 0;
        let highestKda = 0;
        let highestKdaPuuid = null;
        let highestAcs = 0;
        let highestAcsPuuid = null;

        Object.entries(statsByPuuid).forEach(
          ([puuid, { kills, deaths, assists, kda, acs }]) => {
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
            if ((kills + assists) / deaths > highestKda) {
              highestKda = (kills + assists) / deaths;
              highestKdaPuuid = puuid;
            }
            if (acs > highestAcs) {
              highestAcs = acs;
              highestAcsPuuid = puuid;
            }
          }
        );

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
          highestKda: {
            puuid: highestKdaPuuid,
            kda: highestKda,
            name: statsByPuuid[highestKdaPuuid].name,
          },
        };

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

  const playerData = [];

  knex("leaderboard")
    .then((leaderboard) => {
      leaderboard.map((playerMatch) => {
        if (playerMatch.puuid === puuid) {
          return playerData.push(playerMatch);
        }
      });
      res.send(playerData);
    })
    .catch((error) => {
      res.status(400).json("Unable to retrieve player from PUUID");
    });
});

// ==========================
// ======= Users path =======
// ==========================

// Allow users to sign in, and get a JWT token
router.route("/login").post((req, res) => {
  const { username, password } = req.query;

  knex("users").then((users) => {
    console.log(`Password is: ${password}`);
    const foundUser = users.find((user) => user.username === username);
    console.log(foundUser);

    if (!foundUser) {
      return res.status(400).json({
        success: false,
        error: "Account does not exist!",
      });
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
  });
});

// Route to handle user registration
router.route("/register").post((req, res) => {
  // Get the user submitted details from the request body
  const { username, password, riotId, tagline, email, puuid } = req.query;

  knex("users")
    .then((users) => {
      const foundUser = users.find((user) => user.username === username);

      if (foundUser) {
        res.status(400).json("Username already taken");
      } else {
        res.status(200).json("Account successfully made!");
        return knex("users").insert({
          username,
          password,
          riotId,
          tagline,
          email,
          puuid,
        });
      }
    })
    .catch((error) => {
      res.status(400).json(error);
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
