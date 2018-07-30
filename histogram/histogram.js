/* histogram is invoked to add the svg component for the Value at Risk model
  @param {varData} matrixData is an JSON object that contains 6 fields
          * confidenceInterval : a number between 0 and 1 that specifies the confidence level
          * prices : a number array that specify the prices;
          * binSize: a number that specifies the binSize of the histogram;
          * interpolate: indicate the type of interpolation;
          * shortfall_value: computed shortfall value;
          * var_value: computed VaR value;
  @param {number} id is used to uniquely identify the container that this svg component is attached to

  @return {svg} svg contains the histogram plot corresponds to the input data
  */
  histogram(data, id) {
    //retrieve data from the component
    var binSize = data.binSize,
        levelOfSig = 1 - data.confidenceInterval,
        map = data.prices,
        interpolate = data.interpolate,
        shortfall_value = data.shortfall_value,
        var_value = data.var_value,
        tag = '#histogram-simulate' + id;

    //define the parameter of the svg canvas
    var margin = { top: 40, right: 50, bottom: 60, left: 50 },
        width = 600,
        height = 300,
        svg = d3.select(tag).append("svg")
        .attr("width", '100%')
        .attr("height", '100%')
        .attr('viewBox', '0 0 ' + (width + margin.left + margin.right) + ' ' + (height + margin.top + margin.bottom))
        .attr('preserveAspectRatio', 'xMinYMin')
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    var histogram = d3.layout.histogram()
      .bins(binSize)
      (map)

    //this is used to add the culmulative probability for each bin
    function format(his) {
        his[0]["culY"] = his[0]["y"];
        his[0]["percentage"] = his[0]["culY"] / map.length;
        for (var i = 1; i < binSize; i++) {
          his[i]["culY"] = his[i - 1]["culY"] + his[i]["y"];
          his[i]["percentage"] = his[i]["culY"] / map.length;
        }
        return his;
    }
    //the formatted histogram is an array of JSON object with the culmulative probability
    histogram = format(histogram);
    var max = d3.max(map),
        min = d3.min(map),
        interval = (max - min) / binSize;
    //this is the scale for x
    var x = d3.scale.linear()
      .domain([min, max])
      .range([0, width]);
    //this is the scale for frequency
    var y0 = d3.scale.linear()
      .domain([0, d3.max(histogram.map(function(i) { return i.length; }))]).nice()
      .range([height, 0]);
    //this is the scale for culmulative probability
    var y1 = d3.scale.linear()
      .domain([0, 1])
      .range([height, 0])
      .nice();
    //yMax is the maximum frequency, yMin is the minimum frequency
    var yMax = d3.max(histogram.map(function(i) { return i.length; }));
    var yMin = d3.min(histogram.map(function(i) { return i.length; }));

    //invoke BarChart to plot the main histogram
    BarChart({
      data: histogram,
      x: x,
      y: y0,
      interval: interval,
      cutOff: cutOffIndex(histogram, levelOfSig),
      max: yMax,
      min: yMin
    });
    //invoke Probability to plot the line for culmulative probability
    Probablity({
      data: histogram,
      xScale: x,
      yScale: y1,
    });
    //invoke CutOffLine to draw the line at confidence interval specified
    CutOffLine({
      data: histogram,
      scale: x
    });
   //invoke Axis to plot the x and y axis for the bar chart
    Axis({
      data: histogram,
      xScale: x,
      yScale: y0
    });
   //invoke Title to add title to the plot
    Title({
    })
    return svg;

    function BarChart(options) {

      var data = options.data,
        x = options.x,
        y = options.y,
        cutOff = options.cutOff,
        interval = options.interval,
        max = options.max,
        min = options.min;

      //add interactive tip box and the text on check tipbox
      var tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(function(d) {
          return `<center>Frequency: ${d.y}</center> </br>
                           <center>x:   from ${d.x.toFixed(2)} to ${(d.x + d.dx).toFixed(2)}</center>`;
        })

      svg.call(tip);

      //define bars of the bar chart
      var bars = svg.selectAll(".bar")
        .data(data)
        .enter()
        .append("g")

      bars.append("rect")
        .attr("x", function(d) { return x(d.x); })
        .attr("y", function(d) { return y(d.y); })
        .attr("width", x(min + interval) - x(min))
        .attr("height", function(d) { return height - y(d.y); })
        .attr("stroke", "#ADADAD")
        .attr("stroke_width", "2")
        //use two different color for the bars on the two sides of the cutoff line
        .attr("fill", function(d, i) { return i < cutOff ? "crimson" : "steelblue"; })
        .on("mouseover", function(d, i) {
          d3.select(this)
            .attr("fill", function() { return i < cutOff ? "#AA0000" : "#3E606F"; });
          tip.show(d, this);
        })
        .on("mouseout", function(d, i) {
          d3.select(this).attr("fill", function() {
            return i < cutOff ? "crimson" : "steelblue";
          });
          tip.hide(d);
        });

    }

    function Probablity(options) {

      var x = options.xScale,
          y = options.yScale,
          data = options.data,
          formatPercent = d3.format(".0%"),
          color = "#11625B";

      // define the line
      var valueline = d3.svg.line()
        .interpolate(interpolate)
        .x(function(d) { return x(d.x + d.dx / 2); })
        .y(function(d) { return y(d.percentage); });

      var axis = d3.svg.axis()
        .scale(y)
        .orient("right")
        .tickFormat(formatPercent);;

      //add the defined value line to the svg
      svg.append("path")
        .datum(data)
        .attr("class", "line")
        .style("stroke", color)
        .attr("fill", "transparent")
        .attr("d", valueline
        );

      var yaxis = svg.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(" + width + ", 0)")
        .call(axis);

      //define interactive tool box for the culmulative prob line
      var tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(function(d) {
          return "<strong>x:</strong> <span>" + d.x.toFixed(2) + "</span></br>" +
            "<strong>percentage:</strong> <span>" + (d.percentage * 100).toFixed(2) + "%</span>";
        })

      svg.call(tip);

      svg.selectAll("dot")
        .data(data)
        .enter().append("circle")
        .attr("r", 1)
        .attr("cx", function(d) { return x(d.x + d.dx / 2); })
        .attr("cy", function(d) { return y(d.percentage); })
        .on("mouseover", function(d, i) {
          d3.select(this)
            .attr({ "fill": "orange", "r": 3 });
          tip.show(d, this);
        })
        .on("mouseout", function(d, i) {
          d3.select(this).attr({ "fill": "black", "r": 1 });
          tip.hide(d);
        });


      var yLabel = svg.append("text")
        .attr("transform", "rotate(90)")
        .attr("y", 0 - width - margin.left)
        .attr("x", height / 2)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Culmulative Probablity");
    };

    //this function find the index of the bar that contains the cuttoff line
    function cutOffIndex(data, levelOfSig) {
      var index = 0;
      for (var i = 0; i < data.length; i++) {
        if (data[i].percentage > levelOfSig) {
          index = i;
          break;
        }
      }
      return index;
    }

    function CutOffLine(options) {
      var data = options.data,
          scale = options.scale,
          index = cutOffIndex(data, levelOfSig);

      //add the cutoff line to the svg
      var cutOff = svg.append("g")
        .append("line")
        .attr("x1", scale(data[index].x))
        .attr("x2", scale(data[index].x))
        .attr("y1", 0)
        .attr("y2", height)
        .attr("stroke", "crimson")
        .attr("stroke-width", 3);


      var stroke = svg.append("g")
        .append("line")
        .attr("x1", scale(data[index].x))
        .attr("x2", scale(data[index].x) + 5)
        .attr("y1", height / 2)
        .attr("y2", height / 2 + 5)
        .attr("stroke", "crimon")
        .attr("stroke-width", 1);

      // add text to the cutoff line to specify the VaR value
      svg.append("text")
        .attr("transform", "translate(" + (scale(data[index].x) - 5) + ", " + (height / 2 + 5) + ")")
        .attr("fill", "crimson")
        .attr("dy", "1em")
        .attr("text-anchor", "end")
        .attr("font-size", "15px")
        .attr("font-weight", "bold")
        .html(function() {
          return `VaR value: ${var_value.toFixed(2)}`
        });
      // add text to the cutoff line to specify the shortfall value
      svg.append("text")
        .attr("transform", "translate(" + (scale(data[index].x) - 5) + ", " + (height / 2 + 5) + ")")
        .attr("fill", "crimson")
        .attr("dy", "2em")
        .attr("text-anchor", "end")
        .attr("font-size", "15px")
        .attr("font-weight", "bold")
        .html(function() {
          return `Shortfall value: ${shortfall_value.toFixed(2)}`
        });
    };

    function Axis(options) {

      var x = options.xScale,
          y = options.yScale,
          data = options.data;

      var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

      var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left");

      var xaxis = svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

      var yaxis = svg.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(0, 0)")
        .attr("stroke-width", "1px")
        .call(yAxis);

      var xLabel = svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.top)
        .style("text-anchor", "middle")
        .text("Profit and Loss");

      var yLabel = svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Frequency");
    }

    function Title(options) {

      svg.append("text")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .style("text-anchor", "middle")
        .attr("font-size", "15px")
        .text("Value at Risk " + (levelOfSig * 100).toFixed(2) + "%");

    }
  }

}
