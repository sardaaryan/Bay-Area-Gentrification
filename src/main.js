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

callout = (g, value) => {
  if (!value) return g.style("display", "none");

  g.style("display", null).style("pointer-events", "auto").style("font", "10px sans-serif");

  const path = g.selectAll("path").data([null]).join("path").attr("fill", "white").attr("stroke", "black");

  const text = g
    .selectAll("text")
    .data([null])
    .join("text")
    .call((text) =>
      text
        .selectAll("tspan")
        .data((value + "").split(/\n/))
        .join("tspan")
        .attr("x", 0)
        .attr("y", (d, i) => `${i * 1.1}em`)
        .style("font-weight", (_, i) => (i ? null : "bold"))
        .html(function (d) {
          return d;
        })
    );

  const { x, y, width: w, height: h } = text.node().getBBox(); // the box that our text is in
  // place the text
  text.attr("transform", `translate(${-w / 2},${15 - y})`);
  path.attr("d", `M${-w / 2 - 10},5H-5l5,-5l5,5H${w / 2 + 10}v${h + 20}h-${w + 20}z`);
};

d3.json("./data/filtered-counties.topo.json").then((topoData) => {
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
      const [x, y] = d3.mouse(this);

      // call the tooltip
      // the .call is used to display what to see when the mouse goes over a state, in this case the name
      tooltip.attr("transform", `translate(${x},${y})`).call(callout, `${name} County`);
    })
    .on("mousemove", (d) => {
      tooltip.call(callout, `${d.properties.name} County`);
    })
    .on("mouseleave", () => tooltip.call(callout, null));

  const tooltip = svg.append("g");

  //yield svg.node();

  svg.append("g").attr("style", "font-family: 'Lato';").attr("transform");
});
