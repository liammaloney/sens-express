var express = require('express');
var axios = require('axios');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  statsObject().then((stats) => {
    res.render('index', { 
      title: 'Ottawa Senators Stats',
      table_data: stats
    });
  })
});

const statsObject = async () => {
  let team_id = 9;
  let url = `https://statsapi.web.nhl.com/api/v1/teams/${team_id}/roster`;

  res = await sendGetRequest(url)

  const roster = res.data.roster;

  let players = await rosterStatistics(team_id, roster)
  
  players.sort(function(a, b){
    return a.number - b.number;
  });
  return players
};

const rosterStatistics = async (team_id, roster) => {
  let players = [];

  var arrayLength = roster.length;
  for (var i = 0; i < arrayLength; i++) {
    let player_data = {
      "number": roster[i].jerseyNumber,
      "name": roster[i].person.fullName
    };
    if (roster[i].position.code != "G") {
      players.push(player_data)
      stats = await playerStats(team_id, roster[i], player_data)
    }
  }
  return players
};

const playerStats = async (team_id, player_res, player_data) => {
  let player_link = player_res.person.link;
  let url = `https://statsapi.web.nhl.com${player_link}/stats?stats=statsSingleSeason`;
  let player_stats = player_data;

  res = await sendGetRequest(url)

  if (res.data.stats[0].splits.length > 0){
    let stats_object = res.data.stats[0].splits[0].stat;
    let ppg = (stats_object.points/stats_object.games).toFixed(2);

    player_stats.gamesplayed = stats_object.games;
    player_stats.goals = stats_object.goals;
    player_stats.assists = stats_object.assists;
    player_stats.points = stats_object.points;
    player_stats.pointspergame = ppg;
    player_stats.projected = await projectedPoints(team_id, stats_object.games, stats_object.points)

    return player_stats;
  } else {
    return {};
  }
};

const projectedPoints = async (team_id, games_played, points) => {
  let url = `https://statsapi.web.nhl.com/api/v1/teams/${team_id}/stats`;

  res = await sendGetRequest(url)

  let team_games_played = res.data.stats[0].splits[0].stat.gamesPlayed;
  let games_remaining = 82-team_games_played;
  let ppg = points/games_played
  let projected_remaining = Math.floor(games_remaining*ppg);

  return (points + projected_remaining);
};

const sendGetRequest = async (url) => {
  try {
      const resp = await axios.get(url);
      return resp;
  } catch (err) {
      // Handle Error Here
      console.error(err);
  }
};

module.exports = router;
