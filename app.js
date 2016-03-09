/**
 * Copyright 2015 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *	  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

var express  		= require('express'),
	app		 		= express(),
	bluemix			= require('./config/bluemix'),
	extend			= require('util')._extend,
	XMLHttpRequest 	= require("xmlhttprequest").XMLHttpRequest;
	
var Cloudant = require('cloudant');
	
var sentiments = ['positive', 'negative', 'neutral', 'ambivalent'];
var totalSteps = 10;

var credentialsCloudant = extend({
	version: 'v1',
	url : '<url>',
	username: '<username>',
	password: '<password>'
}, bluemix.getServiceCreds('cloudantNoSQLDB'));

var url = "https://cdeservice." + "<region>" + ".mybluemix.net:443/api/v1/messages/count";
var username = "<username>";
var psswd = "<password>";
var auth = "Basic " + new Buffer(username + ":" + psswd).toString("base64");

var cloudant = Cloudant({account:credentialsCloudant.username, password:credentialsCloudant.password});

// Bootstrap application settings
require('./config/express')(app);

app.get('/tweets', function(req, res) {
	var cities = JSON.parse(req.query.cities);
	var initialDate = new Date(req.query.initialDate);
	var finalDate = new Date(req.query.finalDate);
	// Calculate the total number of days
	var days = (finalDate.getTime() - initialDate.getTime()) / (1000*60*60*24) + 1;
	// Calculate the interval step
	var step = Math.max(Math.floor(days / totalSteps), 1);
	// Calculate the number of iterations
	days = Math.min(days, totalSteps);
	console.log('starting....');
	
	// If date is incorrect we return an error
	if (initialDate.getTime() > finalDate.getTime())
		res.status(422).send("Bad date arguments");

	var http = {};
	var results = {};

	for (var city in cities) {
		http[cities[city]] = {};
		results[cities[city]] = {};
		initialDate = new Date(req.query.initialDate);
		var midDate = new Date(req.query.initialDate);
		midDate.setDate(midDate.getDate() + step - 1);
		for (var day = 0; day < days ; day++) {
			http[cities[city]][day] = {};
			results[cities[city]][day] = {};
			if (day == days - 1)
				midDate = new Date(req.query.finalDate);
			for (var sentiment in sentiments) {
				// initialDate.toISOString().slice(0,10) is the correct format of the date to make a request
				var params = 'q=' + cities[city] + '%20sentiment%3A' + sentiments[sentiment] + '%20posted%3A'
						+ initialDate.toISOString().slice(0,10) + '%2C' + midDate.toISOString().slice(0,10); 
				http[cities[city]][day][sentiments[sentiment]] = new XMLHttpRequest();
				http[cities[city]][day][sentiments[sentiment]].open("GET", url + '?' + params, true);
				http[cities[city]][day][sentiments[sentiment]].setRequestHeader("Authorization", auth);
				http[cities[city]][day][sentiments[sentiment]].onreadystatechange = function() {
					var stop = false;
					for (var i in cities)
						for (var k = 0; k < days; k++)
							for (var j in sentiments)
									if (http[cities[i]] == undefined || http[cities[i]][k] == undefined || http[cities[i]][k][sentiments[j]] == undefined
										|| http[cities[i]][k][sentiments[j]].readyState < 4)
											stop = true;
					if (!stop) {
						for (var i in cities)
							for (var k = 0; k < days; k++)
								for (var j in sentiments)
									if (http[cities[i]][k][sentiments[j]].status == 200)
										results[cities[i]][k][sentiments[j]] = JSON.parse(http[cities[i]][k][sentiments[j]].responseText).search.results;
									else
										res.send(http[cities[i]][k][sentiments[j]].responseText);
						console.log('sending data....');
						res.json(results);
					}
				}
				http[cities[city]][day][sentiments[sentiment]].send();
			}
			initialDate.setDate(initialDate.getDate() + step);		// increments by step days the Date
			midDate.setDate(midDate.getDate() + step);				// increments by step days the Date
		}
	}
	console.log('ending request....');
});

app.get('/initialRequest', function(req, res) {
	var db = cloudant.db.use('initial');
	db.get('results', function(err, data) {
		if (!err)
			res.send(data.value);
	});
});

function updateWeek() {
	var cities = ["Malaga","Madrid","Barcelona","Sevilla","Valencia","Zaragoza"];
	var totalDays = 7;
	
	var http = {};
	var results = {};

	for (var city in cities) {
		http[cities[city]] = {};
		results[cities[city]] = {};
		var initialDate = new Date();
		initialDate.setDate(initialDate.getDate() - totalDays);
		var finalDate = new Date();
		for (var day = 0; day <= totalDays ; day++) {
			http[cities[city]][day] = {};
			results[cities[city]][day] = {};
			for (var sentiment in sentiments) {
				var params = 'q=' + cities[city] + '%20sentiment%3A' + sentiments[sentiment] + '%20posted%3A'
						+ initialDate.toISOString().slice(0,10) + '%2C' + initialDate.toISOString().slice(0,10);
				http[cities[city]][day][sentiments[sentiment]] = new XMLHttpRequest();
				http[cities[city]][day][sentiments[sentiment]].open("GET", url + '?' + params, true);
				http[cities[city]][day][sentiments[sentiment]].setRequestHeader("Authorization", auth);
				http[cities[city]][day][sentiments[sentiment]].onreadystatechange = function() {
					var stop = false;
					for (var i in cities)
						for (var k = 0; k <= totalDays; k++)
							for (var j in sentiments)
									if (http[cities[i]] == undefined || http[cities[i]][k] == undefined || http[cities[i]][k][sentiments[j]] == undefined
										|| http[cities[i]][k][sentiments[j]].readyState < 4)
											stop = true;
					if (!stop) {
						for (var i in cities)
							for (var k = 0; k <= totalDays; k++)
								for (var j in sentiments)
									if (http[cities[i]][k][sentiments[j]].status == 200)
										results[cities[i]][k][sentiments[j]] = JSON.parse(http[cities[i]][k][sentiments[j]].responseText).search.results;
									else
										res.send(http[cities[i]][k][sentiments[j]].responseText);
						cloudant.db.destroy('initial', function(err) {
							cloudant.db.create('initial', function() {
								var db = cloudant.db.use('initial');
								db.insert({ value: results }, 'results', function(err, body, header) {
									if (err)
										return console.log('[initial.insert] ', err.message);
								});
							});
						});
					}
				}
				http[cities[city]][day][sentiments[sentiment]].send();
			}
			initialDate.setDate(initialDate.getDate() + 1);		// increments by step days the Date
		}
	}
}

// Update tweets initial values every 6 hours
setInterval(updateWeek, 21600000);

var port = process.env.VCAP_APP_PORT || 3000;
app.listen(port);
console.log('Listening at:', port);
