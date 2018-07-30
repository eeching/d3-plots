/* correlationMatrix is invoked to add the svg component for pie chart
  @param {matrixData} matrixData is an JSON object that contains 3 fields
                      * matrixData.productName is an array of product names
                      * matrixData.productCode is an array of code correspond to each product
                      * matrixData.covariance is an 2D array to record the covariance
  @param {number} id is used to uniquely identify the container that this svg component is attached to

  @return {svg} svg contains the correlation matrix plot corresponds to the input data
  */
 function correlationMatrix(data, id) {

    Matrix({
      data: data.covariance,
      product: data.productName,
      label: data.productCode
    })

    function Matrix(options) {
      //define the basic parameters of the svg
      var margin = { top: 20, right: 30, bottom: 110, left: 110 },
        width = 500,
        height = 300,
        startColor = '#ADD5F7',
        endColor = '#056585';

      var data = options.data,
          label = options.label,
          product = options.product;

      //format each number in data as an object to specify the row and column number
      function format(data) {
        let newData = [];
        for (var i = 0; i < data.length; i++) {
          let row = [];
          for (var j = 0; j < data.length; j++) {
            row.push({
              value: data[i][j],
              row: i,
              col: j
            });
          }
          newData.push(row);
        }
        return newData;
      }


      var dataWithCoordinates = format(options.data),
          maxValue = d3.max(data, e => d3.max(e.filter(f => f !== 1), f => f)),
          minValue = d3.min(data, e => d3.min(e.filter(f => f !== 1), f => f)),
          length = data.length;

      //set svg canvas and append it to the correct container
      var tag = '#correlation-matrix-simulate' + id;
      var svg = d3.select(tag).append("svg")
        .attr("width", '90%')
        .attr("height", '100%')
        .attr('viewBox', '0 0 ' + (width + margin.left + margin.right) + ' ' + (height + margin.top + margin.bottom))
        .attr('preserveAspectRatio', 'xMinYMin')
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      var background = svg.append("rect")
        .style("stroke", "#ADADAD")
        .style("stroke-width", "2px")
        .attr("width", width)
        .attr("height", height);

      //scales for x, y and the colorMap
      var x = d3.scale.ordinal()
        .domain(d3.range(length))
        .rangeBands([0, width]);

      var y = d3.scale.ordinal()
        .domain(d3.range(length))
        .rangeBands([0, height]);

      var colorMap = d3.scale.linear()
        .domain([minValue, maxValue])
        .range([startColor, endColor]);

      //add tip box to make the plot interactive
      var tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(function(d) {
          return d.row === d.col ? "" : `${product[d.row]} vs
                         ${product[d.col]} <br/>
                         <center> ${d.value} </center>`;
        })

      svg.call(tip);

      //cell is defined as the rectangle box to indicate the covariance between the 2 products
      var row = svg.selectAll(".row")
        .data(dataWithCoordinates)
        .enter().append("g")
        .attr("class", "row")
        .attr("transform", function(d, i) { return "translate(0," + y(i) + ")"; });

      var cell = row.selectAll(".cell")
        .data(function(d) { return d; })
        .enter().append("g")
        .attr("class", "cell")
        .attr("transform", function(d, i) { return "translate(" + x(i) + ", 0)"; });

      cell.append('rect')
        .attr("width", x.rangeBand())
        .attr("height", y.rangeBand())
        .style("stroke-width", 2)
        .style("stroke", "#ADADAD")
        .on("mouseover", function(d) {//show the cell information only if the cell is not on diagonals
          if (d.col != d.row) {
            tip.show(d, this);
            d3.select(this)
              .attr("fill", "orange");
          }
        })
        .on("mouseout", function(d, i) {//change back to the original color
          tip.hide(d, this);
          d3.select(this).attr('fill', d => d.value === null ? 'white' : colorMap(d));
        });

      //display the covariance on each cell
      cell.append("text")
        .attr("dy", ".32em")
        .attr("x", x.rangeBand() / 2)
        .attr("y", y.rangeBand() / 2)
        .attr("text-anchor", "middle")
        .style("fill", function(d) { return d.value >= maxValue / 2 ? 'white' : '#54585B'; })
        .text(function(d) { return d.value == null ? "" : d.value.toFixed(4); });

      //specify the color to each cell scaled to the covariance of that cell
      row.selectAll(".cell")
        .data(function(d, i) { return data[i]; })
        .attr('fill', d => d === null ? 'white' : colorMap(d));

      var labels = svg.append('g')
        .attr('class', "labels");

      var columnLabels = labels.selectAll(".column-label")
        .data(label)
        .enter().append("g")
        .attr("class", "column-label")
        .attr("transform", function(d, i) { return "translate(" + x(i) + "," + height + ")"; });

      columnLabels.append("line")
        .style("stroke", "black")
        .style("stroke-width", "1px")
        .attr("x1", x.rangeBand() / 2)
        .attr("x2", x.rangeBand() / 2)
        .attr("y1", 0)
        .attr("y2", 5);

      columnLabels.append("text")
        .attr("x", 0)
        .attr("y", y.rangeBand() / 2)
        .attr("dy", ".82em")
        .attr("text-anchor", "end")
        .attr("transform", "rotate(-60)")
        .text(function(d, i) { return d; });

      var rowLabels = labels.selectAll(".row-label")
        .data(label)
        .enter().append("g")
        .attr("class", "row-label")
        .attr("transform", function(d, i) { return "translate(" + 0 + "," + y(i) + ")"; });

      rowLabels.append("line")
        .style("stroke", "black")
        .style("stroke-width", "1px")
        .attr("x1", 0)
        .attr("x2", -5)
        .attr("y1", y.rangeBand() / 2)
        .attr("y2", y.rangeBand() / 2);

      rowLabels.append("text")
        .attr("x", -8)
        .attr("y", y.rangeBand() / 2)
        .attr("dy", ".32em")
        .attr("text-anchor", "end")
        .text(function(d, i) { return d; });

      var y = d3.scale.linear()
        .range([height, 0])
        .domain([minValue, maxValue]);

      var yAxis = d3.svg.axis()
        .scale(y)
        .orient("right");

      return svg;
    }
  }