#!/usr/bin/nodejs 2

//  --------------load packages                   //
var cookiesession = require('cookie-session');
var express = require('express');
const { AuthorizationCode } = require('simple-oauth2');
var app = express();

var https = require('https');
var hbs = require('hbs');

const weather = require('./controllers/weather.js');
app.use(weather);

app.set('trust proxy', 1) // trust first proxy

app.use(express.static('static_files'));
// -------------- express initialization -------------- //

app.set('view engine', 'hbs');

app.use(cookiesession({
     name: 'snorkles',
     keys: ['SomeSecretKeysl23', 'ThatYouShouldChange456'] 
}))

var mysql = require('mysql');

var cookieParser = require('cookie-parser')
app.use(cookieParser())

const housepoints = require('./controllers/housepoints.js');
app.use(housepoints);
// -------------- mysql initialization -------------- //
// USE PARAMETERS FROM DIRECTOR DOCS!!!
var sql_params = {
  connectionLimit : 10,
  user            : process.env.DIRECTOR_DATABASE_USERNAME,
  password        : process.env.DIRECTOR_DATABASE_PASSWORD,
  host            : process.env.DIRECTOR_DATABASE_HOST,
  port            : process.env.DIRECTOR_DATABASE_PORT,
  database        : process.env.DIRECTOR_DATABASE_NAME
}

var pool  = mysql.createPool(sql_params);

// store pool for middlewires to use
app.set('dbPool', pool);

// -------------- variable initialization               //

// These are parameters provided by the authenticating server when
// we register our OAUTH client.
// -- The client ID is going to be public
// -- The client secret is super top secret. Don't make this visible
// -- The redirect uri should be some intermediary 'get' request that
//    you write in which you assign the token to the session.

var ion_client_id = 'z2lbyvFTTudqkGPxsuUT2voT77tt5zRWDzi93Iyf';
var ion_client_secret ='DHJ1jyHkxXOkJXeuvIEVFvbFkpYOtLDrMFTs9jRPMtA7gZV6Y7Oz3bAI36PDuGu7R32Vl1yloa6sRu0z8CMEGyWnEDFFJQtLZkSdRZqfjSZcQRDLiXuH6xmEPTXmKJuO';
var ion_redirect_uri = 'https://user.tjhsst.edu/2023awang/login_worker';

var client = new AuthorizationCode({
  client: {
     id: ion_client_id,
     secret: ion_client_secret
  },
  auth:   {         
     tokenHost:'https://ion.tjhsst.edu/oauth/',
     authorizePath: 'https://ion.tjhsst.edu/oauth/authorize',
     tokenPath: 'https://ion.tjhsst.edu/oauth/token/'
  }
})  ;

var authorizationUri = client.authorizeURL({
       scope: "read",
       state: '<state>',
       redirect_uri: ion_redirect_uri
});

console.log(authorizationUri)

//check whether authenticated or not
function checkAuthentication(req,res,next) {

                if ('authenticated' in req.session) {
                         // the user has logged in
                          next()
                } 
                else {
                         // the user has not logged in
                         // res.render('unverified', {'login_link' : decodeURI(authorizationUri)})

    res.render('mainpage', {'login_link' : decodeURI(authorizationUri), 'open_login_modal' : 'block'});

                }
}

//get profile and set res.locals and req.session to it
function getUserName(req,res,next) { 
             req.session.token = res.locals.token;
             var access_token = req.session.token.access_token;
             var profile_url = 'https://ion.tjhsst.edu/api/profile?format=json&access_token='+access_token;

             https.get(profile_url, function(response) {

                 var rawData  = '';
                 response.on('data', function(chunk) {
                              rawData += chunk;
                 });

                 response.on('end', function() {
                          res.locals.sum = JSON.parse(rawData);
                          req.session.profile = JSON.parse(rawData);
                          next();
                 });

              }).on('error', function(err) {
                    next(err)
              });
}

