import { genScore} from "./dashboards/heatmap.js";
import { updateAnnotationsForYear } from './dashboards/annotations.js';

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

let data = []; //data has all data for current county across all years. ALL DATA FOR COUNTY
let yearData = []; //data filtered to current year on year slider. HEATMAP + BAR CHART
let prevYearData = [] //data filtered for current year
let tractData = []; //data filtered to specific tract based on heatmap click. STREAM GRAPH

const attributeFiles = [
  { file: "../data/edu_attain.csv", column: "25_Plus_Bachelors_Degree_Or_Higher_Count" },
  { file: "../data/gross_rent.csv", column: "Median_Gross_Rent" },
  { file: "../data/home_value.csv", column: "Median_Home_Value" },
  { file: "../data/house_income.csv", column: "Median_Household_Income" },
  { file: "../data/total_pop.csv", column: "Estimate!!Total" },
];

const occFile = "../data/vac_status.csv"; // has: Total Housing Units, Vacant Units
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

// Load and merge all CSVs
Promise.all([...attributeFiles.map((d) => d3.csv(d.file)), d3.csv(occFile)]).then(([edu, rent, homeVal, income, totalPop, vacStatus]) => {
  const datasets = [edu, rent, homeVal, income, totalPop];
  const keys = attributeFiles.map((d) => d.column);

  // Merge all single-attribute datasets
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

  // Merge occ_status (multiple columns)
  vacStatus.forEach((d) => {
    if (d.County === county) {
      const key = `${d["Tract ID"]}_${d["Year"]}`;
      if (!filteredData.has(key)) {
        filteredData.set(key, {
          "Tract ID": preprocessTractID(d["Tract ID"].replace(".", "")),
          Year: d["Year"],
        });
      }
      const entry = filteredData.get(key);
      entry["Vacant Units"] = d["Vacant Units"];
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
        });

    svg.append("g").attr("style", "font-family: 'Lato';");
    //called heatmap here bc need to wait for svg to load and loads on page open
    updateheatmap();
  });
  console.log(yearData, tractData);
  
}

yearSlider.onchange = function(){year = yearSlider.value; updateyearData();}; //Debug: console.log(year, yearData);};

