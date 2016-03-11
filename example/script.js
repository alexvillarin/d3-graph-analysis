const totalSteps = 10;
var data;
var getCharts = function() {
	d3.csv("data.csv", function(error, inputData) {
		data = {};
		for (var i in inputData) {
			if (!data[inputData[i].city])
				data[inputData[i].city] = {};
			if (!data[inputData[i].city][inputData[i].term])
				data[inputData[i].city][inputData[i].term] = {};
			data[inputData[i].city][inputData[i].term]['positive'] = +inputData[i].positive;
			data[inputData[i].city][inputData[i].term]['neutral'] = +inputData[i].neutral;
			data[inputData[i].city][inputData[i].term]['ambivalent'] = +inputData[i].ambivalent;
			data[inputData[i].city][inputData[i].term]['negative'] = +inputData[i].negative;
		}
		lineChart('lineChart', parseLineChartData(data));
		barChart('barchart', parseBarChartData(data));
		var pieData = parsePieChartData(data);
		donut('chart1', 'positive', pieData);
		donut('chart2', 'negative', pieData);
		donut('chart3', 'neutral', pieData);
		donut('chart4', 'ambivalent', pieData);
	});
}

var color = d3.scale.category10();
var availableRecusion = true;
var cities = {"Malaga": true, "Madrid": true, "Barcelona": true, "Sevilla": true, "Valencia": true, "Zaragoza": true};
var updateBarLineCharts = function(name, div) {
	availableRecusion = false;
	lineChart('lineChart', parseLineChartData(data));
	barChart('barchart', parseBarChartData(data));
	var array = d3.selectAll('rect')[0];
	var e = document.createEvent('UIEvents');
	e.initUIEvent('click', true, true, window, 1);
	for (var i in array)
		if (array[i].__data__ == name && div.slice(5,6) != Math.floor(i/6) + 1)
			d3.selectAll('rect')[0][i].dispatchEvent(e);
	availableRecusion = true;
}

var getDate = function(days) {
	var date = new Date("2016-02-22");
	date.setDate(22 + days);
	return date;
}

var upperUnit = function(value) {
	var units = Math.pow(10, (Math.log(value) * Math.LOG10E + 1 | 0) - 2);
	return units * (Math.ceil(value / units) + 1);
}

var parseLineChartData = function(data) {
	var maxTotal = 0;
	var finalData = [];
	var days = 7;
	for (var city in data) {
		if (cities[city]) {
			var value = [];
			var i = 0;
			for (var date in data[city]) {
				var total = 0;
				for (var sentiment in data[city][date])
					total += data[city][date][sentiment];
				value.push({"total" : total, "date" : i++})
			}
			value[i-1].total = value[i-1].total;
			finalData.push({"name" : city, "value" : value});
			for (var j = 0; j < value.length; j++)
				if (value[j].total > maxTotal)
					maxTotal = value[j].total;
		}
	}
	return {"maxTotal" : upperUnit(maxTotal), "data" : finalData};
}
		
var lineChart = function(div, data) {
	d3.select("#" + div).selectAll("svg").remove();
	var width = 600,
		height = 312,
		margins = { top: 20,
					right: 20,
					bottom: 20,
					left: 100 },
		
		vis = d3.select("#" + div).append("svg")
				.attr("width", width + margins.left + margins.right)
				.attr("height", height + margins.top + margins.bottom),
		xScale = d3.time.scale.utc().range([margins.left, width - margins.right]).domain([new Date("2016-02-22"), new Date("2016-02-29")]),
		yScale = d3.scale.linear().range([height - margins.top, margins.bottom]).domain([0,data.maxTotal])
		xAxis = d3.svg.axis().scale(xScale).orient("bottom").outerTickSize(0).ticks(5),
		yAxis = d3.svg.axis().scale(yScale).orient("left").outerTickSize(0);
			
	vis.append("svg:g")
		 .attr("class", "x axis")
		 .attr("transform", "translate(0," + (height - margins.bottom) + ")")
		 .call(xAxis);
	vis.append("svg:g")
		 .attr("class", "y axis")
		 .attr("transform", "translate(" + (margins.left) + ",0)")
		 .call(yAxis);
		 
	var lineGen = d3.svg.line().x(function(d) { return xScale(getDate(d.date)); })
								 .y(function(d) { return yScale(d.total.toString()); })
								 .interpolate("basis");
								 
	for (var dataValues in data.data) {
		vis.append('svg:path')
			 .attr('d', lineGen(data.data[dataValues].value))
			 .attr('stroke', color(data.data[dataValues].name))
			 .attr('stroke-width', 2)
			 .attr('fill', 'none');
	}
			
	vis.selectAll('.axis line, .axis path').style({'stroke': 'Black', 'fill': 'none', 'stroke-width': '2px'});
};