//sum the total points for each house
function sumHousePoints(req,res,next) {
        var total = "SELECT vhouses.house_name, vhouses.house_id, sum(points.amount) sum FROM vusers JOIN vhouses ON vusers.house_id = vhouses.house_id JOIN points ON vusers.user_id = points.to_vuserid GROUP BY vhouses.house_id;"
        pool.query(total, function(error, results, fields){
            if ( error) throw error;
            res.locals.sum = results;
            console.log(results);
            next();
        })
}

//getting the url that leads to the hourly data for that location
var getWeatherHourlyUrl = function(req,res,next) {
    console.log('first step');
	var options = { 
		headers : {
			'User-Agent': 'request'
		}
	}
	
	var {f_lat, f_long} = req.query;

    var cookie_lat_key = 'latitude'; 
    var cookie_lon_key = 'longitude';    
	
	// check if f_lat and f_long exist
	if(!f_lat || !f_long) {
	    // check cookie
        f_lat = req.cookies.latitude;
        f_long = req.cookies.longitude;
	}
	if(!f_lat || !f_long) {
	    // f_lat and f_long still not exist, do nothing
	    next();
	} else {
    	// store lat and long into cookie
        res.cookie(cookie_lat_key, f_lat);
        res.cookie(cookie_lon_key, f_long);
    
    	//var url = 'https://api.weather.gov/points/42.9356,-78.8692'
    	var url = 'https://api.weather.gov/points/'+f_lat+','+f_long;
    
    	https.get(url, options, function(response) {
    
    		var rawData = '';
    		response.on('data', function(chunk) {
    			rawData += chunk;
    		});
    		response.on('end', function() {
    			// the res.locals object (and all its subkeys) persist across middleware calls
    			var obj = JSON.parse(rawData);
    			console.log('this is the raw data' + rawData);
        		res.locals.something_useful = obj["properties"]["forecastHourly"];
    			console.log("first step got hourlyurl="+res.locals.something_useful);
    			next();
    		});
    
    	}).on('error', function(e) {
    		res.render('error')
    	})
	}
}

//uses data to find the temperature of the location
var getWeatherTemperature = function(req,res,next) {

	var something_useful = res.locals.something_useful;
	
	if(!something_useful) {
	    // do nothing
	    next();
	} else {
	
    	console.log("second step");
        console.log("url from first step: " + something_useful);
    
    	var options = { 
    		headers : {
    			'User-Agent': 'request'
    		}
    	}
    	
    	const {f_lat, f_long} = req.query;
    	
    	var url = something_useful;
        var array = url.split(':');
        if(array[0].length == 4) {
            url = array[0] + "s:" + array[1];
        }
    
    	https.get(url, options, function(response) {
    
    		var rawData = '';
    		response.on('data', function(chunk) {
    			rawData += chunk;
    		});
    		response.on('end', function() {
    			// the res.locals object (and all its subkeys) persist across middleware calls
    			var obj = JSON.parse(rawData);
        		res.locals.something_useful = obj["properties"]["periods"][0]["temperature"];
    			console.log("second step got temperature="+res.locals.something_useful);
    			next();
    		});
    
    	}).on('error', function(e) {
    		res.render('error')
    	})
	}
}

//  YOU GET THESE PARAMETERS BY REGISTERING AN APP HERE:  https://ion.tjhsst.edu/oauth/applications/
app.get('/', function(req, res){
    res.render('mainpage');
})

app.get('/count', [checkAuthentication, getUserName], function (req, res) {
    if('my_count' in req.session === false || req.session.authenticated === true) {
        req.session.my_count = 0;
    } else {
        req.session.my_count++;
    }
    console.log(req.session.my_count)
    var cookie_key = 'clickcount';
    if(cookie_key in req.cookies === false) {
        res.cookie(cookie_key, 0)
    }
    if (req.session.my_count>=5) {
        res.render('cookieerror');
    } else {
        var profile = res.locals.profile;
      var first_name = profile.first_name;
      var last_name = profile.last_name;
      var full_name = first_name + " " + last_name;
      var mynickname='hoohoohoo';
      var sql = "SELECT nickname FROM profiles WHERE fullname=?;";
      pool.query(sql,[full_name], function(error, results, fields){
        if (error) throw error;
        if (results.length > 0) {
            mynickname = results[0]["nickname"];
        }
        res.render('home', {'nickname' : mynickname});
        
      })
    }
})

