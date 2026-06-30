#!/usr/bin/env node
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const cardsPath = path.join(__dirname, '..', 'src', 'cards.js');
const code = fs.readFileSync(cardsPath, 'utf8');
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(code, sandbox, { filename: cardsPath });
const cards = sandbox.window.BIZ_ENG_CARDS;

const required = [
  'category', 'promptJa', 'situation', 'coreText', 'coreKana', 'coreJa',
  'businessText', 'businessJa', 'commsText', 'commsJa', 'markers'
];
let errors = [];
if (!Array.isArray(cards)) {
  errors.push('window.BIZ_ENG_CARDS must be an array.');
} else {
  cards.forEach((card, i) => {
    required.forEach((key) => {
      if (!(key in card)) errors.push(`card ${i + 1}: missing ${key}`);
    });
    if (card.markers && !Array.isArray(card.markers)) errors.push(`card ${i + 1}: markers must be an array`);
    ['coreText','businessText','commsText'].forEach((key) => {
      if (typeof card[key] === 'string' && /\.{4,}/.test(card[key])) {
        errors.push(`card ${i + 1}: ${key} has too many dots; use ... at most`);
      }
    });
  });
}

if (errors.length) {
  console.error('Card validation failed:\n' + errors.map(e => `- ${e}`).join('\n'));
  process.exit(1);
}
console.log(`OK: ${cards.length} cards validated.`);
