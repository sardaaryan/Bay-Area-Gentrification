// Given a current year and svg container from county.js, render the Bar Chart Visualization
export function renderBarChart(containerId, currentYearData) {
  const svgWidth = 600;
  const svgHeight = 350;
  const margin = { top: 40, right: 30, bottom: 50, left: 70 };
  const width = svgWidth - margin.left - margin.right;
  const height = svgHeight - margin.top - margin.bottom;

  // make the attributes more human-readable, for use in displaying them on the visualization
  const attributeMap = {
    "Total Population" : "Estimate!!Total",
    "Median Home Value": "Median_Home_Value",
    "Median Household Income" : "Median_Household_Income",
    "Vacant Units" : "Vacant Units",
    "Educational Attainment" : "25_Plus_Bachelors_Degree_Or_Higher_Count",
    "Gross Rent" : "Median_Gross_Rent"
  };

  const attributes = Object.keys(attributeMap);

  const color = d3.scaleOrdinal()
    .domain(attributes)
    .range([
      "#004d00",  // dark green
      "#4169e1",  // royal blue
      "#8a2be2",  // purple
      "#ffd700",  // gold
      "#1c3d5a",  // slate blue
      "#D32F2F"   // red
    ]);

  const container = d3.select(containerId);
  container.selectAll("*").remove();

  const svg = container.append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight);

  const chart = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const xScale = d3.scaleBand()
    .domain(attributes)
    .range([0, width])
    .padding(0.2);

  const yScale = d3.scaleLinear().range([height, 0]);

  const xAxisGroup = chart.append("g")
    .attr("transform", `translate(0,${height})`);

  const yAxisGroup = chart.append("g");

  svg.append("text")
    .attr("x", margin.left + width / 2)
    .attr("y", svgHeight - 10)
    .attr("text-anchor", "middle")
    .attr("class", "axis-label")
    .text("Attributes");

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 15)
    .attr("x", -(margin.top + height / 2))
    .attr("text-anchor", "middle")
    .attr("class", "axis-label")
    .text("Median Value");

  const barsData = attributes.map(attr => {
    const key = attributeMap[attr];
    const values = currentYearData.map(d => +d[key]).filter(v => !isNaN(v));
    return { attribute: attr, value: d3.median(values) };
  });

  yScale.domain([0, d3.max(barsData, d => d.value) * 1.1 || 100]);

  const bars = chart.selectAll(".bar")
    .data(barsData, d => d.attribute);

  bars.exit().remove();

  bars.enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", d => xScale(d.attribute))
    .attr("width", xScale.bandwidth())
    .attr("y", yScale(0))
    .attr("height", 0)
    .attr("fill", d => color(d.attribute))
    .merge(bars)
    .transition().duration(300)
    .attr("x", d => xScale(d.attribute))
    .attr("y", d => yScale(d.value))
    .attr("width", xScale.bandwidth())
    .attr("height", d => height - yScale(d.value));

    xAxisGroup.call(d3.axisBottom(xScale));
    yAxisGroup.call(d3.axisLeft(yScale));
}