var parseBarChartData = function(data) {
	var finalData = [];
	for (var city in data) {
		if (cities[city]) {
			var ambivalent = 0;
			var negative = 0;
			var neutral = 0;
			var positive = 0;
			for (var date in data[city]) {
				ambivalent += data[city][date].ambivalent;
				negative += data[city][date].negative;
				neutral += data[city][date].neutral;
				positive += data[city][date].positive;
			}
			finalData.push({"name" : city, "ambivalent" : ambivalent, "negative" : negative, "neutral" : neutral, "positive" : positive});
		}
	}
	return finalData;
}

var parsePieChartData = function(data) {
	var finalData = [];
	for (var city in data) {
		var ambivalent = 0;
		var negative = 0;
		var neutral = 0;
		var positive = 0;
		for (var date in data[city]) {
			ambivalent += data[city][date].ambivalent;
			negative += data[city][date].negative;
			neutral += data[city][date].neutral;
			positive += data[city][date].positive;
		}
		finalData.push({"name" : city, "ambivalent" : ambivalent, "negative" : negative, "neutral" : neutral, "positive" : positive});
	}
	return finalData;
}

var barChart = function(div, data) {
	d3.select("#" + div).selectAll("svg").remove();
	var width = 600,
		height = 312,
		margins = { top: 20,
					right: 20,
					bottom: 20,
					left: 100 },

		xScale = d3.scale.ordinal().rangeRoundBands([margins.left, width - margins.right], .1),
		yScale = d3.scale.linear().range([height - margins.top, margins.bottom]),
		xAxis = d3.svg.axis().scale(xScale).orient("bottom").outerTickSize(0),
		yAxis = d3.svg.axis().scale(yScale).orient("left").outerTickSize(0);

	var svg = d3.select('#' + div).append("svg")
		.attr("width", width + margins.left + margins.right)
		.attr("height", height + margins.top + margins.bottom);

		xScale.domain(data.map(function(d) { return d.name; }));
		yScale.domain([0, d3.max(data, function(d) { return upperUnit(Math.max(d.positive, d.negative, d.neutral, d.ambivalent)); })]);

		svg.append("svg:g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + (height - margins.bottom) + ")")
			.call(xAxis);

		svg.append("svg:g")
		 .attr("class", "y axis")
		 .attr("transform", "translate(" + (margins.left) + ",0)")
		 .call(yAxis);
	
		svg.selectAll('.axis line, .axis path').style({'stroke': 'Black', 'fill': 'none', 'stroke-width': '3px'});

		for (var dataValues in data) {
			svg.append("rect")
				.attr("class", "bar")
				.attr("x", xScale(data[dataValues].name))
				.attr("width", xScale.rangeBand()/4)
				.attr("y", yScale(data[dataValues].positive))
				.attr("height", height - margins.bottom - yScale(data[dataValues].positive) - 1.5)
				.style("fill", "green");
				/*
				If we need to do somenthing on click
				
				.on('mouseover', function(d) {
					d3.select(this)
					  .style('fill', 'grey');
				 })
				 .on('mouseout', function(d) {
					d3.select(this)
					  .style('fill', 'green');
				  });
				  */
			svg.append("rect")
				.attr("class", "bar")
				.attr("x", xScale(data[dataValues].name) + xScale.rangeBand()/4)
				.attr("width", xScale.rangeBand()/4)
				.attr("y", yScale(data[dataValues].neutral))
				.attr("height", height - margins.bottom - yScale(data[dataValues].neutral) - 1.5)
				.style("fill", "yellow");
			svg.append("rect")
				.attr("class", "bar")
				.attr("x", xScale(data[dataValues].name) + xScale.rangeBand()/2)
				.attr("width", xScale.rangeBand()/4)
				.attr("y", yScale(data[dataValues].negative))
				.attr("height", height - margins.bottom - yScale(data[dataValues].negative) - 1.5)
				.style("fill", "red");
			svg.append("rect")
				.attr("class", "bar")
				.attr("x", xScale(data[dataValues].name) + 3*xScale.rangeBand()/4)
				.attr("width", xScale.rangeBand()/4)
				.attr("y", yScale(data[dataValues].ambivalent))
				.attr("height", height - margins.bottom - yScale(data[dataValues].ambivalent) - 1.5)
				.style("fill", "orange");
		}
}
	
