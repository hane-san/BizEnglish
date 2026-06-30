// Compatibility loader for GitHub Pages uploads from iPhone.
// index.html expects src/cards.js, while the actual card data is cards.js at the repository root.
(function(){
  var style = document.createElement('style');
  style.textContent = [
    '.top-mascot{display:none !important;}',
    '.card::after{content:"";position:absolute;right:18px;bottom:18px;width:min(46%,180px);aspect-ratio:4/3;background:url("assets/british_travel_badge.png") center/contain no-repeat;opacity:.055;filter:saturate(.78) sepia(.12);pointer-events:none;z-index:0;transform:rotate(-2deg);}',
    '.card-inner{position:relative;z-index:1;}',
    '@media (max-width:520px){.card::after{right:12px;bottom:12px;width:min(50%,156px);opacity:.052;}}',
    '@media (max-height:720px){.card::after{width:min(44%,130px);opacity:.045;right:10px;bottom:10px;}}'
  ].join('');
  document.head.appendChild(style);
})();
document.write('<script src="cards.js?v=20260630-5"></script>');
