// Load the introductory script once the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // Dynamically append the CSS for the article
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'intro/intro.css';
  document.head.appendChild(link);

  // Fetch and load the HTML content for the article
  fetch('intro/intro.html')
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.text();
    })
    .then(html => {
      // Insert the fetched HTML into the article container
      const articleContainer = document.getElementById('article-container');
      if (articleContainer) {
        articleContainer.innerHTML = html;

        // Re-typeset math content using MathJax, if available
        if (window.MathJax && MathJax.typeset) {
          MathJax.typeset();
        }
      } else {
        console.error('Article container not found.');
      }
    })
    .catch(err => {
      console.error('Failed to load article:', err);
    });
});
