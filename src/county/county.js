const county = window.location.search.replace("%20", " ").substr(1);
let year = yearSlider.value;
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

let data = []; //data has all data for current county across all years
let yearData = []; //data filtered to current year on year slider
let tractData = []; //data filtered to specific tract based on heatmap click

const attributeFiles = [
  { file: "../data/edu_attain.csv", column: "25_Plus_Bachelors_Degree_Or_Higher_Count" },
  { file: "../data/gross_rent.csv", column: "Median_Gross_Rent" },
  { file: "../data/home_value.csv", column: "Median Value" },
  { file: "../data/house_income.csv", column: "Median_Household_Income" },
  { file: "../data/total_pop.csv", column: "Estimate!!Total" },
];

const occFile = "../data/occ_status.csv"; // has: Total Housing Units, Vacant Units
const filteredData = new Map(); // key = TractID_Year

//HELPER FUNCTIONS

function updateyearData() {
  yearData = data.filter((d) => d.Year === year);
}

function updateTractTimeSeries(tractID) {
  tractTimeSeries = data
    .filter(d => d["Tract ID"] === tractID)
    .sort((a, b) => +a.Year - +b.Year);
  console.log(tractTimeSeries);
}

// Load and merge all CSVs
Promise.all([...attributeFiles.map((d) => d3.csv(d.file)), d3.csv(occFile)]).then(([edu, rent, homeVal, income, totalPop, occStatus]) => {
  const datasets = [edu, rent, homeVal, income, totalPop];
  const keys = attributeFiles.map((d) => d.column);

  // Merge all single-attribute datasets
  datasets.forEach((data, i) => {
    data.forEach((d) => {
      if (d.County === county) {
        const key = `${d["Tract ID"]}_${d["Year"]}`;
        if (!filteredData.has(key)) {
          filteredData.set(key, {
            "Tract ID": d["Tract ID"],
            Year: d["Year"],
          });
        }
        filteredData.get(key)[keys[i]] = d[keys[i]];
      }
    });
  });

  // Merge occ_status (multiple columns)
  occStatus.forEach((d) => {
    if (d.County === county) {
      const key = `${d["Tract ID"]}_${d["Year"]}`;
      if (!filteredData.has(key)) {
        filteredData.set(key, {
          "Tract ID": d["Tract ID"],
          Year: d["Year"],
        });
      }
      const entry = filteredData.get(key);
      entry["Total Housing Units"] = d["Total Housing Units"];
      entry["Vacant Units"] = d["Vacant Units"];
      entry["Occupied Units"] = (+d["Total Housing Units"] || 0) - (+d["Vacant Units"] || 0);
    }
  });

  // Convert to global array
  data = Array.from(filteredData.values());
  updateyearData();
  init();
});

document.getElementById("county_display").textContent = county + " County Heatmap";

// Select SVG and define projection/path
const svg = d3.select("#heatmap").attr("viewBox", `0 0 ${width} ${height}`);
const projection = d3.geoAlbers();
const path = d3.geoPath().projection(projection);

//get county tract topo json file
const tractfile = "../data/tracts/" + countyids[county] + ".topo.json";

//CALL ALL VISUALIZATION FUNCTIONS HERE
function init() { 
  //draw regions
  d3.json(tractfile).then((topoData) => {
    // Convert TopoJSON to GeoJSON FeatureCollection
    const tracts = topojson.feature(topoData, topoData.objects.tracts || Object.values(topoData.objects)[0]);
    // Fit projection to features
    projection.fitSize([width, height], tracts);
    
    tracts.features.sort((a, b) => +a.properties.id - +b.properties.id);
    console.log(tracts);
    // Draw counties
    svg.selectAll("path").data(tracts.features).enter().append("path").attr("d", path).attr("fill", "#69b3a2").attr("stroke", "#fff")
        .attr("stroke-width", 0.5)
        .on('click', function(d) {
            updateTractTimeSeries(d.properties.id.substr(5, 4))
        });

    svg.append("g").attr("style", "font-family: 'Lato';");
  });
}

yearSlider.onchange = function(){year = yearSlider.value; updateyearData(); console.log(year, yearData);};
//calculate gentrification for current year
//using the function genScore() from heatmap.js
//color regions