// Timeline Annotations
const allAnnotations = {
  "2010": [
        "Apple introduces the tablet computer iPad that sells one million units in less than one month",
        "Apple is worth $205 billion, third in the US after Exxon and Microsoft",
        "Facebook has 500 million users",
        "Microsoft’s Internet Explorer has 59.9% of the browser market.",
        "The smartphone market grows 55%; 269 million units are sold"
    ],
  "2011": [
        "Steve Jobs dies in Palo Alto",
        "Snapchat is started by 2 Stanford students: Reggie Brown and Evan Spiegel.",
        "Apple has more cash and securities ($76 Billion) than the US Government..."
    ],
  "2012": [
        "Tesla launches the Tesla Model S",
        "Facebook goes public and is the biggest high-tech IPO in history.",
        "Apple replaces Google Maps with its own mapping service...",
        "Yahoo! launches an acquisition spree of 16 startups including Tumblr."
    ],
  "2013": [
        "Worldwide sales of smartphones pass the one billion mark...",
        "8th generation consoles are introduced: Xbox One, PS4, Wii U using AMD chips...",
        "Unity relocates HQ to San Francisco.",
        "Artists flee SF for Oakland, rising rents bring in yuppies.",
        "61.5% of traffic on the Web is not human",
        "50 billionth application is downloaded from the Apple Stores.",
        "Russell Energy Center goes online in Hayward.",
        "Quip launches collaborative doc app.",
        "Pebble introduces a smartwatch via Kickstarter.",
        "Uber launches UberX.",
        "90% of the world’s data created in last 2 years.",
        "92% of smartphones run Silicon Valley-made OS (Android = 75%).",
        "Smartphones pass 1 billion units; PC sales decline 9.8%."
    ],
  "2014": [
        "Tim Cook presents Apple Watch, iPhone 6, and iPhone 6 Plus in Cupertino.",
        "Console decline affects Nintendo; smartphone gaming rises.",
        "First-ever NFT minted.",
        "Airbnb reaches 600k rooms in 160 countries.",
        "Uber reaches 230+ cities, 1M rides/day, valued at $40B.",
        "Brooklyn Basin revitalization by Chinese firm Zarsion.",
        "Patreon average contributions hit $1M.",
        "Apple sells its 500 millionth iPhone.",
        "Facebook hits 1.3B users, Google 68% of US searches.",
        "LinkedIn has 300M members."
    ],
  "2015": [
        "Snapchat surpasses 6B daily video views.",
        "Candy Crush acquired by Blizzard, 500M downloads.",
        "Google open-sources TensorFlow.",
        "Apple launches Apple Music.",
        "Bay Area dominates global tech, would rank 3rd in GDP/capita if independent.",
        "Airbnb and Uber become largest hotel/taxi companies without owning assets.",
        "AppDynamics becomes unicorn.",
        "77 Geary St's galleries shrink to one.",
        "Gilead Sciences becomes largest biotech with $150B market cap.",
        "Tablet sales decline by 8%.",
        "Discord launches.",
        "Neo4j becomes world's most popular graph database.",
        "USA has 144 unicorns worth $505B."
    ],
  "2016": [
        "Verizon purchases Yahoo; massive data breaches revealed.",
        "Bay Area has more biotech startups than rest of US combined.",
        "Magic Leap valued at $4.5B without product demo.",
        "Sony Interactive Entertainment moves to San Mateo.",
        "Palo Alto has more billionaires than most cities.",
        "Mobile devices surpass desktops for internet use."
    ],
  "2017": [
        "ARM ships 100B smartphone chips.",
        "Kaggle becomes go-to for neural networks; acquired by Google.",
        "Messaging apps worth hundreds of billions.",
        "Nintendo Switch becomes fastest-selling console.",
        "Tesla factory in Fremont becomes one of CA's biggest.",
        "Pleasanton raises more startup money than Philly or Miami.",
        "Uber buys 24k Volvos for $1B, valued at $120B.",
        "Zoox becomes unicorn in 3 years.",
        "Denmark appoints ambassador to Silicon Valley.",
        "Grail raises $1B to use software to detect cancer.",
        "128 unicorns in SV (¾ of global total)."
    ],
  "2018": [
        "Apple's smartphone market share shrinks; Huawei, Xiaomi, Oppo rise.",
        "EV startups raise $2B in months; mostly in CA.",
        "Apple acquires Shazam.",
        "Microsoft acquires GitHub ($7.5B) and OpenAI ($1B).",
        "KindredAI relocates to SF.",
        "Uber has 3.9M drivers; still most valued unicorn."
    ],
  "2019": [
      "High-tech companies, since 1985, had risen 41% in value on their first day of trading (becoming public). Uber’s stock lost 7.6%, crashing from $120 Billion valuation to $76.5 Billion after the first day. This was one of many cases where unicorns, highly valued, would crash after their initial public offering.",
      "The first 5G smartphones are introduced.",
      "Apple sells more watches than all the Swiss manufacturers combined."
    ],
  "2020": [
      "The global coronavirus pandemic begins, accelerating the transition to the online world. Bay Area tech companies have record profits.",
      "Austin (another major national tech-hub) had deals of $2.3 billion, against the Bay Area’s $61.5 billion, in this year.",
      "Apple, Google, Amazon, Microsoft, and Facebook all post record profits thanks to a boom in cloud computing during the covid pandemic.",
      "TikTok becomes the world’s most downloaded app."
    ],
  "2021": [
      "Tesla relocates from the Bay Area to Texas. Other corporations follow suit: Oracle, Palantir, Hewlett-Packard, Enterprise. Texas ends up acquiring 114 of the 265 California companies that relocate from the Bay.",
      "Stripe, a platform for online and mobile payments, becomes the most valuable start-up in the USA, worth $95 billion."
    ],
  "2022": [
      "In November 2022, OpenAI released ChatGPT, and Silicon Valley was thrown into a frenzy.",
      "Austin boasted a $4.9 billion investment of venture capital this year. In San Francisco, in the month of January, it was $5 billion. The Bay Area captured $74.9 Billion, and New York finished second in the year at $45.36 billion.",
      "San Francisco declares a state of emergency for the Tenderloin district, devastated by drug use and homelessness.",
      "The median salary of software engineers in the Bay Area skyrocket to $230,000. The Silicon Valley Business Journal estimates that 5% of tech salaries were almost $700,000.",
      "Apple becomes the first company to reach the $3 trillion valuation. Higher than the GDP of Britain.",
      "Nvidia is the world’s most valuable designer of semiconductors, with a market value of $468 billion.",
      "Only 5 Bay Area companies hold IPOs. The ecosystem of startups goes the way of the dinosaur, as larger companies acquire talent, offering greater incentives than those of a self-starter.",
      "Between April 2020 (when lockdowns began) and July 2022 (when census data was collected) about 250,000 people left the Bay Area region, prompted by expenses and the remote nature of work in tech.",
      "Zoom becomes the biggest success story of the pandemic; by the end of 2022 its market share of videoconferencing is more than 50%.",
      "From 2019-2022, half of San Francisco’s prosecutors resign.",
      "Nearly 200,000 tech employees are laid off. Stocks plummet: Apple by $846 Billion, Amazon by $834 Billion.",
      "Discord (based in San Francisco) is worth $15 Billion in 2023.",
      "Elon Musk buys Twitter.",
      "The US government enacts the Chips & Sciences Act to boost national semiconductor research."
    ],
  "2023": [
      "Meta (formerly Facebook), launches Threads, a Twitter competitor, which receives 30 million downloads in 16 hours. A few weeks later, Twitter becomes X.",
      "Gordon Moore, co-founder of Intel and proponent of Moore’s Law, dies, marking the end of an era in Silicon Valley.",
      "Following a massive withdrawal of funds, the Silicon Valley Bank collapses, marking the biggest bank failure in the US since the 2008 recession.",
      "Amazon shuts down its Whole Foods store, citing concerns about Bay Area safety. Nordstrom follows suit by closing both its clothing stores in San Francisco.",
      "Office vacancy rises to a record 32% in spring, the highest rate of any major US city.",
      "From 2020-2023, San Francisco loses 7.5% of its population."
  ]
};

//const yearSlider = document.getElementById("yearSlider");
const selectedYear = document.getElementById("selected-year"); // changes year for slider

selectedYear.textContent = year;

yearSlider.addEventListener("input", () => {
  selectedYear.textContent = yearSlider.value;
});

yearSlider.onchange = function(){year = yearSlider.value; updateyearData(); 
  updateAnnotationsForYear(allAnnotations[year] || []);
};

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
    console.log("scores ",scores);
    updateregions(scores);
    
  } else {
    const scores = []; // no valid data
    updateregions(scores);
  }
  
}
yearSlider.onchange = function(){year = yearSlider.value; updateheatmap();};
//color regions
