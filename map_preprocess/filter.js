const fs = require("fs");

// Combined FIPS code list
const targetIDs = new Set(["06001", "06013", "06041", "06055", "06075", "06081", "06085", "06095", "06097"]);
//const mapCountyIDs = ["06087", "06047", "06099", "06077", "06009", "06005", "06017", "06067", "06113", "06101", "06011", "06033", "06045", "06061", "06057", "06115"];
//const targetIDs = new Set([...bayAreaCountyIDs]);

// Load the original TopoJSON
const topojson = JSON.parse(fs.readFileSync("06.topo.json", "utf8"));

//Error Check
if (!topojson.objects || !topojson.objects.counties) {
  console.error("Missing 'objects.counties' in cali.json");
  process.exit(1);
}

// Filter counties
const originalCounties = topojson.objects.counties.geometries;
const filteredCounties = originalCounties.filter((geom) => targetIDs.has(geom.properties.id));


// Replace with filtered counties
topojson.objects.counties.geometries = filteredCounties;

// Write filtered TopoJSON to file
fs.writeFileSync("filtered-counties.topo.json", JSON.stringify(topojson));

console.log("filtered-counties.json created successfully");
