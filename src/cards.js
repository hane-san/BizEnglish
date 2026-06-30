// Compatibility loader for GitHub Pages uploads from iPhone.
// index.html expects src/cards.js, while the actual card data is cards.js at the repository root.
(function(){
  var style = document.createElement('style');
  style.textContent = [
    '.top-mascot{top:5px !important;}',
    '@media (max-height: 720px){.top-mascot{top:4px !important;}}',
    '@media (max-width: 390px){.top-mascot{top:5px !important;}}'
  ].join('');
  document.head.appendChild(style);
})();
document.write('<script src="cards.js?v=20260630-4"></script>');
