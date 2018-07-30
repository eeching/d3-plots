function pieChart(data, id) {

    Pie({
      data: data
    })

    function Pie(options) {
      //format the data input to an array of objects
      var data = format(options.data);

      /* This function format the input data into a single array of JSON object so it can be plotted by d3.pie()
         @params {matrixData}
         @return {[product JSON object]} each JSON object = {
                                                    product: 'product name',
                                                    value: 'product value',
                                                    percentage: 'product percentage',
                                                    id: 'product id'
                                                    }
      */
      function format(raw_data) {
        var product = raw_data.product,
            value = raw_data.value,
            percentage = raw_data.percentage,
            length = product.length,
            data = [];
        for (var i = 0; i < length; i++) {
          var new_object = {
            identity: product[i],
            Value: value[i],
            percentage: (percentage[i] * 100).toFixed(2),
            id: i
          }
          data.push(new_object);
        }
        return data;
      }

      //define the default parameters of the svg canvas
      var width = 300,
        height = 300,
        margin = { top: 30, right: 30, bottom: 30, left: 30 },
        radius = width / 2,
        legendRectSize = 18,
        legendSpacing = 4,
        startColor = '#ADD5F7',
        endColor = '#056585',
        radius = Math.min(width, height) / 2;

      //this tag uniquely identifies the container this svg component is attached to
      var tag = '#pie-chart-simulate' + id;
      //ratio is used to allow auto resize of the plot as the panel is resized
      var svg = d3.select(tag).append("svg")
        .attr("width", '70%')
        .attr("height", '100%')
        .attr('viewBox', '0 0 ' + width + ' ' + height)
        .attr('preserveAspectRatio', 'xMinYMin meet')
        .append("g")
        .attr("transform", "translate(" + (width / 2) + "," + height / 2 + ")");

      data.forEach(function(item) {
        item.enabled = true;
      });

      //customized color range between the start and end color for each id
      var colorMap = d3.scale.linear()
        .interpolate(d3.interpolateHcl)
        .domain([0,data.length-1])
        .range([startColor, endColor]);

      //add the arc and pie chart using d3 library
      var arc = d3.svg.arc()
        .outerRadius(radius * 0.9)
        .innerRadius(radius * 0.6);

      var pie = d3.layout.pie()
        .sort(null)
        .value(function(d) { return d.Value; });

      //tooltip is added to make the d3 plot interactive
      var tooltip = d3.select(tag)
        .append('div')
        .attr('class', 'tooltip');

      //append all the fields that need to be shown to the tooltip so they can be selected later for display
      tooltip.append('div')
        .attr('class', 'identity');

      tooltip.append('div')
        .attr('class', 'Value');

      tooltip.append('div')
        .attr('class', 'percentage');

      var path = svg.selectAll('path')
        .data(pie(data))
        .enter()
        .append('path')
        .attr('d', arc)
        .attr('fill', function(d, i) {
          return colorMap(d.data.id);
        })
        .each(function(d) { this._current = d; });

      //specify the event when the mouse is on the piechart
      //this function specify the text to be displayed
      path.on('mouseover', function(d) {
        tooltip.select('.identity').html(d.data.identity).style('color', 'white');
        tooltip.select('.Value').html(d.data.Value);
        tooltip.select('.percentage').html(d.data.percentage + '%');
        tooltip.style('display', 'block');
        tooltip.style('opacity', 2);
      });

      //this function allows the tooltip box to move along with the mouse
      path.on('mousemove', function(d) {
        tooltip.style('top', (d3.event.layerY + 10) + 'px')
               .style('left', (d3.event.layerX - 25) + 'px');
      });

      //define the event when the mouse move out
      path.on('mouseout', function() {
        tooltip.style('display', 'none');
        tooltip.style('opacity', 0);
      });

      //add the legend to the center of the pie chart
      var legend = svg.selectAll('.legend')
        .data(data)
        .enter()
        .append('g')
        .attr('class', 'legend')
        .attr('transform', function(d, i) {
          var height = legendRectSize + legendSpacing;
          var offset = height * data.length / 2;
          var horz = -2 * legendRectSize;
          var vert = i * height - offset;
          return 'translate(' + horz + ',' + vert + ')';
        });

      legend.append('rect')
        .attr('width', legendRectSize)
        .attr('height', legendRectSize)
        .style('fill', function(d) { return colorMap(d['id']); })
        .style('stroke', function(d) { return colorMap(d['id']); });

      legend.append('text')
        .attr('x', legendRectSize + legendSpacing)
        .attr('y', legendRectSize - legendSpacing)
        .text(function(d) { return d.identity; })
        .attr("font-size", "(width*0.05)px");

      return svg;
    }
  }