var donut = function(div, sentiment, data) {
	d3.select("#" + div).selectAll("svg").remove();
	d3.select("#" + div).selectAll("div").remove();
	var color = d3.scale.category10();
	var width = 288;
	var height = 288;
	var radius = Math.min(width, height) / 2;
	var donutwidth = 60;
	var legendRectSize = 18;
	var legendSpacing = 4;

	var svg = d3.select('#' + div)
		.append('svg')
		.attr('width', width)
		.attr('height', height)
		.append('g')
		.attr('transform', 'translate(' + (width / 2) + ',' + (height / 2) + ')');

	var arc = d3.svg.arc()
		.innerRadius(radius - donutwidth)
		.outerRadius(radius);

	var pie = d3.layout.pie()
		.value(function(d) { return d[sentiment]; })
		.sort(null);

	var tooltip = d3.select('#' + div)
		.append('div')
		.attr('class', 'myTooltip');
		
	tooltip.append('div')
		.attr('class', 'myLabel');

	tooltip.append('div')
		.attr('class', 'count');

	tooltip.append('div')
		.attr('class', 'percent');
			
	data.forEach(function(d) {
		d[sentiment] = +d[sentiment];
		d.enabled = true;	 
	});

	var path = svg.selectAll('path')
			.data(pie(data))
			.enter()
			.append('path')
			.attr('d', arc)
			.attr('fill', function(d, i) { 
				return color(d.data.name); 
			})
			.each(function(d) { this._current = d; });								 

	path.on('mouseover', function(d) {
		var total = d3.sum(data.map(function(d) {
			return (d.enabled) ? d[sentiment] : 0;
		}));
		var percent = Math.round(1000 * d.data[sentiment] / total) / 10;
		tooltip.select('.myLabel').html(d.data.name);
		tooltip.select('.count').html(d.data[sentiment]); 
		tooltip.select('.percent').html(percent + '%'); 
		tooltip.style('display', 'block');
		});
		
	path.on('mouseout', function() {
		tooltip.style('display', 'none');
	});
				
	var legend = svg.selectAll('.legend')
		.data(color.domain())
		.enter()
		.append('g')
		.attr('class', 'legend')
		.attr('transform', function(d, i) {
			var height = legendRectSize + legendSpacing;
			var offset =	height * data.length / 2;
			var horz = -2 * legendRectSize;
			var vert = i * height - offset;
			return 'translate(' + horz + ',' + vert + ')';
		});

	legend.append('rect')
		.attr('width', legendRectSize)
		.attr('height', legendRectSize)																	 
		.style('fill', color)
		.style('stroke', color)	
		.on('click', function(name) {
				var rect = d3.select(this);											
				var enabled = true;																		 
				var totalEnabled = d3.sum(data.map(function(d) {
					return (d.enabled) ? 1 : 0;													 
				}));

				if (rect.attr('class') === 'disabled') {								 
					rect.attr('class', '');															 
				} else {																								 
					if (totalEnabled < 2 && availableRecusion) return;												 
					rect.attr('class', 'disabled');											 
					enabled = false;																			 
				}																											 

				pie.value(function(d) {
					if (d.name === name) {
						d.enabled = enabled;
						cities[name] = enabled;
						if (availableRecusion)
							updateBarLineCharts(name, div);
					}
					return (d.enabled) ? d[sentiment] : 0;										 
				});																										 

				path = path.data(pie(data));												 

				path.transition()																			 
					.duration(750)																				 
					.attrTween('d', function(d) {												 
						var interpolate = d3.interpolate(this._current, d); 
						this._current = interpolate(0);										 
						return function(t) {																 
							return arc(interpolate(t));											 
						};																									 
					});	
		});																											 
				
		legend.append('text')
			.attr('x', legendRectSize + legendSpacing)
			.attr('y', legendRectSize - legendSpacing)
			.text(function(d) { return d; });
}

getCharts();