app.get('/cookie', function(req, res){
    var cookie_key = 'clickcount';
    
    if(cookie_key in req.cookies === false) {
        res.cookie(cookie_key, 0)
    }
    var cookie_key_1 = "myname";
    if (cookie_key_1 in req.cookies === false) {
       res.cookie(cookie_key_1, "stranger");
    }
    var mynickname = "hoohoohoo";
    res.render('home', {'nickname' : mynickname});
})

app.get('/logout', function(req, res){
    var cookie_key = "myname";
    console.log(req.cookies);
    if (cookie_key in req.cookies === true) {
       res.cookie(cookie_key, "");
    }
     var cookie_key_1 = "clickcount";
    if (cookie_key_1 in req.cookies === true) {
        res.cookie(cookie_key_1, 0);
    }
    if('my_count' in req.session === true) {
        req.session.my_count = 0;
    } 
    delete req.session.authenticated;
    res.render('cookielogout');
})

app.get('/loginsubmit', function(req, res){
    console.log("loginsubmit");
	const {f_name} = req.query;
	var cookie_key = "myname";
    
    res.cookie("myname", f_name);
    res.cookie("clickcount", 0);
    
    if('my_count' in req.session === true) {
        req.session.my_count = 0;
    } 
    res.render("home");
	
});

app.get('/getWeather_tmp', function(req, res){
    res.render('weatherform');
});
   
   
app.get('/weatherresults_tmp', function(req, res){

	const {f_lat, f_long} = req.query;
	var params = {
		'lat' : f_lat,
		'long' : f_long,
		'temperature' : temperature,
		'forecast' : forecast
	}
	
	res.render('weather', params);
	 
});

app.get('/madlib', function(req, res){
    res.render('formtemplate');
});

app.get('/madlibresults', function(req, res){

	const {f_name, f_color, f_person, f_school, f_place, f_pet, f_alive} = req.query;
	// the above line is called destructuring.
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment#object_destructuring

	var params = {
		'name' : f_name,
		'color' : f_color,
		'person' : f_person,
		'school' : f_school,
		'place' : f_place,
		'pet' : f_pet,
		'alive' : f_alive
	};
	if(f_alive=="on") {
	    res.render('madlib', params);
	} else{
	    res.render('noaccess', params);
	}
});

app.get('/voteForm', function(req,res){

    var sql = "SELECT id,full_name,description,count FROM stunts";

    pool.query(sql, function(error, results, fields){
        if (error) throw error;
        console.log(results)
        res.render('stunt', {'stunt_data':results} );
    }) 
    
})


app.get('/submitVote', function(req,res){
    const {stunt_id} = req.query;

	console.log("id = " + stunt_id);
	

    sql = "UPDATE stunts SET count = count + 1 WHERE id = ?";
    
    pool.query(sql, [stunt_id], function(error, results, fields){
        if (error) throw error;
         res.redirect('https://user.tjhsst.edu/2023awang/displayVote');
 
    })
    
})

app.get('/displayVote', function(req,res){
var sql = "SELECT id,full_name,description,count FROM stunts";

    pool.query(sql, function(error, results, fields){
        if (error) throw error;
        console.log(results)
        res.render('voteresult', {'stunt_data':results} );
    }) 
    
})

