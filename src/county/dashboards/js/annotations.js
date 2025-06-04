// Dummy annotation data (to be replaced with real data later)
/*const annotationData = {
  2010: "2010: Placeholder annotation for gentrification causes and events in this year.",
  2011: "2011: Placeholder annotation for gentrification causes and events in this year.",
  2012: "2012: Placeholder annotation for gentrification causes and events in this year.",
  2013: "2013: Placeholder annotation for gentrification causes and events in this year.",
  2014: "2014: Placeholder annotation for gentrification causes and events in this year.",
  2015: "2015: Placeholder annotation for gentrification causes and events in this year.",
  2016: "2016: Placeholder annotation for gentrification causes and events in this year.",
  2017: "2017: Placeholder annotation for gentrification causes and events in this year.",
  2018: "2018: Placeholder annotation for gentrification causes and events in this year.",
  2019: "2019: Placeholder annotation for gentrification causes and events in this year.",
  2020: "2020: Placeholder annotation for gentrification causes and events in this year.",
  2021: "2021: Placeholder annotation for gentrification causes and events in this year.",
  2022: "2022: Placeholder annotation for gentrification causes and events in this year.",
  2023: "2023: Placeholder annotation for gentrification causes and events in this year."
};

// DOM Elements
const slider = document.getElementById("yearSlider");
const annotationBox = document.getElementById("timeline-annotations");
const yearDisplay = document.getElementById("selected-year");

// Update the annotation and year display based on the slider value
function updateAnnotation(year) {
  yearDisplay.textContent = year;
  annotationBox.textContent = annotationData[year] || "No annotation available for this year.";
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  updateAnnotation(slider.value);

  // Update annotation on slider input
  slider.addEventListener("input", (event) => {
    updateTimeline(event.target.value);
  });
});*/

// annotations.js

/*export function updateAnnotationsForYear(yearKey, annotationsDict) {
  const yearLabel = document.getElementById("selected-year");
  const annotationBox = document.getElementById("timeline-annotations");

  yearLabel.textContent = yearKey;
  const annotations = annotationsDict[yearKey];

  if (!annotations || annotations.length === 0) {
    annotationBox.textContent = "No annotations available for this year.";
    return;
  }

  // Clear and rebuild
  annotationBox.innerHTML = "";
  const ul = document.createElement("ul");
  annotations.forEach(annotationText => {
    const li = document.createElement("li");
    li.textContent = annotationText;
    ul.appendChild(li);
  });
  annotationBox.appendChild(ul);
}*/
export function updateAnnotationsForYear(annotations) {
  const annotationContainer = document.getElementById("timeline-annotations");
  annotationContainer.innerHTML = ""; // clear old annotations

  if (!annotations || annotations.length === 0) {
    annotationContainer.textContent = "No annotations for this year.";
    return;
  }

  const ul = document.createElement("ul");
  annotations.forEach((note) => {
    const li = document.createElement("li");
    li.textContent = note;
    ul.appendChild(li);
  });
  annotationContainer.appendChild(ul);
}
