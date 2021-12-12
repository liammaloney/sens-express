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

function statsObject() {
  let team_id = 9;
  let url = `https://statsapi.web.nhl.com/api/v1/teams/${team_id}/roster`;

  return axios.get(url)
      .then(res => {
        let players = [];
        const roster = res.data.roster;
        roster.forEach((player) => {
          let player_data = {
            "number": player.jerseyNumber,
            "name": player.person.fullName
          };
          players.push(player_data)
          // playerStats(team_id, player, player_data).then((stats) => {
          //   if (Object.keys(stats).length === 2) {
          //     players.push(stats);
          //   }
          // });
        });
        players.sort(function(a, b){
          return a.number - b.number;
        });
        return players
      });
};

function playerStats(team_id, player_res, player_data) {
  let player_link = player_res.person.link;
  let url = `https://statsapi.web.nhl.com${player_link}/stats?stats=statsSingleSeason`;
  let player_stats = player_data;

  return axios.get(url)
    .then(res => {
      if (res.data.stats[0].splits.length > 0){
        let stats_object = res.data.stats[0].splits[0].stat;
        let ppg = (stats_object.points/stats_object.games).toFixed(2);

        player_stats.gamesplayed = stats_object.games;
        player_stats.goals = stats_object.goals;
        player_stats.assists = stats_object.goals;
        player_stats.points = stats_object.points;
        player_stats.pointspergame = ppg;
        projectedPoints(team_id, stats_object.games, stats_object.points).then((projected) => {
          player_stats.projected = projected
        });
        return player_stats;
      } else {
        return {};
      }
    });
};

function projectedPoints(team_id, games_played, points) {
  let url = `https://statsapi.web.nhl.com/api/v1/teams/${team_id}/stats`;

  return axios.get(url)
    .then(res => {
      let team_games_played = res.data.stats[0].splits[0].stat.gamesPlayed;
      let games_remaining = 82-team_games_played;
      let ppg = points/games_played
      let projected_remaining = Math.floor(games_remaining*ppg);

      return (points + projected_remaining);
    });
};

module.exports = router;