app.get('/profile', [checkAuthentication, getUserName, getWeatherHourlyUrl, getWeatherTemperature], function (req, res) {

      var profile = res.locals.profile;
      console.log(profile);
      var first_name = profile.first_name;
      var last_name = profile.last_name;
      var counselor = profile.counselor;
      var counselor_name = counselor['full_name'];
      var full_name = first_name + " " + last_name;
      var photo = profile.picture;

      console.log("/: fullname="+full_name);
      
      //get nickname from mysql
      var mynickname='';
      var sql = "SELECT nickname FROM profiles WHERE fullname=?;";

    //get counselor from mysql
    /*var counselor = '';
    var sql2 = "SELECT counselor FROM profiles WHERE fullname=?";*/
    
      pool.query(sql,[full_name], function(error, results, fields){
        if (error) throw error;
        if (results.length > 0) {
            //console.log("/: mysql results="+results[0]["nickname"]);
            //console.log(results);
            mynickname = results[0]["nickname"];
            console.log("/: mysql nickname="+mynickname);
        }
        
        // get Weather temperature 
        var something_useful = res.locals.something_useful;
        var f_lat = req.cookies.latitude;
        var f_long = req.cookies.longitude;
        var weather_info ;
        if (something_useful) {
            console.log('weather: ' + something_useful);
            weather_info = {
                'lat' : f_lat,
                'long' : f_long,
                'temperature' : something_useful
            }
        } else {
            console.log('no weather info');
            weather_info = null;
        }

        res.render('myprofile', {'user' : full_name,
                                'nickname': mynickname,
                                'counselor' : counselor_name,
                                'photo' : photo,
                                'weatherinfo' : weather_info
        });
      })
      
});

app.get('/logoutprofile', function (req, res) {

       delete req.session.authenticated;
       res.redirect('https://user.tjhsst.edu/2023awang');
});

app.get('/nickname', function (req, res) {
       const {fullname, nickname} = req.query;
       console.log("/nickname: nickname = " + nickname + ", fullname="+fullname);
       res.render('nickname', {'fullname' : fullname,
                                'nickname': nickname  });
});

app.get('/nicknamesubmit', function (req, res) {
   const {f_nickname, f_fullname, f_oldnickname} = req.query;

	console.log("/nicknamesubmit: nickname = " + f_nickname + ", fullname="+f_fullname+", oldnickname="+f_oldnickname);
	
	var sql;
	
	if (f_oldnickname==='')
	    sql = "INSERT INTO profiles(nickname, fullname) VALUES ( ?, ?);";
    else
        sql = "UPDATE profiles SET nickname = ? WHERE fullname = ?";
    
    pool.query(sql, [f_nickname, f_fullname], function(error, results, fields){
        if (error) throw error;
         res.redirect('https://user.tjhsst.edu/2023awang/');
 
    })
     
});

app.get('/login', [checkAuthentication], function(req, res){
    req.session.authenticated = true;
    req.session.token = res.locals.token;
    res.render('unverified', {'login_link' : decodeURI(authorizationUri)} );
})

app.get('/login_worker', [convertCodeToToken, getUserName], function(req, res) {

                req.session.authenticated = true;
                req.session.token = res.locals.token;

                res.redirect('https://user.tjhsst.edu/2023awang/userhousesum');

});

// -------------- express listener                //
//converts code into token which is stored in res.locals
async function convertCodeToToken(req, res, next) {
       var theCode = req.query.code;

       var options = {
          'code': theCode,
          'redirect_uri': ion_redirect_uri,
          'scope': 'read'
        };


       // needed to be in try/catch
       try {
           var accessToken = await client.getToken(options);  // await serializes asyncronous fcn call
           res.locals.token = accessToken.token;
           console.log("convertCodeToToken: Getting access token")
           next ( );
       }
       catch (error) {
          console.log('Access Token Error', error.message);
          res.send(502); // error creating token
       }
};
//                listener                //
// The listener is what keeps node 'alive.'//

var listener = app.listen(process.env.PORT || 8080, process.env.HOST || "0.0.0.0", function() {
       console.log("Express server started");
});
