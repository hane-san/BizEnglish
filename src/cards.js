// Compatibility loader for GitHub Pages uploads from iPhone.
// index.html expects src/cards.js, while the actual card data is cards.js at the repository root.
(function(){
  var style = document.createElement('style');
  style.textContent = [
    '.top-mascot,.travel-badge-sticker{display:none !important;}',
    '.card::after{content:"";position:absolute;right:18px;bottom:18px;width:min(42%,168px);aspect-ratio:4/3;background:url("assets/british_travel_badge.png") center/contain no-repeat;opacity:.045;filter:saturate(.72) sepia(.10);pointer-events:none;z-index:0;transform:rotate(-2deg);}',
    '.card-inner{position:relative;z-index:1;}',
    '.question-ja{font-family:var(--jp) !important;font-size:clamp(17px,4.75vw,26px) !important;line-height:1.38 !important;letter-spacing:-.035em !important;font-weight:800 !important;text-wrap:initial !important;word-break:normal !important;line-break:strict !important;color:#263149 !important;}',
    '.question-wrap{gap:14px !important;padding-top:clamp(18px,4.2svh,36px) !important;}',
    '.situation{font-family:var(--jp) !important;font-size:clamp(10.5px,2.85vw,12.5px) !important;line-height:1.62 !important;letter-spacing:-.02em !important;}',
    '.answer-block:first-child .ja{font-family:var(--jp) !important;font-size:clamp(10.8px,3.0vw,13px) !important;line-height:1.50 !important;letter-spacing:-.02em !important;}',
    '@media (max-width:520px){.card::after{right:12px;bottom:12px;width:min(44%,144px);opacity:.04;}.question-ja{font-size:clamp(16.5px,4.55vw,24px) !important;line-height:1.40 !important;}}',
    '@media (max-height:720px){.card::after{width:min(38%,118px);opacity:.035;right:10px;bottom:10px;}.question-ja{font-size:clamp(15.8px,4.35vw,22px) !important;line-height:1.36 !important;}.question-wrap{gap:11px !important;padding-top:clamp(14px,3.4svh,26px) !important;}}'
  ].join('');
  document.head.appendChild(style);
})();
document.write('<script src="cards.js?v=20260630-6"></script>');
document.write('<script>(function(){var cards=window.BIZ_ENG_CARDS||[];cards.forEach(function(c){if(c.coreJa){c.promptJa=c.coreJa;}});})();</script>');
