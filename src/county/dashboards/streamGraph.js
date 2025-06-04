// streamGraph.js
const margin = { top: 20, right: 10, bottom: 40, left: 30 };
const width = 600 - margin.left - margin.right;
const height = 300 - margin.top - margin.bottom;

// Note: `tractData` has our CSV names, so we use attributeMap to alias readable names to actual keys
const attributeMap = {
  home_value: "Median_Home_Value",
  income: "Median_Household_Income",
  rent: "Median_Gross_Rent",
  education: "25_Plus_Bachelors_Degree_Or_Higher_Count",
  occupancy: "Vacant Units",
  population: "Estimate!!Total"
};

const keys = ["home_value", "income", "rent", "education", "occupancy", "population"];
const labels = {
  home_value: "Median Home Value",
  income: "Median Household Income",
  rent: "Gross Rent",
  education: "Educational Attainment",
  occupancy: "Vacant Units",
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

let svg, x, y, area, stack;
let isInitialized = false;

function initializeStreamGraph() {
  if (isInitialized) return;
  
  // Clear any existing content
  d3.select("#streamgraph-container").selectAll("*").remove();
  
  svg = d3.select("#streamgraph-container")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  stack = d3.stack()
    .keys(keys)
    .order(d3.stackOrderNone)
    .offset(d3.stackOffsetWiggle);

  x = d3.scaleLinear().range([0, width]);
  y = d3.scaleLinear().range([height, 0]);

  area = d3.area()
    .x(function(d) { return x(d.data.Year); })
    .y0(function(d) { return y(d[0]); })
    .y1(function(d) { return y(d[1]); });

  createLegend();
  showPrompt();
  isInitialized = true;
}

function showPrompt() {
  svg.selectAll("*").remove();
  
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height / 2)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "central")
    .style("font-family", "Helvetica, Arial, sans-serif")
    .style("font-size", "16px")
    .style("fill", "#666")
    .text("Click on a census tract to inspect its attributes over the years");
}

function updateStreamGraph(tractData) {
  console.log("tractData sample:", tractData[0]);
  if (!isInitialized) {
    initializeStreamGraph();
  }
  
  if (!tractData || tractData.length === 0) {
    showPrompt();
    return;
  }

  // Transform tractData to the format expected by the stack generator
  const processedData = tractData.map(function(d) {
    return {
      Year: +d.Year,
      home_value: +d[attributeMap.home_value] || 0,
      income: +d[attributeMap.income] || 0,
      rent: +d[attributeMap.rent] || 0,
      education: +d[attributeMap.education] || 0,
      occupancy: +d[attributeMap.occupancy] || 0,
      population: +d[attributeMap.population] || 0
    };
  });

  const layers = stack(processedData);
  
  x.domain(d3.extent(processedData, function(d) { return d.Year; }));
  y.domain([
    d3.min(layers, function(l) { return d3.min(l, function(d) { return d[0]; }); }),
    d3.max(layers, function(l) { return d3.max(l, function(d) { return d[1]; }); })
  ]);

  // Clear previous content
  svg.selectAll("*").remove();

  // JOIN
  const paths = svg.selectAll("path.layer").data(layers, function(d) { return d.key; });

  // ENTER + UPDATE
  paths.enter()
    .append("path")
    .attr("class", "layer")
    .attr("fill", function(d) { return color(d.key); })
    .attr("d", area)
    .style("opacity", 0)
    .transition()
    .duration(750)
    .style("opacity", 1);

  // Add axes
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .attr("class", "axis")
    .call(d3.axisBottom(x).tickFormat(d3.format("d")))
    .style("font-family", "Helvetica, Arial, sans-serif")
    .style("font-size", "12px");

  svg.append("g")
    .attr("class", "axis")
    .call(d3.axisLeft(y))
    .style("font-family", "Helvetica, Arial, sans-serif")
    .style("font-size", "12px");
}

function createLegend() {
  const legendContainer = d3.select("#legend-container");
  legendContainer.html(""); // Clear existing legend

  legendContainer
    .style("display", "flex")
    .style("flex-wrap", "wrap")
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
    .style("background-color", function(d) { return color(d); })
    .style("border-radius", "2px");

  legendItems.append("span")
    .text(function(d) { return labels[d]; })
    .style("font-family", "Helvetica, Arial, sans-serif")
    .style("font-size", "0.75rem")
    .style("color", "#333");
}

// Export functions
export { initializeStreamGraph, updateStreamGraph };
