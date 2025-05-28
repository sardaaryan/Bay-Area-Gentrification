const fs = require("fs");
const path = require("path");
const { feature } = require("topojson-client");
const { topology } = require("topojson-server");

const tractsFile = "./tracts/merged-topojson.json";
const countiesFile = "./counties/filtered-counties.json";
const outputFile = "final-topojson.json";

function readTopojson(filename) {
  const content = fs.readFileSync(path.join(__dirname, filename), "utf8");
  return JSON.parse(content);
}

function extractAllFeatures(topojson) {
  const allFeatures = [];

  for (const objName of Object.keys(topojson.objects)) {
    const feat = feature(topojson, topojson.objects[objName]);
    allFeatures.push(...feat.features);
  }

  return allFeatures;
}

function mergeFeatures(features1, features2) {
  return topology({
    merged: {
      type: "FeatureCollection",
      features: [...features1, ...features2],
    },
  });
}

function main() {
  const tractsTopo = readTopojson(tractsFile);
  const countiesTopo = readTopojson(countiesFile);

  const tractsFeatures = extractAllFeatures(tractsTopo);
  const countiesFeatures = extractAllFeatures(countiesTopo);

  const combinedTopo = mergeFeatures(tractsFeatures, countiesFeatures);

  fs.writeFileSync(outputFile, JSON.stringify(combinedTopo));
  console.log(`✅ Combined TopoJSON saved to ${outputFile}`);
}

main();
