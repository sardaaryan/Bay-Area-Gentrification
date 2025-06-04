
export function updateAnnotationsForYear(annotations) {
  const annotationContainer = document.getElementById("timeline-annotations");
  annotationContainer.innerHTML = "";  // clear old annotations

  if (!annotations || annotations.length === 0) {
    annotationContainer.textContent = "No annotations for this year.";
    return;
  }

  const ul = document.createElement("ul");
  annotations.forEach(note => {
    const li = document.createElement("li");
    li.textContent = note;
    ul.appendChild(li);
  });
  annotationContainer.appendChild(ul);
}

