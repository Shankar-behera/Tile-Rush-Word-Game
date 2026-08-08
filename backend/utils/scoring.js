// Boggle/Scrabble-ish length-based scoring curve.
function scoreForWord(word) {
  const len = word.length;
  if (len <= 3) return 1;
  if (len === 4) return 2;
  if (len === 5) return 3;
  if (len === 6) return 5;
  if (len === 7) return 8;
  return 11; // 8+
}

module.exports = { scoreForWord };
