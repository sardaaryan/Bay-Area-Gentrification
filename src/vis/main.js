// Select the SVG
const svg = d3.select("#map");

// Width and height must match the viewBox in index.html
const width = 960;
const height = 600;

// Define a projection and path generator
const projection = d3
  .geoAlbers()
  .translate([width, height]) // temporary, will be adjusted later
  .scale(1); // temporary scale

const path = d3.geoPath().projection(projection);

//bayAreaCountyIDs
const bayAreaCountyIDs = [6001, 6013, 6041, 6055, 6075, 6081, 6085, 6095, 6097];

const tooltip = svg.append("g").attr("class", "tooltip").style("position", "absolute").style("padding", "8px").style("background", "rgba(0,0,0,0.7)").style("color", "#fff").style("border-radius", "4px").style("pointer-events", "none").style("font-size", "12px").style("opacity", 0);

d3.json("./data/filtered-counties.json").then((topoData) => {
  // Convert TopoJSON to GeoJSON FeatureCollection
  const counties = topojson.feature(topoData, topoData.objects.counties || Object.values(topoData.objects)[0]);

  // Fit projection to features
  projection.fitSize([width, height], counties);

  // Draw counties
  svg.selectAll("path").data(counties.features).enter().append("path").attr("d", path).attr("fill", "#69b3a2").attr("stroke", "#fff").attr("stroke-width", 0.5);

  svg
    .selectAll("path")
    .data(counties.features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("fill", "#69b3a2")
    .attr("stroke", "#fff")
    .attr("stroke-width", 0.5)
    .on("mouseover", function (d) {
      tooltip.html(`${d.properties.name}`);

      d3.select(this).attr("fill", "#2c7fb8");
    })
    .on("mousemove", function () {
      tooltip.style("left", d3.event.pageX + 10 + "px").style("top", d3.event.pageY - 20 + "px");
    })
    .on("mouseout", function () {
      tooltip.transition().duration(200).style("opacity", 0);
    });
});
