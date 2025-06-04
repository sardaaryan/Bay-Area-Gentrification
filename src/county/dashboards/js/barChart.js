const svgWidth = 500;
const svgHeight = 350;
const margin = { top: 30, right: 30, bottom: 80, left: 70 };
const width = svgWidth - margin.left - margin.right;
const height = svgHeight - margin.top - margin.bottom;

const attributes = [
  "25_Plus_Bachelors_Degree_Or_Higher_Count",
  "Median_Gross_Rent",
  "Median Value",
  "Median_Household_Income",
  "Estimate!!Total",
  "Vacant Units"
];

const attributeRenameMap = {
  "25_Plus_Bachelors_Degree_Or_Higher_Count": "Educational Attainment",
  "Median_Gross_Rent": "Gross Rent",
  "Median Value": "Median Home Value",
  "Median_Household_Income": "Median Household Income",
  "Estimate!!Total": "Population",
  "Vacant Units": "Occupancy Status"
};
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

const svg = d3.select("#barchart-container")
  .html("")  // Clear any existing content
  .append("svg")
  .attr("width", svgWidth)
  .attr("height", svgHeight);

const chart = svg.append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

const xScale = d3.scaleBand()
  .domain(attributes)
  .range([0, width])
  .padding(0.2);

const yScale = d3.scaleLinear()
  .range([height, 0]);

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


export function getMedians(yearData) {
  const medians = {};

  attributes.forEach(attr => {
    const values = yearData
      .map(d => +d[attr])
      .filter(v => !isNaN(v)); // ignore nulls and invalid numbers

    values.sort((a, b) => a - b);
    const mid = Math.floor(values.length / 2);

    medians[attr] = values.length % 2 === 0
      ? (values[mid - 1] + values[mid]) / 2
      : values[mid];
  });

  return medians;
}
export function renderBarChart(data) {
  if (!data || data.length === 0) {
    console.warn("No data to render.");
    chart.selectAll(".bar").remove();
    yAxisGroup.call(d3.axisLeft(yScale));
    xAxisGroup.call(d3.axisBottom(xScale));
    return;
  }

  const barsData = attributes.map(attr => {
    const values = data.map(d => +d[attr]).filter(v => !isNaN(v));

    return {
      attribute: attr,
      value: d3.mean(values)
    };
  });

  yScale.domain([0, d3.max(barsData, d => d.value) * 1.1 || 100]);

  const bars = chart.selectAll(".bar")
    .data(barsData, d => d.attribute);

  bars.exit().remove();

  bars.transition()
    .duration(300)
    .attr("x", d => xScale(d.attribute))
    .attr("y", d => yScale(d.value))
    .attr("width", xScale.bandwidth())
    .attr("height", d => height - yScale(d.value));

  bars.enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", d => xScale(d.attribute))
    .attr("y", d => yScale(0))
    .attr("width", xScale.bandwidth())
    .attr("height", 0)
    .attr("fill", d => color(d.attribute))
    .transition()
    .duration(300)
    .attr("y", d => yScale(d.value))
    .attr("height", d => height - yScale(d.value));

  xAxisGroup.call(d3.axisBottom(xScale).tickFormat(d => attributeRenameMap[d] || d))
    .selectAll("text")
    .each(function(d) {
      const label = attributeRenameMap[d] || d;
      const words = label.split(" ");

      if (words.length > 1) {
        d3.select(this).text("");
        words.forEach((word, i) => {
          d3.select(this).append("tspan")
            .text(word)
            .attr("x", 0)
            .attr("dy", i === 0 ? "1.0em" : "1.0em")
            .attr("text-anchor", "middle");
        });
      } else {
        d3.select(this).attr("dy", "1.0em");
      }
    });

  yAxisGroup.call(d3.axisLeft(yScale));
}
