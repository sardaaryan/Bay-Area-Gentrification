const margin = { top: 20, right: 10, bottom: 40, left: 30 },
  width = 600 - margin.left - margin.right,
  height = 300 - margin.top - margin.bottom;

const svg = d3.select("#streamgraph-container")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

const keys = ["home_value", "income", "rent", "education", "occupancy", "population"];

const labels = {
  home_value: "Median Home Value",
  income: "Median Household Income",
  rent: "Gross Rent",
  education: "Educational Attainment",
  occupancy: "Occupancy Status",
  population: "Population"
};

const color = d3.scaleOrdinal()
  .domain(keys)
  .range([
    "#004d00", // dark green
    "#4169e1", // royal blue
    "#8a2be2", // purple
    "#ffd700", // light yellow
    "#1c3d5a", // dark slate blue
    "#D32F2F"  // red
  ]);

const stack = d3.stack()
  .keys(keys)
  .order(d3.stackOrderNone)
  .offset(d3.stackOffsetWiggle);

const x = d3.scaleLinear().range([0, width]);
const y = d3.scaleLinear().range([height, 0]);

const area = d3.area()
  .x(d => x(d.data.year))
  .y0(d => y(d[0]))
  .y1(d => y(d[1]));

function updateStreamGraph(tractId) {
  const tract = streamData.find(d => d.tract === tractId);
  const layers = stack(tract.yearly);

  x.domain(d3.extent(tract.yearly, d => d.year));
  y.domain([
    d3.min(layers, l => d3.min(l, d => d[0])),
    d3.max(layers, l => d3.max(l, d => d[1]))
  ]);

  // JOIN
  const paths = svg.selectAll("path.layer").data(layers, d => d.key);

  // EXIT
  paths.exit().remove();

  // ENTER + UPDATE
  paths.enter()
    .append("path")
    .attr("class", "layer")
    .attr("fill", d => color(d.key))
    .attr("d", area)
    .merge(paths)
    .transition()
    .duration(750)
    .attr("d", area)
    .attr("fill", d => color(d.key));

  // Remove and redraw axes
  svg.selectAll(".axis").remove();

  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .attr("class", "axis")
    .call(d3.axisBottom(x).tickFormat(d3.format("d")));

  svg.append("g")
    .attr("class", "axis")
    .call(d3.axisLeft(y));
}

function createLegend() {
    const legendContainer = d3.select("#legend-container");
    legendContainer.html(""); // Clear existing legend
  
    legendContainer
      .style("display", "flex")
      .style("flex-wrap", "wrap") // Allows it to break into 2 lines if needed
      .style("justify-content", "center")
      .style("gap", "6px")
      .style("margin-top", "-10px")
      .style("margin-bottom", "25px");
  
    const legendItems = legendContainer.selectAll(".legend-item")
      .data(color.domain())
      .enter()
      .append("div")
      .attr("class", "legend-item")
      .style("display", "flex")
      .style("align-items", "center");
  
    legendItems.append("div")
      .style("width", "14px")
      .style("height", "14px")
      .style("margin-right", "6px")
      .style("background-color", d => color(d))
      .style("border-radius", "2px");
  
    legendItems.append("span")
      .text(d => labels[d])
      .style("font-family", "Helvetica, Arial, sans-serif")
      .style("font-size", "0.75rem")
      .style("color", "#333");
  }
  
// Dropdown
const tractSelect = d3.select("#tract-select");
tractSelect.selectAll("option")
  .data(streamData)
  .enter()
  .append("option")
  .attr("value", d => d.tract)
  .text(d => `Tract ${d.tract}`);

tractSelect.on("change", function () {
  updateStreamGraph(this.value);
});

// Initial render
updateStreamGraph(streamData[0].tract);
createLegend();
