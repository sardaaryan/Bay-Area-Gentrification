// load in the introductory script
document.addEventListener('DOMContentLoaded', () => {
  // append CSS for article
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'intro/intro.css';
  document.head.appendChild(link);

  fetch('intro/intro.html')
    .then(response => response.text())
    .then(html => {
      document.getElementById('article-container').innerHTML = html;
      // After insertion, re-typeset math
      if (window.MathJax && MathJax.typeset) {
        MathJax.typeset();
      }
    })
    .catch(err => {
      console.error('Failed to load article:', err);
    });
});
