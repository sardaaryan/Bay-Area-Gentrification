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
let Scores = []; //holds score data for all years
let tractData = []; //data filtered to specific tract based on heatmap click. STREAM GRAPH
let selectedTractId = null; // Track currently selected tract

const filteredData = new Map(); // key = TractID_Year

//HELPER FUNCTIONS
function updateyearData() {
  yearData = data.filter((d) => String(d.Year) === String(year));
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
function updateregions(colorScale, scores) {
  console.log("scores", scores)
  mapGroup.selectAll("path")
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
// Add vertical color legend
function drawHeatmapLegend(colorScale, minVal, maxVal) {

  if (colorScale === 0) {
    // Display a message in the legend container and return
    d3.select("#heatmap-legend-container")
      .append("div")
      .style("padding", "10px")
      .text("NA :)");
    return;
  }
  const legendHeight = 200;
  const legendWidth = 20;
  const legendMargin = { top: 20, right: 30 };
  
  const legendSvg = d3.select("#heatmap-legend-container")
    .append("svg")
    .attr("viewBox", `0 0 80 ${legendHeight + legendMargin.top * 2}`)
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("preserveAspectRatio", "xMinYMin meet");

  // Add legend title
  legendSvg.append("text")
    .attr("x", legendMargin.right + legendWidth / 2)
    .attr("y", legendMargin.top - 10)
    .attr("font-size", "8px")
    .attr("font-weight", "bold")
    .attr("text-anchor", "middle") // <-- Add this line to center the text
    .text("Gentrification Score");

  const gradientId = "heatmap-gradient";

  // Define gradient
  const defs = legendSvg.append("defs");
  const linearGradient = defs.append("linearGradient")
    .attr("id", gradientId)
    .attr("x1", "0%")
    .attr("y1", "0%")
    .attr("x2", "0%")
    .attr("y2", "100%");

  const numStops = 10;
  const step = 1 / (numStops - 1);
  d3.range(numStops).forEach(i => {
    const t = i * step;
    linearGradient.append("stop")
      .attr("offset", `${t * 100}%`)
      .attr("stop-color", colorScale(minVal + t * (maxVal - minVal)));
  });

  // Draw color bar
  legendSvg.append("rect")
    .attr("x", legendMargin.right)
    .attr("y", legendMargin.top)
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", `url(#${gradientId})`)
    .style("stroke", "#000");

  // Add scale
  const legendScale = d3.scaleLinear()
    .domain([minVal, maxVal])
    .range([legendMargin.top, legendMargin.top+ legendHeight]);

  // Ensure min and max are included as ticks and all are evenly spaced
  const numTicks = 8; // includes min and max
  const tickValues = d3.range(numTicks).map(i =>
    minVal + (i / (numTicks - 1)) * (maxVal - minVal)
  );

  const legendAxis = d3.axisRight(legendScale)
    .tickValues(tickValues)
    .tickFormat(d3.format(".2f"));


  legendSvg.append("g")
    .attr("transform", `translate(${legendMargin.right + legendWidth},0)`)
    .call(legendAxis);
    
}

function getTractScores(){
  // Collect scores for each year from 2011 to 2023
  const heatmapYearScores = [];
  const years = Array.from(new Set(data.map(d => +d.Year))).sort((a, b) => a - b);
  //loop through each year from 2011-2023 and call genScore
  for (let i = 1; i < years.length; i++) {
    //on each iteration assign the previous year data and current year data to variables 
    const prevYear = years[i - 1];
    const currYear = years[i];
    const prevYearData = data.filter(d => +d.Year === prevYear);
    const currYearData = data.filter(d => +d.Year === currYear);

    //call genScore with the two variables and save to a variable called scores
    const scores = genScore(prevYearData, currYearData);

    // Add year property to each score object
    scores.forEach(s => s.year = currYear);

    // Append all scores for this year
    heatmapYearScores.push(...scores);
  }
  return heatmapYearScores;
}

function updateheatmap() {
  //stop calling every damn slider change
  console.log("ALL scores",Scores);
  d3.select("#heatmap-legend-container").selectAll("*").remove(); // clear previous legend
  if (year != "2010") {
    // filter Scores for the current year
    const scores = Scores.filter(s => String(s.year) === String(year));
    // call d3.max on all the years for the max value of the gradients
    const maxScore = d3.max(Scores, d => d && typeof d.score === "number" ? d.score : 0);
    // create the color map with the max
    const colorScale = d3.scaleSequential()
      .domain([0, maxScore])
      .interpolator(d3.interpolateReds);

    // call updateregions passing in the colorScale
    updateregions(colorScale, scores);

    drawHeatmapLegend(colorScale, 0, maxScore);
  } else {
    updateregions(d3.scaleSequential().domain([0, 0]).interpolator(d3.interpolateReds),[]);
    drawHeatmapLegend(0, 0, 0);
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

// --- Add this block for zoom functionality ---
const mapGroup = svg.append("g").attr("class", "map-group");

const zoom = d3.zoom()
  .scaleExtent([1, 8])
  .on("zoom", function() {
    // Get the current transform
    let t = d3.event.transform;
    // Clamp translation so the map stays within the SVG bounds
    const panMargin = 400;
    const maxX = panMargin;
    const maxY = panMargin;
    const minX = width - width * t.k - panMargin;
    const minY = height - height * t.k - panMargin;
    t.x = Math.max(Math.min(t.x, maxX), minX);
    t.y = Math.max(Math.min(t.y, maxY), minY);
    mapGroup.attr("transform", t);
  });
  

svg.call(zoom);
// --- End zoom block ---
//zoom reset
d3.select("#reset-zoom").on("click", function() {
  svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity);
});

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
    mapGroup.selectAll("path").data(tracts.features).enter().append("path")
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
    Scores = getTractScores();
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
  
  // Update stream graph with current tract data if a tract is selected
  if (selectedTractId) {
    updateTractTimeSeries(selectedTractId);
  }
};
