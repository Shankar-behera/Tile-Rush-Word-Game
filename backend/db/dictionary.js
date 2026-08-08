const fs = require('fs');
const path = require('path');

// Loaded once at server startup. ~248k common English words.
// Using a Set gives O(1) lookups instead of hitting SQLite for every guess.
const wordList = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'words.json'), 'utf8')
);

const dictionary = new Set(wordList);

function isValidWord(word) {
  if (!word || typeof word !== 'string') return false;
  return dictionary.has(word.toLowerCase().trim());
}

module.exports = { isValidWord, size: dictionary.size };
