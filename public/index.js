// -------------- load packages -------------- //
var express = require('express');
var app = express();

var hbs = require('hbs');
app.set('view engine', 'hbs');

var mysql = require('mysql');

app.use(express.static('static_files'));

// -------------- variable definition -------------- //
var visitorCount = 0; 

// -------------- mysql initialization -------------- //
// USE PARAMETERS FROM DIRECTOR DOCS!!!
var sql_params = {
  connectionLimit : 10,
  user            : process.env.DIRECTOR_DATABASE_USERNAME,
  password        : process.env.DIRECTOR_DATABASE_PASSWORD,
  host            : process.env.DIRECTOR_DATABASE_HOST,
  port            : process.env.DIRECTOR_DATABASE_PORT,
  database        : process.env.DIRECTOR_DATABASE_NAME,
}

var pool  = mysql.createPool(sql_params);

app.set('dbPool', pool);

const mapgame = require('./controllers/mapgame.js');
app.use(mapgame);

// -------------- listener -------------- //
// The listener is what keeps node 'alive.' 

var listener = app.listen(process.env.PORT || 8080, process.env.HOST || "0.0.0.0", function() {
       console.log("Express server started");
});
