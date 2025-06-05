// Constants
const width = 960, height = 600;
const bayAreaCountyIDs = [6001, 6013, 6041, 6055, 6075, 6081, 6085, 6095, 6097];

// Select SVG and define projection/path
const svg = d3.select("#map").attr("viewBox", `0 0 ${width} ${height}`);
const projection = d3.geoAlbers().scale(1).translate([width, height]);
const path = d3.geoPath().projection(projection);

// Define tooltip
//const tooltip = svg.append("g").style("pointer-events", "none");
const htmlTooltip = d3.select("#tooltip");

//callout function
function callout(g, value){
  if (!value) return g.style("display", "none");

  g.style("display", null)
    .style("font", "10px sans-serif")
    .attr("text-anchor", "middle");

  // Fixed dimensions for the tooltip background
  const paddingX = 6;
  const paddingY = 4;
  const boxWidth = 120;
  const boxHeight = 30;

  // Add or update background rectangle
  g.selectAll("rect")
    .data([null])
    .join("rect")
    .attr("x", -boxWidth / 2)
    .attr("y", -boxHeight)
    .attr("width", boxWidth)
    .attr("height", boxHeight)
    .attr("fill", "white")
    .attr("stroke", "black")
    .attr("rx", 4);

  // Add or update text label
  g.selectAll("text")
    .data([null])
    .join("text")
    .attr("y", -boxHeight / 2 + 5)
    .style("font-weight", "bold")
    .text(value).style("font", "12px 'Libre Baskerville', serif");

};

d3.json("../data/filtered-counties.topo.json").then((topoData) => {
  // Convert TopoJSON to GeoJSON FeatureCollection
  const counties = topojson.feature(topoData, topoData.objects.counties || Object.values(topoData.objects)[0]);

  // Fit projection to features
  projection.fitSize([width, height], counties);

  // Draw counties
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
      const name = d.properties.name;

      d3.select(this)
        .attr("fill", "#B3697A"); // Highlight color

      htmlTooltip
        .style("opacity", 1)
        .html(`${name} County`);
    })
    .on("mousemove", function () {
      htmlTooltip
        .style("left", (d3.event.pageX + 25) + "px")
        .style("top", (d3.event.pageY + 25) + "px");
    })
    .on("mouseout", function () {
      d3.select(this)
        .attr("fill", "#69b3a2"); // Reset to original color

      htmlTooltip.style("opacity", 0);
    })
    .on('click', function(d) {
        const name = d.properties.name;
        window.open(`../county/county.html?${name}`, "_self"); // Opens county.html and queries county name
    });

  // Add county names as a separate SVG group so they are always on top
  svg.append("g")
    .attr("class", "county-labels")
    .selectAll("text")
    .data(counties.features)
    .enter()
    .append("text")
    .attr("x", d => {
      const centroid = path.centroid(d);
      return centroid[0];
    })
    .attr("y", d => {
      const centroid = path.centroid(d);
      return centroid[1];
    })
    .attr("text-anchor", "middle")
    .attr("alignment-baseline", "central")
    .attr("pointer-events", "none")
    .attr("class", "county-label")
    .text(d => d.properties.name === "San Francisco" ? "SF" : d.properties.name);

  //yield svg.node();

  svg.append("g").attr("style", "font-family: 'Lato';").attr("transform");
});
