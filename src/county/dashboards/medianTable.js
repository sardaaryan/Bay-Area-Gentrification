// Given a current year and svg container from county.js, render the Median Table
export function renderMedianTable(containerId, currentYearData) {
  const year = currentYearData[0].Year;
  const attributeMap = {
    "Total Population": "Estimate!!Total",
    "Median Home Value": "Median_Home_Value",
    "Median Household Income": "Median_Household_Income",
    "Vacant Units": "Vacant Units",
    "Educational Attainment": "25_Plus_Bachelors_Degree_Or_Higher_Count",
    "Gross Rent": "Median_Gross_Rent"
  };

  const container = d3.select(containerId);
  container.selectAll("*").remove(); // Clear existing content

  const table = container.append("table")
    .attr("class", "median-table");

  const thead = table.append("thead");
  const tbody = table.append("tbody");

  // Header row
  thead.append("tr")
    .selectAll("th")
    .data([`Attribute for ${year}`, "Median Value"])
    .enter()
    .append("th")
    .text(d => d);

  // Compute and append data rows
  Object.entries(attributeMap).forEach(([label, key]) => {
    const values = currentYearData.map(d => +d[key]).filter(v => !isNaN(v));
    const median = d3.median(values);

    const row = tbody.append("tr");
    row.append("td").text(label);
    row.append("td").text(median !== undefined ? median.toLocaleString() : "N/A");
  });
}
