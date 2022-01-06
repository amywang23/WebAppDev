const express = require ('express');
const router = express.Router ({ strict : true })


router.get('/getWeather', function(req, res){
    res.render('weatherform');
});
   
   
var https = require('https');

// ---------------
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
	}
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
};

var getWeatherTemperature = function(req,res,next) {

	var something_useful = res.locals.something_useful;
	
	if(!something_useful) {
	    // do nothing
	    next();
	}
	
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
};

// --------------- get handlers
router.get('/weatherresults', 
getWeatherHourlyUrl, 
getWeatherTemperature,
function(req,res) {
    console.log('third step')
    var something_useful = res.locals.something_useful;
    console.log('temperature from last step: '+something_useful);
    const {f_lat, f_long} = req.query;
	
	var params = {
		'lat' : f_lat,
		'long' : f_long,
		'temperature' : something_useful
	}
	
	res.render('weather', params);

}

);



module.exports = router;
