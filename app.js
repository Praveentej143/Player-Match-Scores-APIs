const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let database = null;
const initilizeDbAndServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};
initilizeDbAndServer();

//CASE CONVERSIONS

const playersCaseConversion = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const matchCaseConversions = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

//API -- 1
//Get all players

app.get("/players/", async (request, response) => {
  const getAllPlayersQuery = `
    SELECT *  FROM player_details ORDER BY player_id;
    `;
  const getAllPlayers = await database.all(getAllPlayersQuery);
  response.send(
    getAllPlayers.map((eachPlayer) => playersCaseConversion(eachPlayer))
  );
});

//API -- 2
//GET SPECIFIC PLAYER

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const specificPlayerQuery = `
  SELECT * from player_details WHERE player_id = ${playerId};
  `;
  const getSpecificPlayer = await database.get(specificPlayerQuery);
  response.send(playersCaseConversion(getSpecificPlayer));
});

//API --- 3
//UPDATING SPECIFIC PLAYER DETAILS

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;

  const playerUpdatingQuery = `
    UPDATE player_details
    SET 
    player_name = '${playerName}'
    WHERE player_id = ${playerId};
    `;
  await database.run(playerUpdatingQuery);
  response.send("Player Details Updated");
});

//GET ALL MATCH DETAILS

app.get("/matches/", async (request, response) => {
  const getMatchesQuery = `
    SELECT * FROM match_details ORDER BY match_id
    `;
  const getAllMatches = await database.all(getMatchesQuery);
  response.send(
    getAllMatches.map((eachmatch) => matchCaseConversions(eachmatch))
  );
});

//API ---  4
//GET SPECIFIC MATCH DETAILS

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getSpecificMatchQuery = `
    SELECT * FROM match_details WHERE match_id = ${matchId};
    `;
  const getSpecificMatch = await database.get(getSpecificMatchQuery);
  response.send(matchCaseConversions(getSpecificMatch));
});

//API --- 5
//GET ALL MATCHES BY PLAYER

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchByPlayerQuery = `
    SELECT * FROM  match_details JOIN player_match_score
    ON  match_details.match_id = player_match_score.match_id 

    WHERE player_match_score.player_id = ${playerId};
    `;
  const getMatchesByPlayer = await database.all(getMatchByPlayerQuery);
  response.send(
    getMatchesByPlayer.map((eachMatch) => matchCaseConversions(eachMatch))
  );
});

//API --- 6
//GET PLAYERS OF A SPECIFIC MATCH
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayersByMatchQuery = `
    SELECT * FROM player_details JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_match_score.match_id = ${matchId};
    `;
  const getPlayersByMatch = await database.all(getPlayersByMatchQuery);
  response.send(
    getPlayersByMatch.map((eachPlayer) => playersCaseConversion(eachPlayer))
  );
});

//API ---  7
//GET ALL STATS

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getStatsQuery = `
    SELECT player_match_score.player_id as playerId,
    player_details.player_name as playerName,
    sum(score) as totalScore,
    sum(fours) as totalFours,
    sum(sixes) as totalSixes

    FROM 

    player_match_score JOIN player_details
    
    ON

    player_match_score.player_id = player_details.player_id

    WHERE player_match_score.player_id = ${playerId};
    `;
  const getStats = await database.get(getStatsQuery);
  response.send(getStats);
});

module.exports = app;
