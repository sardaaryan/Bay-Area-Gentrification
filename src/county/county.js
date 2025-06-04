import { genScore} from "./dashboards/heatmap.js";
import { updateAnnotationsForYear } from './dashboards/annotations.js';
import { renderBarChart } from './dashboards/barChart.js';
import { countyids, attributeFiles, allAnnotations } from './values.js';

const county = window.location.search.replace("%20", " ").substr(1);

let year = yearSlider.value;

const width = 960, height = 600;


let data = []; //data has all data for current county across all years. ALL DATA FOR COUNTY
let yearData = []; //data filtered to current year on year slider. HEATMAP + BAR CHART
let prevYearData = [] //data filtered for current year
let tractData = []; //data filtered to specific tract based on heatmap click. STREAM GRAPH


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
  tractData = data
    .filter(d => d["Tract ID"] === tractID)
    .sort((a, b) => +a.Year - +b.Year);
  //Debug: console.log(tractID, tractData);
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
    .attr("fill", (d) => {
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
  
  //draw regions
  d3.json(tractfile).then((topoData) => {
    // Convert TopoJSON to GeoJSON FeatureCollection
    const tracts = topojson.feature(topoData, topoData.objects.tracts || Object.values(topoData.objects)[0]);
    // Fit projection to features
    projection.fitSize([width, height], tracts);
    
    tracts.features.sort((a, b) => +a.properties.id - +b.properties.id);

    //Debug: //Debug: console.log(tracts);

    // Draw counties
    svg.selectAll("path").data(tracts.features).enter().append("path").attr("d", path).attr("fill", "#69b3a2").attr("stroke", "#fff")
        .attr("stroke-width", 0.5)
        .on('click', function(d) {
            const id = d.properties.id.substr(5).trim();
            updateTractTimeSeries(id);
            //console.log(tractData);
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

yearSlider.onchange = function(){year = yearSlider.value; updateyearData(); 
  updateAnnotationsForYear(allAnnotations[year] || []);
  updateheatmap();
  renderBarChart("#barchart-container", yearData); 
};
//color regions
