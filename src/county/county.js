import { genScore} from "./dashboards/heatmap.js";
import { updateAnnotationsForYear } from './dashboards/annotations.js';
import { renderBarChart } from './dashboards/barChart.js';
import { initializeStreamGraph, updateStreamGraph } from './dashboards/streamGraph.js';
import { countyids, attributeFiles, allAnnotations } from './values.js';

const county = window.location.search.replace("%20", " ").substr(1);

let year = yearSlider.value;

const width = 960, height = 600;

let data = []; //data has all data for current county across all years. ALL DATA FOR COUNTY
let yearData = []; //data filtered to current year on year slider. HEATMAP + BAR CHART
let prevYearData = [] //data filtered for current year
let tractData = []; //data filtered to specific tract based on heatmap click. STREAM GRAPH
let selectedTractId = null; // Track currently selected tract

const filteredData = new Map(); // key = TractID_Year

//HELPER FUNCTIONS
function updateyearData() {
  yearData = data.filter((d) => String(d.Year) === String(year));
  if (String(year) === "2010") {
    prevYearData = [];
  } else {
    prevYearData = data.filter((d) => String(d.Year) === String(Number(year) - 1));
  }
}

function updateTractTimeSeries(tractID) {
  selectedTractId = tractID;
  
  // Debug: Log the tract ID and available tract IDs in data
  console.log("Selected tract ID:", tractID);
  console.log("Available tract IDs in data:", [...new Set(data.map(d => d["Tract ID"]))].slice(0, 10));
  
  tractData = data
    .filter(d => d["Tract ID"] === tractID)
    .sort((a, b) => +a.Year - +b.Year);
  
  console.log("Filtered tract data:", tractData.length, "records");
  
  // Update stream graph with new tract data
  updateStreamGraph(tractData);
  
  // Highlight selected tract
  highlightSelectedTract(tractID);
}

function highlightSelectedTract(tractID) {
  // Reset all tract styles
  svg.selectAll("path")
    .attr("stroke", "#222")
    .attr("stroke-width", 0.5)
    .style("opacity", 1);
  
  // Highlight selected tract
  if (tractID) {
    svg.selectAll("path")
      .filter(function(d) {
        if (!d || !d.properties) return false;
        let id = d.properties.id;
        if (typeof id === 'string' && id.length > 5) {
            id = id.substr(5).trim();
        } else if (d.properties.GEOID) {
            id = d.properties.GEOID.toString().substr(5).trim();
        } else if (d.properties.tractce || d.properties.TRACTCE) {
            id = (d.properties.tractce || d.properties.TRACTCE).toString();
        }
        return id === tractID;
      })
      .attr("stroke", "#000")
      .attr("stroke-width", 2.5)
      .style("opacity", 1);
    
    // Dim other tracts slightly
    svg.selectAll("path")
      .filter(function(d) {
        if (!d || !d.properties) return false;
        let id = d.properties.id;
        if (typeof id === 'string' && id.length > 5) {
            id = id.substr(5).trim();
        } else if (d.properties.GEOID) {
            id = d.properties.GEOID.toString().substr(5).trim();
        } else if (d.properties.tractce || d.properties.TRACTCE) {
            id = (d.properties.tractce || d.properties.TRACTCE).toString();
        }
        return id !== tractID;
      })
      .style("opacity", 0.8);
  }
}

function preprocessTractID(id){
    if(id.length == 3) return '0'+id+'00';
    if(id.length == 4) return id+'00';
    if(id.length == 5) return '0'+id;
    return id.replace(".", "");
}

//Helpers for heatmap
function updateregions(scores) {
  // D3 v5 color scale for reds
  const colorScale = d3.scaleSequential()
    .domain([0, d3.max(scores, d => d && typeof d.score === "number" ? d.score : 0) || 1])
    .interpolator(d3.interpolateReds);

  svg.selectAll("path")
    .attr("fill", function(d) {
      if (!d || !d.properties) return "#fff";
      const tractId = d.properties.id.substr(5).trim();
      const scoreObj = scores.find(s => s.tractId === tractId);
      if (scoreObj && typeof scoreObj.score === "number" && scoreObj.score > 0) {
        return colorScale(scoreObj.score);
      } else if (scoreObj && typeof scoreObj.score === "undefined") {
        return "#ccc"; // Gray for incomplete data
      } else {
        return "#fff"; // White for no gentrification or missing
      }
    })
    .attr("stroke", "#222") 
    .attr("stroke-width", 0.5);
  
  // Maintain selected tract highlighting after color update
  if (selectedTractId) {
    highlightSelectedTract(selectedTractId);
  }
}

