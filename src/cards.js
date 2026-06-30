// Compatibility loader for GitHub Pages uploads from iPhone.
// index.html expects src/cards.js, while cards.js may live at the repository root.
(function(){
  var style = document.createElement('style');
  style.textContent = [
    '.travel-badge-sticker{top:12px !important;}',
    '@media (max-width: 520px){.travel-badge-sticker{top:9px !important; right:12px !important;}}',
    '@media (max-height: 720px){.travel-badge-sticker{top:8px !important; right:10px !important;}}'
  ].join('');
  document.head.appendChild(style);
})();
document.write('<script src="../cards.js?v=20260630-3"></script>');
