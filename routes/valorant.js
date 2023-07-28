const express = require("express");
const router = express.Router();
const fs = require("fs");
const axios = require("axios");
const { isDataExists } = require("../utils/utils");
const path = require("path");
const jwt = require("jsonwebtoken");

const apiKey = process.env.API_KEY;
const filePath = path.join(__dirname, "..", "data", "leaderboard.json");
const usersPath = path.join(__dirname, "..", "data", "users.json");

// ==========================
// ====== Default path ======
// ==========================
router.route("/").get((req, res) => {
  console.log(apiKey);
  res.send(
    "Welcome to the SparkGG API! To get started, you can send a GET request to /match and /leaderboard."
  );
});

// ==========================
// ======= PUUID path =======
// ==========================
router.route("/puuid").get((req, res) => {
  const userName = req.query.userName;
  const tagline = req.query.tagline;
  console.log(`userName: ${userName}`);
  console.log(`tagline: ${tagline}`);

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
router.route("/matchId").get((req, res) => {
  const puuid = req.query.puuid;
  console.log(`puuid: ${puuid}`);

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
  .get((req, res) => {
    // Read the contents of the leaderboard.json file
    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) {
        console.error("Error reading the leaderboard.json file:", err);
        return;
      }

      // Parse the JSON data into an array of objects
      const leaderboardData = JSON.parse(data);

      // Create an object to store the total kills and names for each unique puuid
      const puuidKillsMap = {};
      const puuidDeathsMap = {};
      const puuidAssistsMap = {};

      // ===== KILLS =====

      // Loop through the array of objects and sum up the kills for each puuid
      leaderboardData.forEach((entry) => {
        const puuid = entry.puuid;
        const kills = parseInt(entry.kills);
        const name = entry.userName;

        // If the puuid is already in the map, add the kills to its total
        if (puuidKillsMap.hasOwnProperty(puuid)) {
          puuidKillsMap[puuid].kills += kills;
        } else {
          // If the puuid is not in the map, initialize it with the current kills and name
          puuidKillsMap[puuid] = { name, kills };
        }
      });

      // Find the puuid with the highest total kills
      let highestKills = 0;
      let puuidWithHighestKills = null;
      let nameWithHighestKills = null;

      for (const puuid in puuidKillsMap) {
        if (puuidKillsMap[puuid].kills > highestKills) {
          highestKills = puuidKillsMap[puuid].kills;
          puuidWithHighestKills = puuid;
          nameWithHighestKills = puuidKillsMap[puuid].name;
        }
      }

      const mostKills = {
        puuid: puuidWithHighestKills,
        name: nameWithHighestKills,
        kills: highestKills,
      };

      // ===== DEATHS =====

      leaderboardData.forEach((entry) => {
        const puuid = entry.puuid;
        const deaths = parseInt(entry.deaths);
        const name = entry.userName;

        // If the puuid is already in the map, add the kills to its total
        if (puuidDeathsMap.hasOwnProperty(puuid)) {
          puuidDeathsMap[puuid].deaths += deaths;
        } else {
          // If the puuid is not in the map, initialize it with the current kills and name
          puuidDeathsMap[puuid] = { name, deaths };
        }
      });

      let highestDeaths = 0;
      let puuidWithHighestDeaths = null;
      let nameWithHighestDeaths = null;

      for (const puuid in puuidDeathsMap) {
        if (puuidDeathsMap[puuid].deaths > highestDeaths) {
          highestDeaths = puuidDeathsMap[puuid].deaths;
          puuidWithHighestDeaths = puuid;
          nameWithHighestDeaths = puuidDeathsMap[puuid].name;
        }
      }

      const mostDeaths = {
        puuid: puuidWithHighestDeaths,
        name: nameWithHighestDeaths,
        deaths: highestDeaths,
      };

      // ===== ASSISTS =====

      leaderboardData.forEach((entry) => {
        const puuid = entry.puuid;
        const assists = parseInt(entry.assists);
        const name = entry.userName;

        if (puuidAssistsMap.hasOwnProperty(puuid)) {
          puuidAssistsMap[puuid].assists += assists;
        } else {
          puuidAssistsMap[puuid] = { name, assists };
        }
      });

      let highestAssists = 0;
      let puuidWithHighestAssists = null;
      let nameWithHighestAssists = null;

      for (const puuid in puuidAssistsMap) {
        if (puuidAssistsMap[puuid].assists > highestAssists) {
          highestAssists = puuidAssistsMap[puuid].assists;
          puuidWithHighestAssists = puuid;
          nameWithHighestAssists = puuidAssistsMap[puuid].name;
        }
      }

      const mostAssists = {
        puuid: puuidWithHighestAssists,
        name: nameWithHighestAssists,
        assists: highestAssists,
      };

      // ===== KDA =====

      // Find the puuid with the highest average KDA
      let highestAverageKda = 0;
      let puuidWithHighestAverageKda = null;
      let nameWithHighestAverageKda = null;

      leaderboardData.forEach((entry) => {
        const puuid = entry.puuid;
        const kda = parseFloat(entry.kda); // Convert to a floating-point number
        const name = entry.userName;

        if (kda > highestAverageKda) {
          highestAverageKda = kda;
          puuidWithHighestAverageKda = puuid;
          nameWithHighestAverageKda = name;
        }
      });

      const bestKda = {
        puuid: puuidWithHighestAverageKda,
        name: nameWithHighestAverageKda,
        kda: highestAverageKda,
      };

      // ===== OUTPUT =====

      const leaderboard = {
        mostKills: mostKills,
        mostDeaths: mostDeaths,
        mostAssists: mostAssists,
        bestKda: bestKda,
      };

      res.json(leaderboard);
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
          message: "Username/Password combination is incorrect",
        });
      }

      // User exists and password is correct, return success response
      const token = jwt.sign(
        {
          username: username,
          loginTime: Date.now(),
        },
        process.env.JWT_SECRET,
        { expiresIn: "5m" }
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
  const { username, password } = req.query;

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
      usersData.push({ username, password });

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
      .json({ success: false, message: "The authorization token is invalid" });
  }

  // Get the token itself for the authorization header (without "Bearer ")
  const authToken = req.headers.authorization.split(" ")[1];

  // The callback comes with two parameters - the error and the decoded token (the payload)
  // To check the JWT token, we provide 3 arguments to jwt.verify()
  //  1) The token
  //  2) The secret it was signed with
  //  3) A callback to perform after the JWT has been verified
  // The callback function has two parameters for us to use, an error (if there is one) and the decoded token
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

// const { username, password } = req.query;

// // Check if the user already exists the the DB
// const user = users.find((user) => user.username === username);
// if (user) {
//   return res
//     .status(400)
//     .json({ success: false, message: "User already exists" });
// }

// // Add the user to the DB
// users.push({ username, password });

// res.status(201).json({ success: true, message: "User created" });