//calculate gentrification for current year
function updateheatmap() {
  updateyearData();
  if (prevYearData.length > 0) {
    const scores = genScore(prevYearData, yearData); 
    //console.log("scores ",scores);
    updateregions(scores);
    
  } else {
    const scores = []; // no valid data
    updateregions(scores);
  }
}

// Load and merge all CSVs
Promise.all(attributeFiles.map((d) => d3.csv(d.file))).then((datasets) => {
  const keys = attributeFiles.map((d) => d.column);

  // Merge all datasets (all single-attribute)
  datasets.forEach((data, i) => {
    data.forEach((d) => {
      if (d.County === county) {
        const key = `${d["Tract ID"]}_${d["Year"]}`;
        if (!filteredData.has(key)) {
          filteredData.set(key, {
            "Tract ID": preprocessTractID(d["Tract ID"].replace(".", "")),
            Year: d["Year"],
          });
        }
        filteredData.get(key)[keys[i]] = d[keys[i]];
      }
    });
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
  updateAnnotationsForYear(allAnnotations[year] || []); 
  
  // Initialize stream graph
  initializeStreamGraph();
  
  //draw regions
  d3.json(tractfile).then((topoData) => {
    // Convert TopoJSON to GeoJSON FeatureCollection
    const tracts = topojson.feature(topoData, topoData.objects.tracts || Object.values(topoData.objects)[0]);
    // Fit projection to features
    projection.fitSize([width, height], tracts);
    
    tracts.features.sort((a, b) => +a.properties.id - +b.properties.id);

    //Debug: //Debug: console.log(tracts);

    // Debug: Log the structure of the first tract feature
    console.log("Sample tract feature:", tracts.features[0]);
    console.log("Sample tract properties:", tracts.features[0]?.properties);

    // Draw counties
    svg.selectAll("path").data(tracts.features).enter().append("path")
        .attr("d", path)
        .attr("fill", "#69b3a2")
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.5)
        .style("cursor", "pointer")
        .on('click', function(d) {
            // In D3 v5, the data is the first parameter, not second
            console.log("Clicked tract feature:", d);
            console.log("Tract properties:", d ? d.properties : 'undefined');
            
            if (!d || !d.properties) {
                console.error("No properties found on clicked tract");
                return;
            }
            
            // Try different ways to extract tract ID
            let id = d.properties.id;
            if (typeof id === 'string' && id.length > 5) {
                id = id.substr(5).trim();
            } else if (d.properties.GEOID) {
                id = d.properties.GEOID.toString().substr(5).trim();
            } else if (d.properties.tractce || d.properties.TRACTCE) {
                id = (d.properties.tractce || d.properties.TRACTCE).toString();
            }
            
            console.log("Extracted tract ID:", id);
            updateTractTimeSeries(id);
        })
        .on('mouseover', function(d) {
            if (!d || !d.properties) return;
            
            let id = d.properties.id;
            if (typeof id === 'string' && id.length > 5) {
                id = id.substr(5).trim();
            } else if (d.properties.GEOID) {
                id = d.properties.GEOID.toString().substr(5).trim();
            } else if (d.properties.tractce || d.properties.TRACTCE) {
                id = (d.properties.tractce || d.properties.TRACTCE).toString();
            }
            
            if (id !== selectedTractId) {
                d3.select(this).style("opacity", 0.7);
            }
        })
        .on('mouseout', function(d) {
            if (!d || !d.properties) return;
            
            let id = d.properties.id;
            if (typeof id === 'string' && id.length > 5) {
                id = id.substr(5).trim();
            } else if (d.properties.GEOID) {
                id = d.properties.GEOID.toString().substr(5).trim();
            } else if (d.properties.tractce || d.properties.TRACTCE) {
                id = (d.properties.tractce || d.properties.TRACTCE).toString();
            }
            
            if (id !== selectedTractId) {
                d3.select(this).style("opacity", 1);
            }
        });

    svg.append("g").attr("style", "font-family: 'Lato';");
    //called heatmap here bc need to wait for svg to load and loads on page open
    updateheatmap();
    // After heatmap is updated, NOW we update the barchart
    renderBarChart("#barchart-container", yearData); 
  });
  //console.log(yearData, tractData);
}

yearSlider.onchange = function(){year = yearSlider.value; updateyearData();}; //Debug: console.log(year, yearData);};

// Timeline Annotations

//const yearSlider = document.getElementById("yearSlider");
const selectedYear = document.getElementById("selected-year"); // changes year for slider

selectedYear.textContent = year;

yearSlider.addEventListener("input", () => {
  selectedYear.textContent = yearSlider.value;
});

yearSlider.onchange = function(){
  year = yearSlider.value; 
  updateyearData(); 
  updateAnnotationsForYear(allAnnotations[year] || []);
  updateheatmap();
  renderBarChart("#barchart-container", yearData);
  
};
//color regions
