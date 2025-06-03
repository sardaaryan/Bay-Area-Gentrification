const county = window.location.search.replace("%20", " ").substr(1);
//const year = yearSlider.value;
const width = 960, height = 600;
const countyids = {
    "Alameda":"06001",
    "Contra Costa":"06013",
    "Marin":"06041",
    "Napa":"06055",
    "San Francisco":"06075",
    "San Mateo":"06081",
    "Santa Clara":"06085",
    "Solano":"06095",
    "Sonoma":"06097"    
};
document.getElementById("county_display").textContent = county + " County Heatmap";

// Select SVG and define projection/path
const svg = d3.select("#heatmap").attr("viewBox", `0 0 ${width} ${height}`);
const projection = d3.geoAlbers();
const path = d3.geoPath().projection(projection);
//draw regions

//get county tract topo json file  
const tractfile = "../data/tracts/"+countyids[county]+".topo.json";
d3.json(tractfile).then((topoData) => {
  // Convert TopoJSON to GeoJSON FeatureCollection
  const tracts = topojson.feature(topoData, topoData.objects.tracts || Object.values(topoData.objects)[0]);
  // Fit projection to features
  projection.fitSize([width, height], tracts);

  // Draw counties
  svg
    .selectAll("path")
    .data(tracts.features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("fill", "#69b3a2")
    .attr("stroke", "#fff")
    .attr("stroke-width", 0.5)


  svg.append("g")
    .attr("style", "font-family: 'Lato';");
});

const slider = document.getElementById("yearSlider");
const yearSlider = document.getElementById("selected-year");

slider.addEventListener("input", () => {
  yearSlider.textContent = slider.value;
});

//calculate gentrification for current year
//using the function genScore() from heatmap.js
//color regions