const county = window.location.search.replace("%20", " ").substr(1);
const year = yearSlider.value;

document.getElementById("county_display").textContent = county + " County Heatmap";
