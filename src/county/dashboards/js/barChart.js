document.addEventListener("DOMContentLoaded", () => {
    const svgWidth = 600;
    const svgHeight = 350;
    const margin = { top: 40, right: 30, bottom: 50, left: 70 };
    const width = svgWidth - margin.left - margin.right;
    const height = svgHeight - margin.top - margin.bottom;
  
    const attributes = ["Attr1", "Attr2", "Attr3", "Attr4", "Attr5", "Attr6"];
    
    
    const color = d3.scaleOrdinal().domain(["Attr1", "Attr2", "Attr3", "Attr4", "Attr5", "Attr6"])
    .range([
    "#004d00",  // dark green
    "#4169e1",  // royal blue
    "#8a2be2",  // purple
    "#ffd700",  // gold
    "#1c3d5a",  // slate blue
    "#D32F2F"   // red
  ]);

  
    const container = d3.select("#barchart-container");
    container.selectAll("*").remove();
  
    const svg = container.append("svg")
      .attr("width", svgWidth)
      .attr("height", svgHeight);
  
    const chart = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
  
    const xScale = d3.scaleBand()
      .domain(attributes)
      .range([0, width])
      .padding(0.2);
  
    const yScale = d3.scaleLinear()
      .range([height, 0]);
  
    const xAxisGroup = chart.append("g")
      .attr("transform", `translate(0,${height})`);
  
    const yAxisGroup = chart.append("g");
  
    svg.append("text")
      .attr("x", margin.left + width / 2)
      .attr("y", svgHeight - 10)
      .attr("text-anchor", "middle")
      .attr("class", "axis-label")
      .text("Attributes");
  
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 15)
      .attr("x", -(margin.top + height / 2))
      .attr("text-anchor", "middle")
      .attr("class", "axis-label")
      .text("Average Value");
  
    let data = null;
    let selectedCounty = "San Francisco";
  
    // Load data from external CSV file
    d3.csv("data/data.csv", d3.autoType).then(csvData => {
      data = csvData;
      update(+document.getElementById("yearSlider").value);
    }).catch(error => {
      console.error("Error loading CSV data:", error);
    });
  
    function update(year) {
      if (!data) return;
  
      const filtered = data.filter(d => d.Year === year && d.County === selectedCounty);
  
      if (filtered.length === 0) {
        console.warn(`No data for ${selectedCounty} in ${year}`);
        chart.selectAll(".bar").remove();
        yAxisGroup.call(d3.axisLeft(yScale));
        xAxisGroup.call(d3.axisBottom(xScale));
        return;
      }
  
      const barsData = attributes.map(attr => {
        const values = filtered.map(d => d[attr]);
        return { attribute: attr, value: d3.mean(values) };
      });
  
      yScale.domain([0, d3.max(barsData, d => d.value) * 1.1 || 100]);
  
      const bars = chart.selectAll(".bar")
        .data(barsData, d => d.attribute);
  
      bars.exit().remove();
  
      bars.transition()
        .duration(300)
        .attr("x", d => xScale(d.attribute))
        .attr("y", d => yScale(d.value))
        .attr("width", xScale.bandwidth())
        .attr("height", d => height - yScale(d.value));
  
      bars.enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => xScale(d.attribute))
        .attr("y", d => yScale(0)) // start height 0 for animation
        .attr("width", xScale.bandwidth())
        .attr("height", 0)
        .attr("fill", d => color(d.attribute))
        .transition()
        .duration(300)
        .attr("y", d => yScale(d.value))
        .attr("height", d => height - yScale(d.value));
  
      xAxisGroup.call(d3.axisBottom(xScale));
      yAxisGroup.call(d3.axisLeft(yScale));
    }
  
    // Hook slider:
    const slider = document.getElementById("yearSlider");
    const yearLabel = document.getElementById("selected-year");
    slider.addEventListener("input", e => {
      const year = +e.target.value;
      yearLabel.textContent = year;
      update(year);
    });
  });
  