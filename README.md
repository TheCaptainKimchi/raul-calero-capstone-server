# Installation

Download code. Using vsCode, open folder with code. In vsCode terminal, run [$ npm i] to install dependencies. Create a .env file reference .env.example.

## About The App

This is a server to be paired with the client version of this app. It is geared to store user data, make axios calls to the Riot Games Api, and send data back to the client.

## Routes

List of routes that can be called:

1. ("/") default path to explain different paths to call.
2. ("/leaderboard") leaderboard path to post/get leaderboard data
3. ("/leaderboard/:puuid") search specific user leaderboard data
4. ("/profile") check user JWT token
5. ("/puuid") obtain player puuid from Riot Games API
6. ("/matchId") obtain player matchIds using puuid from Riot Games API
7. ("/match") obtain player match details using matchId from Riot Games API
